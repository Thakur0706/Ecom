import CRMRecord from "../models/CRMRecord.js";

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

function normalizeAmount(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

function calculateSegment(record) {
  const lifetimeValue = normalizeAmount(record.lifetimeValue);
  const totalOrders = Number(record.totalOrders || 0);
  const totalBookings = Number(record.totalBookings || 0);
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_IN_MS);

  if (lifetimeValue > 5000) {
    return "high_value";
  }

  if (totalOrders > 3 || totalBookings > 3 || totalOrders + totalBookings > 3) {
    return "active";
  }

  if (
    record.lastActivityAt &&
    new Date(record.lastActivityAt) < thirtyDaysAgo
  ) {
    return "at_risk";
  }

  return "new";
}

async function findOrCreateCRMRecord(userId) {
  let record = await CRMRecord.findOne({ userId });

  if (!record) {
    record = new CRMRecord({ userId });
  }

  return record;
}

async function saveCRMRecord(record) {
  record.segment = calculateSegment(record);
  await record.save();
  return record;
}

export async function updateCRMOnOrder(userId, orderAmount) {
  const record = await findOrCreateCRMRecord(userId);
  const now = new Date();
  const amount = normalizeAmount(orderAmount);

  record.totalOrders += 1;
  record.totalSpent = Number(
    (normalizeAmount(record.totalSpent) + amount).toFixed(2),
  );
  record.lifetimeValue = Number(
    (normalizeAmount(record.lifetimeValue) + amount).toFixed(2),
  );
  record.lastActivityAt = now;

  if (!record.firstPurchaseAt) {
    record.firstPurchaseAt = now;
  }

  return saveCRMRecord(record);
}

export async function updateCRMOnBooking(userId, bookingAmount) {
  const record = await findOrCreateCRMRecord(userId);
  const now = new Date();
  const amount = normalizeAmount(bookingAmount);

  record.totalBookings += 1;
  record.totalSpent = Number(
    (normalizeAmount(record.totalSpent) + amount).toFixed(2),
  );
  record.lifetimeValue = Number(
    (normalizeAmount(record.lifetimeValue) + amount).toFixed(2),
  );
  record.lastActivityAt = now;

  if (!record.firstPurchaseAt) {
    record.firstPurchaseAt = now;
  }

  return saveCRMRecord(record);
}

export async function getCRMStats() {
  const [total, bySegmentRows, averages] = await Promise.all([
    CRMRecord.countDocuments(),
    CRMRecord.aggregate([
      {
        $group: {
          _id: "$segment",
          count: { $sum: 1 },
        },
      },
    ]),
    CRMRecord.aggregate([
      {
        $group: {
          _id: null,
          avgLifetimeValue: { $avg: "$lifetimeValue" },
          avgSatisfaction: { $avg: "$satisfactionScore" },
        },
      },
    ]),
  ]);

  const bySegment = {
    new: 0,
    active: 0,
    high_value: 0,
    at_risk: 0,
    churned: 0,
  };

  bySegmentRows.forEach((row) => {
    if (row?._id && Object.prototype.hasOwnProperty.call(bySegment, row._id)) {
      bySegment[row._id] = row.count;
    }
  });

  return {
    total,
    bySegment,
    avgLifetimeValue: Number((averages[0]?.avgLifetimeValue || 0).toFixed(2)),
    avgSatisfaction: Number((averages[0]?.avgSatisfaction || 0).toFixed(2)),
  };
}

export async function getCRMRecords(filters = {}, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const query = {};

  // Filter by segment
  if (filters.segment) {
    query.segment = filters.segment;
  }

  // Sort options
  const sortOptions = {};
  if (filters.sortBy === "totalSpent") {
    sortOptions.totalSpent = -1;
  } else if (filters.sortBy === "lastActivityAt") {
    sortOptions.lastActivityAt = -1;
  } else if (filters.sortBy === "totalOrders") {
    sortOptions.totalOrders = -1;
  } else {
    sortOptions.lastActivityAt = -1; // Default sort
  }

  const [records, total] = await Promise.all([
    CRMRecord.find(query)
      .populate("userId", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    CRMRecord.countDocuments(query),
  ]);

  return {
    records,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function updateCRMNotes(
  userId,
  notes,
  satisfactionScore,
  tags = [],
) {
  const updateData = { notes };

  if (satisfactionScore) {
    updateData.satisfactionScore = satisfactionScore;
  }

  if (tags && tags.length > 0) {
    updateData.tags = tags;
  }

  const crmRecord = await CRMRecord.findOneAndUpdate({ userId }, updateData, {
    new: true,
    runValidators: true,
  }).populate("userId", "name email");

  return crmRecord;
}

export async function getTopCustomers(limit = 5) {
  return CRMRecord.find()
    .populate("userId", "name email")
    .sort({ lifetimeValue: -1 })
    .limit(limit)
    .lean();
}

import mongoose from 'mongoose';
import { ROLES, SERVICE_STATUS } from '../constants/enums.js';
import AdminRevenue from '../models/AdminRevenue.js';
import Service from '../models/Service.js';
import { AppError, sendResponse } from '../utils/http.js';

const REQUIRED_CREATE_FIELDS = ['title', 'description', 'category', 'price', 'imageUrl', 'availability'];
const IMMUTABLE_UPDATE_FIELDS = new Set([
  'ownedByAdmin',
  'adminId',
  'revenueType',
  'supplierId',
  'isActive',
]);
const TRIMMABLE_FIELDS = ['title', 'description', 'category', 'imageUrl', 'availability', 'duration'];

function ensureAdminUser(req) {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    throw new AppError('Only admins can access this resource.', 403);
  }
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeStatus(value) {
  if (value === undefined) {
    return value;
  }

  if (value === 'approved') {
    return SERVICE_STATUS.ACTIVE;
  }

  return value;
}

function validateCreateBody(body) {
  const missingFields = REQUIRED_CREATE_FIELDS.filter((field) => {
    const value = body[field];

    if (field === 'price') {
      return value === undefined || value === null || value === '';
    }

    return typeof value !== 'string' || !value.trim();
  });

  if (missingFields.length > 0) {
    throw new AppError(`Missing required fields: ${missingFields.join(', ')}.`, 400);
  }

  const price = Number(body.price);

  if (!Number.isFinite(price) || price < 0) {
    throw new AppError('Price must be a valid non-negative number.', 400);
  }
}

function sanitizeUpdateBody(body) {
  const sanitized = {};

  Object.entries(body || {}).forEach(([key, value]) => {
    if (IMMUTABLE_UPDATE_FIELDS.has(key)) {
      return;
    }

    if (key === 'price') {
      const price = Number(value);

      if (!Number.isFinite(price) || price < 0) {
        throw new AppError('Price must be a valid non-negative number.', 400);
      }

      sanitized.price = price;
      return;
    }

    if (key === 'status') {
      sanitized.status = normalizeStatus(value);
      return;
    }

    sanitized[key] = TRIMMABLE_FIELDS.includes(key) ? normalizeString(value) : value;
  });

  return sanitized;
}

function serializeAdminService(service) {
  if (!service) {
    return null;
  }

  const isActive =
    service.isActive !== undefined ? service.isActive : service.status !== SERVICE_STATUS.INACTIVE;

  return {
    id: service._id,
    title: service.title,
    description: service.description,
    category: service.category,
    price: service.price,
    imageUrl: service.imageUrl,
    availability: service.availability,
    duration: service.duration,
    status: service.status,
    isActive,
    ownedByAdmin: service.ownedByAdmin,
    adminId: service.adminId,
    supplierId: service.supplierId ?? null,
    revenueType: service.revenueType,
    isFeatured: service.isFeatured,
    averageRating: service.averageRating,
    reviewCount: service.reviewCount,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

function buildOwnedAdminServiceFilter(serviceId, adminId) {
  if (!mongoose.isValidObjectId(serviceId)) {
    throw new AppError('Service not found.', 404);
  }

  return {
    _id: serviceId,
    ownedByAdmin: true,
    adminId,
  };
}

export async function createAdminService(req, res) {
  ensureAdminUser(req);
  validateCreateBody(req.body);

  const service = await Service.create({
    title: normalizeString(req.body.title),
    description: normalizeString(req.body.description),
    category: normalizeString(req.body.category),
    price: Number(req.body.price),
    imageUrl: normalizeString(req.body.imageUrl),
    availability: normalizeString(req.body.availability),
    duration: normalizeString(req.body.duration) || '',
    supplierId: null,
    ownedByAdmin: true,
    adminId: req.user._id,
    revenueType: 'admin',
    status: SERVICE_STATUS.ACTIVE,
  });

  await Service.updateOne(
    { _id: service._id },
    {
      $set: {
        isActive: true,
      },
    },
    { strict: false },
  );

  const createdService = await Service.findById(service._id).lean();

  return sendResponse(res, 201, true, 'Admin service created successfully.', {
    service: serializeAdminService(createdService),
  });
}

export async function updateAdminService(req, res) {
  ensureAdminUser(req);

  const filter = buildOwnedAdminServiceFilter(req.params.id, req.user._id);
  const existingService = await Service.findOne(filter).lean();

  if (!existingService) {
    throw new AppError('Service not found.', 404);
  }

  const updates = sanitizeUpdateBody(req.body);

  if (Object.keys(updates).length === 0) {
    return sendResponse(res, 200, true, 'Admin service updated successfully.', {
      service: serializeAdminService(existingService),
    });
  }

  const updatedService = await Service.findOneAndUpdate(
    filter,
    { $set: updates },
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  return sendResponse(res, 200, true, 'Admin service updated successfully.', {
    service: serializeAdminService(updatedService),
  });
}

export async function deleteAdminService(req, res) {
  ensureAdminUser(req);

  const filter = buildOwnedAdminServiceFilter(req.params.id, req.user._id);
  const service = await Service.findOne(filter).lean();

  if (!service) {
    throw new AppError('Service not found.', 404);
  }

  await Service.updateOne(
    filter,
    {
      $set: {
        isActive: false,
        status: SERVICE_STATUS.INACTIVE,
      },
    },
    { strict: false },
  );

  return sendResponse(res, 200, true, 'Admin service deleted successfully.', {});
}

export async function getAdminServices(req, res) {
  ensureAdminUser(req);

  const services = await Service.find({
    ownedByAdmin: true,
    adminId: req.user._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  const activeCount = services.filter(
    (service) =>
      service.isActive !== false && normalizeStatus(service.status) !== SERVICE_STATUS.INACTIVE,
  ).length;

  return sendResponse(res, 200, true, 'Admin services fetched successfully.', {
    services: services.map(serializeAdminService),
    totalCount: services.length,
    activeCount,
  });
}

export async function getAdminServiceRevenue(req, res) {
  ensureAdminUser(req);

  const match = {
    adminId: new mongoose.Types.ObjectId(req.user._id),
    sourceType: 'service_booking',
  };

  const [monthlyBreakdown, totals] = await Promise.all([
    AdminRevenue.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$earnedAt' },
            month: { $month: '$earnedAt' },
          },
          revenue: { $sum: '$amount' },
          bookings: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]),
    AdminRevenue.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalBookings: { $sum: 1 },
        },
      },
    ]),
  ]);

  const monthlyRevenue = monthlyBreakdown.map((entry) => {
    const labelDate = new Date(Date.UTC(entry._id.year, entry._id.month - 1, 1));

    return {
      year: entry._id.year,
      month: entry._id.month,
      label: labelDate.toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }),
      revenue: Number(Number(entry.revenue || 0).toFixed(2)),
      bookings: entry.bookings,
    };
  });

  const summary = totals[0] || { totalRevenue: 0, totalBookings: 0 };

  return sendResponse(res, 200, true, 'Admin service revenue fetched successfully.', {
    monthlyRevenue,
    totalRevenue: Number(Number(summary.totalRevenue || 0).toFixed(2)),
    totalBookings: summary.totalBookings || 0,
  });
}

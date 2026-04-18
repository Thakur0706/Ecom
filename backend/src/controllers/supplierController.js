import { ROLES, SUPPLIER_STATUS } from '../constants/enums.js';
import { SupplierProfile } from '../models/SupplierProfile.js';
import { SupplierLedger } from '../models/SupplierLedger.js';
import { User } from '../models/User.js';
import { getSupplierLedgerSummary } from '../utils/ledger.js';
import { AppError, sendResponse } from '../utils/http.js';
import { buildPagination, getPagination } from '../utils/pagination.js';
import { serializeSupplierProfile } from '../utils/serializers.js';

export async function applyForSupplier(req, res) {
  if (req.user.role === ROLES.ADMIN) {
    throw new AppError('Admins cannot apply for supplier access.', 403);
  }

  const profile = await SupplierProfile.findOneAndUpdate(
    { userId: req.user._id },
    {
      ...req.body,
      userId: req.user._id,
      status: SUPPLIER_STATUS.PENDING,
      rejectionReason: '',
      approvedAt: null,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return sendResponse(res, 200, true, 'Supplier application submitted successfully.', {
    supplierProfile: serializeSupplierProfile(profile),
  });
}

export async function getSupplierStatus(req, res) {
  const supplierProfile = await SupplierProfile.findOne({ userId: req.user._id });

  return sendResponse(res, 200, true, 'Supplier status fetched successfully.', {
    status: supplierProfile?.status || 'not-applied',
    supplierProfile: serializeSupplierProfile(supplierProfile),
  });
}

export async function getSupplierLedgerEntries(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { supplierId: req.user._id };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [entries, total] = await Promise.all([
    SupplierLedger.find(filter)
      .populate('orderId', 'transactionId totalAmount orderStatus')
      .populate('productId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SupplierLedger.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Supplier ledger fetched successfully.', {
    entries,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getSupplierLedgerSummaryController(req, res) {
  const summary = await getSupplierLedgerSummary(req.user._id);

  return sendResponse(res, 200, true, 'Supplier ledger summary fetched successfully.', {
    summary,
  });
}

export async function requestSupplierPayment(req, res) {
  const profile = await SupplierProfile.findOne({ userId: req.user._id });

  if (!profile) {
    throw new AppError('Supplier profile not found.', 404);
  }

  profile.paymentRequestRaised = true;
  profile.paymentRequestRaisedAt = new Date();
  profile.paymentRequestNote = req.body.note || '';
  await profile.save();

  return sendResponse(res, 200, true, 'Payment request raised successfully.', {
    supplierProfile: serializeSupplierProfile(profile),
  });
}

export async function getSupplierApplications(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { status: SUPPLIER_STATUS.PENDING };
  const [profiles, total] = await Promise.all([
    SupplierProfile.find(filter)
      .populate('userId', 'name email profilePictureUrl isActive createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SupplierProfile.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Pending supplier applications fetched successfully.', {
    applications: profiles.map((profile) => ({
      ...serializeSupplierProfile(profile),
      user: profile.userId,
    })),
    pagination: buildPagination(page, limit, total),
  });
}

export async function approveSupplierApplication(req, res) {
  const profile = await SupplierProfile.findById(req.params.id).populate('userId');

  if (!profile) {
    throw new AppError('Supplier application not found.', 404);
  }

  profile.status = SUPPLIER_STATUS.APPROVED;
  profile.rejectionReason = '';
  profile.approvedAt = new Date();
  await profile.save();

  profile.userId.role = ROLES.SUPPLIER;
  await profile.userId.save();

  return sendResponse(res, 200, true, 'Supplier approved successfully.', {
    supplierProfile: serializeSupplierProfile(profile),
  });
}

export async function rejectSupplierApplication(req, res) {
  const profile = await SupplierProfile.findById(req.params.id).populate('userId');

  if (!profile) {
    throw new AppError('Supplier application not found.', 404);
  }

  profile.status = SUPPLIER_STATUS.REJECTED;
  profile.rejectionReason = req.body.rejectionReason;
  profile.approvedAt = null;
  await profile.save();

  if (profile.userId.role !== ROLES.ADMIN) {
    profile.userId.role = ROLES.BUYER;
    await profile.userId.save();
  }

  return sendResponse(res, 200, true, 'Supplier rejected successfully.', {
    supplierProfile: serializeSupplierProfile(profile),
  });
}

async function buildSupplierAdminRecord(user) {
  const [profile, summary] = await Promise.all([
    SupplierProfile.findOne({ userId: user._id }),
    getSupplierLedgerSummary(user._id),
  ]);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    supplierProfile: serializeSupplierProfile(profile),
    payableAmount: summary.pending,
    totalEarned: summary.earned,
    totalPaid: summary.paid,
  };
}

export async function getAdminSuppliers(req, res) {
  const suppliers = await User.find({ role: ROLES.SUPPLIER }).sort({ createdAt: -1 });
  const records = await Promise.all(suppliers.map(buildSupplierAdminRecord));

  return sendResponse(res, 200, true, 'Suppliers fetched successfully.', {
    suppliers: records,
  });
}

export async function getAdminSupplierDetail(req, res) {
  const supplier = await User.findById(req.params.id);

  if (!supplier || supplier.role !== ROLES.SUPPLIER) {
    throw new AppError('Supplier not found.', 404);
  }

  const [profile, ledgerEntries, summary] = await Promise.all([
    SupplierProfile.findOne({ userId: supplier._id }),
    SupplierLedger.find({ supplierId: supplier._id })
      .populate('orderId', 'transactionId totalAmount orderStatus')
      .populate('productId', 'title')
      .sort({ createdAt: -1 }),
    getSupplierLedgerSummary(supplier._id),
  ]);

  return sendResponse(res, 200, true, 'Supplier detail fetched successfully.', {
    supplier: {
      id: supplier._id,
      name: supplier.name,
      email: supplier.email,
      isActive: supplier.isActive,
    },
    supplierProfile: serializeSupplierProfile(profile),
    ledgerEntries,
    summary,
  });
}

export async function getAdminSupplierLedger(req, res) {
  const supplier = await User.findById(req.params.id);

  if (!supplier || supplier.role !== ROLES.SUPPLIER) {
    throw new AppError('Supplier not found.', 404);
  }

  const entries = await SupplierLedger.find({ supplierId: supplier._id })
    .populate('orderId', 'transactionId totalAmount orderStatus')
    .populate('productId', 'title')
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, true, 'Supplier ledger fetched successfully.', {
    entries,
  });
}

export async function getSupplierPaymentRequests(req, res) {
  const profiles = await SupplierProfile.find({
    paymentRequestRaised: true,
  }).populate('userId', 'name email');

  const requests = await Promise.all(
    profiles.map(async (profile) => {
      const summary = await getSupplierLedgerSummary(profile.userId._id);

      return {
        supplierId: profile.userId._id,
        name: profile.userId.name,
        email: profile.userId.email,
        requestedAt: profile.paymentRequestRaisedAt,
        note: profile.paymentRequestNote,
        pendingAmount: summary.pending,
      };
    }),
  );

  return sendResponse(res, 200, true, 'Supplier payment requests fetched successfully.', {
    requests,
  });
}

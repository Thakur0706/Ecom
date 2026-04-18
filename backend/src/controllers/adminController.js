import {
  LISTING_SOURCE,
  PRODUCT_STATUS,
  ROLES,
  SUPPLIER_STATUS,
} from '../constants/enums.js';
import { Booking } from '../models/Booking.js';
import CRMRecord from '../models/CRMRecord.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Service } from '../models/Service.js';
import { SupplierProfile } from '../models/SupplierProfile.js';
import { User } from '../models/User.js';
import { getCRMStats } from '../utils/crmHelpers.js';
import {
  createSupplierPayment as createSupplierPaymentEntry,
  getSupplierLedgerSummary,
} from '../utils/ledger.js';
import { AppError, sendResponse } from '../utils/http.js';
import { buildPagination, getPagination } from '../utils/pagination.js';
import { serializeUser } from '../utils/serializers.js';

function buildLast30Days() {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = 29; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);

    days.push({
      key: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: 0,
      orders: 0,
      bookings: 0,
    });
  }

  return days;
}

function buildRevenueChart(orders, bookings) {
  const days = buildLast30Days();
  const dayMap = new Map(days.map((day) => [day.key, day]));

  orders
    .filter((order) => order.orderStatus !== 'cancelled')
    .forEach((order) => {
      const key = new Date(order.createdAt).toISOString().slice(0, 10);
      const bucket = dayMap.get(key);

      if (bucket) {
        bucket.revenue += Number(order.totalAmount || 0);
        bucket.orders += 1;
      }
    });

  bookings
    .filter((booking) => booking.bookingStatus !== 'cancelled')
    .forEach((booking) => {
      const key = new Date(booking.createdAt).toISOString().slice(0, 10);
      const bucket = dayMap.get(key);

      if (bucket) {
        bucket.revenue += Number(booking.totalAmount || 0);
        bucket.bookings += 1;
      }
    });

  return days;
}

function buildTopProducts(orders, products) {
  const productMeta = new Map(products.map((product) => [product._id.toString(), product]));
  const aggregates = new Map();

  orders
    .filter((order) => order.orderStatus !== 'cancelled')
    .forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productId.toString();
        const current = aggregates.get(key) || {
          productId: key,
          title: item.title,
          category: item.category,
          unitsSold: 0,
          revenue: 0,
          quotedRevenue: 0,
          currentStock: productMeta.get(key)?.availableStock || 0,
        };

        current.unitsSold += Number(item.quantity || 0);
        current.revenue += Number(item.lineTotal || 0);
        current.quotedRevenue += Number(item.supplierPayable || 0);
        current.currentStock = productMeta.get(key)?.availableStock || 0;
        aggregates.set(key, current);
      });
    });

  return [...aggregates.values()]
    .map((item) => ({
      ...item,
      platformProfit: Number((item.revenue - item.quotedRevenue).toFixed(2)),
    }))
    .sort((left, right) => right.revenue - left.revenue || right.unitsSold - left.unitsSold)
    .slice(0, 10);
}

function buildCategoryAnalytics(products, orders) {
  const categoryMap = new Map();

  products.forEach((product) => {
    const current = categoryMap.get(product.category) || {
      category: product.category,
      listings: 0,
      unitsSold: 0,
      revenue: 0,
    };

    current.listings += 1;
    categoryMap.set(product.category, current);
  });

  orders
    .filter((order) => order.orderStatus !== 'cancelled')
    .forEach((order) => {
      order.items.forEach((item) => {
        const current = categoryMap.get(item.category) || {
          category: item.category || 'Uncategorized',
          listings: 0,
          unitsSold: 0,
          revenue: 0,
        };

        current.unitsSold += Number(item.quantity || 0);
        current.revenue += Number(item.lineTotal || 0);
        categoryMap.set(item.category || 'Uncategorized', current);
      });
    });

  return [...categoryMap.values()].sort((left, right) => right.revenue - left.revenue);
}

function getOrderStatusBreakdown(orders) {
  return {
    placed: orders.filter((order) => order.orderStatus === 'placed').length,
    confirmed: orders.filter((order) => order.orderStatus === 'confirmed').length,
    shipped: orders.filter((order) => order.orderStatus === 'shipped').length,
    delivered: orders.filter((order) => order.orderStatus === 'delivered').length,
    cancelled: orders.filter((order) => order.orderStatus === 'cancelled').length,
  };
}

function getBookingStatusBreakdown(bookings) {
  return {
    pending: bookings.filter((booking) => booking.bookingStatus === 'pending').length,
    confirmed: bookings.filter((booking) => booking.bookingStatus === 'confirmed').length,
    completed: bookings.filter((booking) => booking.bookingStatus === 'completed').length,
    cancelled: bookings.filter((booking) => booking.bookingStatus === 'cancelled').length,
  };
}

async function getSupplierPayables() {
  const suppliers = await User.find({ role: ROLES.SUPPLIER }).select('name email');
  const payables = await Promise.all(
    suppliers.map(async (supplier) => {
      const summary = await getSupplierLedgerSummary(supplier._id);

      return {
        supplierId: supplier._id,
        name: supplier.name,
        email: supplier.email,
        pending: summary.pending,
        paid: summary.paid,
        earned: summary.earned,
      };
    }),
  );

  return payables.sort((left, right) => right.pending - left.pending);
}

function ensureAdminRequest(req) {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    throw new AppError('Only admins can access this resource.', 403);
  }
}

function serializeAdminOwnedProduct(product) {
  if (!product) {
    return null;
  }

  const sellingPrice =
    product.sellingPrice === null || product.sellingPrice === undefined
      ? product.quotedPrice
      : product.sellingPrice;

  return {
    id: product._id,
    title: product.title,
    description: product.description,
    category: product.category,
    condition: product.condition,
    imageUrl: product.imageUrl,
    price: sellingPrice,
    stock: product.availableStock,
    quotedPrice: product.quotedPrice,
    sellingPrice,
    finalPrice: product.finalPrice,
    availableStock: product.availableStock,
    lowStockThreshold: product.lowStockThreshold,
    status: product.status,
    listedByAdmin: product.listedByAdmin,
    adminId: product.adminId,
    supplierId: product.supplierId,
    revenueType: product.revenueType,
    listingSource: product.listingSource,
    isFeatured: product.isFeatured,
    isFlashSale: product.isFlashSale,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function serializeCRMRecord(record) {
  if (!record) {
    return null;
  }

  const hasPopulatedUser =
    Boolean(record.userId) &&
    typeof record.userId === 'object' &&
    record.userId.name !== undefined;
  const resolvedUserId = hasPopulatedUser ? record.userId._id : record.userId;

  return {
    id: record._id,
    userId: resolvedUserId,
    user: hasPopulatedUser
      ? {
          id: record.userId._id,
          name: record.userId.name || '',
          email: record.userId.email || '',
        }
      : null,
    totalOrders: record.totalOrders,
    totalBookings: record.totalBookings,
    totalSpent: record.totalSpent,
    lastActivityAt: record.lastActivityAt,
    firstPurchaseAt: record.firstPurchaseAt,
    segment: record.segment,
    satisfactionScore: record.satisfactionScore,
    lifetimeValue: record.lifetimeValue,
    notes: record.notes,
    tags: record.tags || [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function normalizeCRMTags(tags) {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => String(tag || '').trim())
      .filter(Boolean);
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function validateAdminProductCreateBody(body) {
  const requiredFields = ['title', 'description', 'category', 'condition', 'imageUrl'];
  const missingFields = requiredFields.filter(
    (field) => typeof body[field] !== 'string' || !body[field].trim(),
  );

  if (body.price === undefined || body.price === null || body.price === '') {
    missingFields.push('price');
  }

  if (body.stock === undefined || body.stock === null || body.stock === '') {
    missingFields.push('stock');
  }

  if (missingFields.length) {
    throw new AppError(`Missing required fields: ${missingFields.join(', ')}.`, 400);
  }

  const price = Number(body.price);
  const stock = Number(body.stock);

  if (!Number.isFinite(price) || price < 0) {
    throw new AppError('Price must be a valid non-negative number.', 400);
  }

  if (!Number.isInteger(stock) || stock < 0) {
    throw new AppError('Stock must be a valid non-negative integer.', 400);
  }
}

function applyAdminProductUpdates(product, payload) {
  const immutableFields = new Set([
    'listedByAdmin',
    'adminId',
    'revenueType',
    'supplierId',
    'listingSource',
  ]);

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (immutableFields.has(key)) {
      return;
    }

    if (key === 'price') {
      const price = Number(value);

      if (!Number.isFinite(price) || price < 0) {
        throw new AppError('Price must be a valid non-negative number.', 400);
      }

      product.quotedPrice = price;
      product.sellingPrice = price;
      return;
    }

    if (key === 'stock') {
      const stock = Number(value);

      if (!Number.isInteger(stock) || stock < 0) {
        throw new AppError('Stock must be a valid non-negative integer.', 400);
      }

      product.availableStock = stock;
      return;
    }

    product[key] = typeof value === 'string' ? value.trim() : value;
  });
}

export async function getAdminDashboardOverview(req, res) {
  const [
    totalUsers,
    totalSuppliers,
    pendingApplications,
    products,
    services,
    orders,
    bookings,
    supplierPayables,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: ROLES.ADMIN } }),
    User.countDocuments({ role: ROLES.SUPPLIER }),
    SupplierProfile.countDocuments({ status: SUPPLIER_STATUS.PENDING }),
    Product.find({}),
    Service.find({}),
    Order.find({}),
    Booking.find({}),
    getSupplierPayables(),
  ]);

  const activeServices = services.filter((service) => service.status === 'active').length;
  const liveProducts = products.filter((product) => product.status === 'approved').length;
  const lowStockProducts = products.filter((product) => product.hasLowStockAlert).length;
  const grossProductRevenue = orders
    .filter((order) => order.orderStatus !== 'cancelled')
    .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const grossServiceRevenue = bookings
    .filter((booking) => booking.bookingStatus !== 'cancelled')
    .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);
  
  // Profit calculation: 
  // For Products: sum(order.totalAmount) - sum(item.supplierPayable)
  // For Services: for now platform takes 100% or we can assume a fixed service margin if needed. 
  // Given current model, let's assume services are direct but if they had suppliers we'd subtract them.
  const totalProductSupplierPayables = orders
    .filter((order) => order.orderStatus !== 'cancelled')
    .reduce((sum, order) => {
      const orderPayable = order.items.reduce((iSum, item) => iSum + Number(item.supplierPayable || 0), 0);
      return sum + orderPayable;
    }, 0);

  const grossProductProfit = grossProductRevenue - totalProductSupplierPayables;
  const totalPendingSupplierPayouts = supplierPayables.reduce(
    (sum, supplier) => sum + Number(supplier.pending || 0),
    0,
  );

  return sendResponse(res, 200, true, 'Admin overview fetched successfully.', {
    overview: {
      totalUsers,
      totalSuppliers,
      pendingApplications,
      totalProducts: products.length,
      liveProducts,
      totalServices: services.length,
      activeServices,
      totalOrders: orders.length,
      totalBookings: bookings.length,
      grossProductRevenue: Number(grossProductRevenue.toFixed(2)),
      grossServiceRevenue: Number(grossServiceRevenue.toFixed(2)),
      grossRevenue: Number((grossProductRevenue + grossServiceRevenue).toFixed(2)),
      grossProfit: Number((grossProductProfit + grossServiceRevenue).toFixed(2)), // Assuming 100% margin on services for now
      totalPendingSupplierPayouts: Number(totalPendingSupplierPayouts.toFixed(2)),
      lowStockProducts,
    },
  });
}

export async function getAdminRevenueChart(req, res) {
  const [orders, bookings] = await Promise.all([Order.find({}), Booking.find({})]);

  return sendResponse(res, 200, true, 'Revenue chart fetched successfully.', {
    chart: buildRevenueChart(orders, bookings),
  });
}

export async function getAdminTopProducts(req, res) {
  const [orders, products] = await Promise.all([Order.find({}), Product.find({})]);

  return sendResponse(res, 200, true, 'Top products fetched successfully.', {
    products: buildTopProducts(orders, products),
  });
}

export async function getAdminAnalytics(req, res) {
  const [products, services, orders, bookings, supplierPayables] = await Promise.all([
    Product.find({}),
    Service.find({}),
    Order.find({}),
    Booking.find({}),
    getSupplierPayables(),
  ]);

  const productRevenue = orders
    .filter((order) => order.orderStatus !== 'cancelled')
    .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const serviceRevenue = bookings
    .filter((booking) => booking.bookingStatus !== 'cancelled')
    .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);

  return sendResponse(res, 200, true, 'Analytics fetched successfully.', {
    revenueChart: buildRevenueChart(orders, bookings),
    topProducts: buildTopProducts(orders, products),
    categoryAnalytics: buildCategoryAnalytics(products, orders),
    orderStatusBreakdown: getOrderStatusBreakdown(orders),
    bookingStatusBreakdown: getBookingStatusBreakdown(bookings),
    revenue: {
      productRevenue: Number(productRevenue.toFixed(2)),
      serviceRevenue: Number(serviceRevenue.toFixed(2)),
      totalRevenue: Number((productRevenue + serviceRevenue).toFixed(2)),
      totalProfit: Number((
        (productRevenue - orders.filter(o => o.orderStatus !== 'cancelled').reduce((s, o) => s + o.items.reduce((is, i) => is + (i.supplierPayable || 0), 0), 0)) + 
        serviceRevenue
      ).toFixed(2)),
    },
    lowStockProducts: products
      .filter((product) => product.hasLowStockAlert)
      .map((product) => ({
        id: product._id,
        title: product.title,
        availableStock: product.availableStock,
        lowStockThreshold: product.lowStockThreshold,
      })),
    supplierPayables,
    servicesSummary: {
      total: services.length,
      active: services.filter((service) => service.status === 'active').length,
    },
  });
}

export async function createAdminProduct(req, res) {
  ensureAdminRequest(req);
  validateAdminProductCreateBody(req.body);

  const price = Number(req.body.price);
  const stock = Number(req.body.stock);

  const product = await Product.create({
    title: req.body.title.trim(),
    description: req.body.description.trim(),
    category: req.body.category.trim(),
    condition: req.body.condition.trim(),
    imageUrl: req.body.imageUrl.trim(),
    supplierId: null,
    listedByAdmin: true,
    adminId: req.user._id,
    listingSource: LISTING_SOURCE.ADMIN,
    revenueType: 'admin',
    quotedPrice: price,
    sellingPrice: price,
    availableStock: stock,
    status: PRODUCT_STATUS.APPROVED,
    approvedAt: new Date(),
    approvedBy: req.user._id,
  });

  return sendResponse(res, 201, true, 'Admin product created successfully.', {
    product: serializeAdminOwnedProduct(product),
  });
}

export async function getAdminProducts(req, res) {
  ensureAdminRequest(req);

  const products = await Product.find({
    listedByAdmin: true,
    adminId: req.user._id,
  }).sort({ createdAt: -1 });

  return sendResponse(res, 200, true, 'Admin products fetched successfully.', {
    products: products.map((product) => serializeAdminOwnedProduct(product)),
    count: products.length,
    activeCount: products.filter((product) => product.status === PRODUCT_STATUS.APPROVED).length,
  });
}

export async function updateAdminProduct(req, res) {
  ensureAdminRequest(req);

  const product = await Product.findOne({
    _id: req.params.id,
    listedByAdmin: true,
    adminId: req.user._id,
  });

  if (!product) {
    throw new AppError('Admin product not found.', 404);
  }

  applyAdminProductUpdates(product, req.body);

  if (product.status === PRODUCT_STATUS.PENDING) {
    product.status = PRODUCT_STATUS.APPROVED;
  }

  await product.save();

  return sendResponse(res, 200, true, 'Admin product updated successfully.', {
    product: serializeAdminOwnedProduct(product),
  });
}

export async function getCRMOverview(req, res) {
  ensureAdminRequest(req);

  const [stats, topCustomerRecords] = await Promise.all([
    getCRMStats(),
    CRMRecord.find({ lifetimeValue: { $gt: 5000 } })
      .populate('userId', 'name email')
      .sort({ lifetimeValue: -1, totalSpent: -1 })
      .limit(5),
  ]);

  return sendResponse(res, 200, true, 'CRM overview fetched successfully.', {
    stats,
    topCustomers: topCustomerRecords.map((record) => serializeCRMRecord(record)),
  });
}

export async function getCRMCustomers(req, res) {
  ensureAdminRequest(req);

  const { page, limit, skip } = getPagination({
    ...req.query,
    limit: req.query.limit || 20,
  });
  const filter = {};
  const allowedSegments = new Set(['new', 'active', 'high_value', 'at_risk', 'churned']);
  const sortBy = req.query.sortBy;
  const sortMap = {
    totalSpent: { totalSpent: -1, lifetimeValue: -1 },
    lastActivityAt: { lastActivityAt: -1, updatedAt: -1 },
    totalOrders: { totalOrders: -1, totalBookings: -1 },
  };

  if (req.query.segment && allowedSegments.has(req.query.segment)) {
    filter.segment = req.query.segment;
  }

  const [records, total] = await Promise.all([
    CRMRecord.find(filter)
      .populate('userId', 'name email')
      .sort(sortMap[sortBy] || { lastActivityAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CRMRecord.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'CRM customers fetched successfully.', {
    customers: records.map((record) => serializeCRMRecord(record)),
    pagination: buildPagination(page, limit, total),
  });
}

export async function updateCRMRecord(req, res) {
  ensureAdminRequest(req);

  const record = await CRMRecord.findOne({ userId: req.params.userId }).populate(
    'userId',
    'name email',
  );

  if (!record) {
    throw new AppError('CRM record not found.', 404);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'notes')) {
    record.notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : '';
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'tags')) {
    record.tags = normalizeCRMTags(req.body.tags);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'satisfactionScore')) {
    const rawScore = req.body.satisfactionScore;

    if (rawScore === null || rawScore === '') {
      record.satisfactionScore = null;
    } else {
      const score = Number(rawScore);

      if (!Number.isFinite(score) || score < 1 || score > 5) {
        throw new AppError('Satisfaction score must be a number between 1 and 5.', 400);
      }

      record.satisfactionScore = score;
    }
  }

  await record.save();

  return sendResponse(res, 200, true, 'CRM record updated successfully.', {
    record: serializeCRMRecord(record),
  });
}

export async function getUsers(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.role) {
    filter.role = req.query.role;
  }

  if (req.query.isActive === 'true') {
    filter.isActive = true;
  }

  if (req.query.isActive === 'false') {
    filter.isActive = false;
  }

  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Users fetched successfully.', {
    users: users.map(serializeUser),
    pagination: buildPagination(page, limit, total),
  });
}

export async function toggleUserStatus(req, res) {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError('You cannot change your own admin account status.', 400);
  }

  user.isActive = req.body.isActive;
  await user.save();

  return sendResponse(res, 200, true, 'User status updated successfully.', {
    user: serializeUser(user),
  });
}

export async function createSupplierPayment(req, res) {
  const supplier = await User.findById(req.params.id);

  if (!supplier || supplier.role !== ROLES.SUPPLIER) {
    throw new AppError('Supplier not found.', 404);
  }

  const payment = await createSupplierPaymentEntry({
    supplierId: supplier._id,
    amount: req.body.amount,
    method: req.body.method,
    reference: req.body.reference,
    notes: req.body.notes,
  });

  if (!payment) {
    throw new AppError('No pending supplier credits matched this payment amount.', 400);
  }

  await SupplierProfile.findOneAndUpdate(
    { userId: supplier._id },
    {
      $set: {
        paymentRequestRaised: false,
        paymentRequestRaisedAt: null,
        paymentRequestNote: '',
      },
    },
  );

  return sendResponse(res, 201, true, 'Supplier payment created successfully.', {
    payment,
    summary: await getSupplierLedgerSummary(supplier._id),
  });
}

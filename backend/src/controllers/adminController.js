import { Booking } from '../models/Booking.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { SellerProfile } from '../models/SellerProfile.js';
import { Service } from '../models/Service.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { User } from '../models/User.js';
import { LISTING_STATUS, ROLES, SELLER_STATUS } from '../constants/enums.js';
import { approveSellerApplication, rejectSellerApplication } from './sellerController.js';
import {
  bucketOrdersByMonth,
  bucketUsersByMonth,
  getDateRangeFilter,
  toObjectIdString,
} from '../utils/analytics.js';
import { toCsv } from '../utils/csv.js';
import { AppError, sendResponse } from '../utils/http.js';
import { buildPagination, getPagination } from '../utils/pagination.js';
import { serializeSellerProfile, serializeUser } from '../utils/serializers.js';

function buildTopProducts(orders) {
  const productMap = new Map();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = toObjectIdString(item.productId);
      const current = productMap.get(key) || {
        productId: key,
        title: item.title,
        category: item.category || 'Uncategorized',
        revenue: 0,
        unitsSold: 0,
      };

      current.revenue += item.price * item.quantity;
      current.unitsSold += item.quantity;
      productMap.set(key, current);
    });
  });

  return [...productMap.values()]
    .sort((left, right) => right.revenue - left.revenue || right.unitsSold - left.unitsSold)
    .slice(0, 10);
}

async function buildTopSellers(orders) {
  const sellerIds = [...new Set(orders.map((order) => toObjectIdString(order.sellerId)).filter(Boolean))];
  const sellers = await User.find({ _id: { $in: sellerIds } }).select('name email');
  const sellerMap = new Map(sellers.map((seller) => [seller._id.toString(), seller]));
  const revenueMap = new Map();

  orders.forEach((order) => {
    const key = toObjectIdString(order.sellerId);
    const current = revenueMap.get(key) || {
      sellerId: key,
      sellerName: sellerMap.get(key)?.name || 'Unknown seller',
      sellerEmail: sellerMap.get(key)?.email || '',
      revenue: 0,
      orderCount: 0,
    };

    current.revenue += order.totalAmount;
    current.orderCount += 1;
    revenueMap.set(key, current);
  });

  return [...revenueMap.values()]
    .sort((left, right) => right.revenue - left.revenue || right.orderCount - left.orderCount)
    .slice(0, 10);
}

function getReviewBreakdown(reviews) {
  return [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
  }));
}

async function buildCustomerSummaries() {
  const [users, orders] = await Promise.all([
    User.find({ role: { $ne: ROLES.ADMIN } }).sort({ createdAt: -1 }),
    Order.find({}),
  ]);

  return users.map((user) => {
    const purchaseOrders = orders.filter((order) => toObjectIdString(order.buyerId) === user._id.toString());
    const salesOrders = orders.filter((order) => toObjectIdString(order.sellerId) === user._id.toString());
    const deliveredSales = salesOrders.filter((order) => order.orderStatus === 'delivered');

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      totalOrders: purchaseOrders.length,
      totalSpent: purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      totalSales: deliveredSales.reduce((sum, order) => sum + order.totalAmount, 0),
    };
  });
}

export async function getAdminDashboardOverview(req, res) {
  const [totalUsers, totalSellers, pendingApprovals, totalProducts, totalServices, totalOrders, deliveredOrders] =
    await Promise.all([
      User.countDocuments({ role: { $ne: ROLES.ADMIN } }),
      User.countDocuments({ role: ROLES.SELLER }),
      SellerProfile.countDocuments({ status: SELLER_STATUS.PENDING }),
      Product.countDocuments({}),
      Service.countDocuments({}),
      Order.countDocuments({}),
      Order.find({ orderStatus: 'delivered' }),
    ]);

  const totalPlatformRevenue = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  return sendResponse(res, 200, true, 'Admin overview fetched successfully.', {
    overview: {
      totalUsers,
      totalSellers,
      pendingApprovals,
      totalProducts,
      totalServices,
      totalOrders,
      totalPlatformRevenue,
    },
  });
}

export async function getPendingSellers(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { status: SELLER_STATUS.PENDING };
  const [profiles, total] = await Promise.all([
    SellerProfile.find(filter)
      .populate('userId', 'name email profilePictureUrl isActive createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SellerProfile.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Pending seller applications fetched successfully.', {
    sellers: profiles,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getSellerApplicationDetail(req, res) {
  const sellerProfile = await SellerProfile.findById(req.params.id).populate(
    'userId',
    'name email profilePictureUrl isActive createdAt',
  );

  if (!sellerProfile) {
    throw new AppError('Seller application not found.', 404);
  }

  return sendResponse(res, 200, true, 'Seller application fetched successfully.', {
    sellerProfile,
  });
}

export async function approveSeller(req, res) {
  const sellerProfile = await approveSellerApplication(req.params.id);

  return sendResponse(res, 200, true, 'Seller approved successfully.', {
    sellerProfile: serializeSellerProfile(sellerProfile),
  });
}

export async function rejectSeller(req, res) {
  const sellerProfile = await rejectSellerApplication(req.params.id, req.body.rejectionReason);

  return sendResponse(res, 200, true, 'Seller rejected successfully.', {
    sellerProfile: serializeSellerProfile(sellerProfile),
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

export async function getAdminProducts(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { category: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Products fetched successfully.', {
    products,
    pagination: buildPagination(page, limit, total),
  });
}

export async function approveProduct(req, res) {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  product.status = LISTING_STATUS.APPROVED;
  product.isActive = true;
  await product.save();

  return sendResponse(res, 200, true, 'Product approved successfully.', {
    product,
  });
}

export async function removeProduct(req, res) {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  product.status = LISTING_STATUS.REMOVED;
  product.isActive = false;
  await product.save();

  return sendResponse(res, 200, true, 'Product removed successfully.', {
    product,
  });
}

export async function getAdminServices(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { category: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [services, total] = await Promise.all([
    Service.find(filter)
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Service.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Services fetched successfully.', {
    services,
    pagination: buildPagination(page, limit, total),
  });
}

export async function approveService(req, res) {
  const service = await Service.findById(req.params.id);

  if (!service) {
    throw new AppError('Service not found.', 404);
  }

  service.status = LISTING_STATUS.APPROVED;
  service.isActive = true;
  await service.save();

  return sendResponse(res, 200, true, 'Service approved successfully.', {
    service,
  });
}

export async function removeService(req, res) {
  const service = await Service.findById(req.params.id);

  if (!service) {
    throw new AppError('Service not found.', 404);
  }

  service.status = LISTING_STATUS.REMOVED;
  service.isActive = false;
  await service.save();

  return sendResponse(res, 200, true, 'Service removed successfully.', {
    service,
  });
}

export async function getAdminOrders(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {
    ...getDateRangeFilter(req.query.from, req.query.to),
  };

  if (req.query.status) {
    filter.orderStatus = req.query.status;
  }

  if (req.query.seller) {
    filter.sellerId = req.query.seller;
  }

  if (req.query.buyer) {
    filter.buyerId = req.query.buyer;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Orders fetched successfully.', {
    orders,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getAdminErpOverview(req, res) {
  const [users, products, services, orders, tickets] = await Promise.all([
    User.find({ role: { $ne: ROLES.ADMIN } }),
    Product.find({}),
    Service.find({}),
    Order.find({}),
    SupportTicket.find({}),
  ]);

  const thisMonth = new Date();
  const newSignups = users.filter(
    (user) =>
      user.createdAt.getUTCFullYear() === thisMonth.getUTCFullYear() &&
      user.createdAt.getUTCMonth() === thisMonth.getUTCMonth(),
  ).length;

  return sendResponse(res, 200, true, 'Admin ERP overview fetched successfully.', {
    platformHealth: {
      activeUsers: users.filter((user) => user.isActive).length,
      newSignups,
      listingActivity: {
        total: products.length + services.length,
        pending:
          products.filter((item) => item.status === LISTING_STATUS.PENDING).length +
          services.filter((item) => item.status === LISTING_STATUS.PENDING).length,
        approved:
          products.filter((item) => item.status === LISTING_STATUS.APPROVED).length +
          services.filter((item) => item.status === LISTING_STATUS.APPROVED).length,
        removed:
          products.filter((item) => item.status === LISTING_STATUS.REMOVED).length +
          services.filter((item) => item.status === LISTING_STATUS.REMOVED).length,
      },
      orderStatusDistribution: {
        placed: orders.filter((order) => order.orderStatus === 'placed').length,
        confirmed: orders.filter((order) => order.orderStatus === 'confirmed').length,
        shipped: orders.filter((order) => order.orderStatus === 'shipped').length,
        delivered: orders.filter((order) => order.orderStatus === 'delivered').length,
        cancelled: orders.filter((order) => order.orderStatus === 'cancelled').length,
      },
      supportTickets: {
        open: tickets.filter((ticket) => ticket.status === 'open').length,
        inProgress: tickets.filter((ticket) => ticket.status === 'in-progress').length,
        resolved: tickets.filter((ticket) => ticket.status === 'resolved').length,
        closed: tickets.filter((ticket) => ticket.status === 'closed').length,
      },
    },
    revenueChart: bucketOrdersByMonth(orders.filter((order) => order.orderStatus === 'delivered')),
  });
}

export async function getAdminRevenueChart(req, res) {
  const deliveredOrders = await Order.find({ orderStatus: 'delivered' });

  return sendResponse(res, 200, true, 'Platform revenue chart fetched successfully.', {
    chart: bucketOrdersByMonth(deliveredOrders),
  });
}

export async function getAdminTickets(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate('raisedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SupportTicket.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Support tickets fetched successfully.', {
    tickets,
    pagination: buildPagination(page, limit, total),
  });
}

export async function resolveTicket(req, res) {
  const ticket = await SupportTicket.findById(req.params.id).populate('raisedBy', 'name email');

  if (!ticket) {
    throw new AppError('Support ticket not found.', 404);
  }

  ticket.status = req.body.status;
  ticket.adminNote = req.body.adminNote;
  await ticket.save();

  return sendResponse(res, 200, true, 'Support ticket updated successfully.', {
    ticket,
  });
}

export async function getAdminCrmCustomers(req, res) {
  const customers = await buildCustomerSummaries();
  const reviews = await Review.find({});

  return sendResponse(res, 200, true, 'Admin CRM customers fetched successfully.', {
    customers,
    topBuyers: [...customers]
      .sort((left, right) => right.totalSpent - left.totalSpent)
      .slice(0, 5),
    topSellers: [...customers]
      .filter((customer) => customer.role === ROLES.SELLER)
      .sort((left, right) => right.totalSales - left.totalSales)
      .slice(0, 5),
    satisfaction: {
      score:
        reviews.length > 0
          ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(2))
          : 0,
      reviewBreakdown: getReviewBreakdown(reviews),
    },
  });
}

export async function getAdminActivityFeed(req, res) {
  const [users, orders, reviews] = await Promise.all([
    User.find({ role: { $ne: ROLES.ADMIN } }).sort({ createdAt: -1 }).limit(10),
    Order.find({})
      .populate('buyerId', 'name')
      .sort({ createdAt: -1 })
      .limit(10),
    Review.find({})
      .populate('reviewerId', 'name')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  const activities = [
    ...users.map((user) => ({
      id: `user-${user._id}`,
      type: 'registration',
      text: `${user.name} created an account.`,
      createdAt: user.createdAt,
    })),
    ...orders.map((order) => ({
      id: `order-${order._id}`,
      type: 'order',
      text: `${order.buyerId?.name || 'A buyer'} placed order ${order._id}.`,
      createdAt: order.createdAt,
    })),
    ...reviews.map((review) => ({
      id: `review-${review._id}`,
      type: 'review',
      text: `${review.reviewerId?.name || 'A user'} left a ${review.rating}-star review.`,
      createdAt: review.createdAt,
    })),
  ]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 20);

  return sendResponse(res, 200, true, 'Activity feed fetched successfully.', {
    activities,
  });
}

export async function getAdminRevenueTrend(req, res) {
  const deliveredOrders = await Order.find({ orderStatus: 'delivered' });

  return sendResponse(res, 200, true, 'Revenue trend fetched successfully.', {
    trend: bucketOrdersByMonth(deliveredOrders),
  });
}

export async function getAdminTopSellers(req, res) {
  const deliveredOrders = await Order.find({ orderStatus: 'delivered' });

  return sendResponse(res, 200, true, 'Top sellers fetched successfully.', {
    sellers: await buildTopSellers(deliveredOrders),
  });
}

export async function getAdminTopProducts(req, res) {
  const deliveredOrders = await Order.find({ orderStatus: 'delivered' });

  return sendResponse(res, 200, true, 'Top products fetched successfully.', {
    products: buildTopProducts(deliveredOrders),
  });
}

export async function getAdminUserGrowth(req, res) {
  const users = await User.find({ role: { $ne: ROLES.ADMIN } });

  return sendResponse(res, 200, true, 'User growth fetched successfully.', {
    growth: bucketUsersByMonth(users),
  });
}

export async function generateAdminReport(req, res) {
  const type = req.query.type;
  const dateFilter = getDateRangeFilter(req.query.from, req.query.to);
  let rows = [];

  if (!['orders', 'users', 'sellers', 'revenue', 'product-performance'].includes(type)) {
    throw new AppError('Invalid report type.', 400);
  }

  if (type === 'orders') {
    const orders = await Order.find(dateFilter)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    rows = orders.map((order) => ({
      orderId: order._id,
      buyerName: order.buyerId?.name || '',
      sellerName: order.sellerId?.name || '',
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString(),
    }));
  }

  if (type === 'users') {
    const users = await User.find({
      role: { $ne: ROLES.ADMIN },
      ...dateFilter,
    });

    rows = users.map((user) => ({
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    }));
  }

  if (type === 'sellers') {
    const sellerProfiles = await SellerProfile.find(dateFilter).populate('userId', 'name email');

    rows = sellerProfiles.map((profile) => ({
      sellerProfileId: profile._id,
      userName: profile.userId?.name || '',
      userEmail: profile.userId?.email || '',
      collegeName: profile.collegeName,
      department: profile.department,
      status: profile.status,
      approvedAt: profile.approvedAt ? profile.approvedAt.toISOString() : '',
    }));
  }

  if (type === 'revenue') {
    const deliveredOrders = await Order.find({
      orderStatus: 'delivered',
      ...dateFilter,
    });

    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    rows = [
      {
        deliveredOrders: deliveredOrders.length,
        totalRevenue,
        averageOrderValue: deliveredOrders.length ? totalRevenue / deliveredOrders.length : 0,
      },
    ];
  }

  if (type === 'product-performance') {
    const deliveredOrders = await Order.find({
      orderStatus: 'delivered',
      ...dateFilter,
    });

    rows = buildTopProducts(deliveredOrders);
  }

  const csv = toCsv(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
  return res.status(200).send(csv);
}

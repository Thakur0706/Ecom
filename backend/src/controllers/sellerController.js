import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { SellerProfile } from '../models/SellerProfile.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { LISTING_STATUS, ROLES, SELLER_STATUS } from '../constants/enums.js';
import { sendSellerApplicationDecisionEmail } from '../services/emailService.js';
import { getDateRangeFilter, bucketOrdersByMonth, toObjectIdString } from '../utils/analytics.js';
import { toCsv } from '../utils/csv.js';
import { AppError, sendResponse } from '../utils/http.js';
import { serializeSellerProfile } from '../utils/serializers.js';

function parseDateRange(query) {
  return getDateRangeFilter(query.from, query.to);
}

async function getSellerOwnedTargetIds(sellerId) {
  const [products, services] = await Promise.all([
    Product.find({ sellerId }).select('_id'),
    Service.find({ sellerId }).select('_id'),
  ]);

  return {
    productIds: products.map((product) => product._id),
    serviceIds: services.map((service) => service._id),
  };
}

async function getSellerCombinedReviews(sellerId) {
  const { productIds, serviceIds } = await getSellerOwnedTargetIds(sellerId);

  return Review.find({
    $or: [
      { targetType: 'seller', targetId: sellerId },
      { targetType: 'product', targetId: { $in: productIds } },
      { targetType: 'service', targetId: { $in: serviceIds } },
    ],
  });
}

function buildTopProducts(orders) {
  const productMap = new Map();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = toObjectIdString(item.productId);
      const current = productMap.get(key) || {
        productId: item.productId,
        title: item.title,
        revenue: 0,
        unitsSold: 0,
        category: item.category,
      };

      current.revenue += item.price * item.quantity;
      current.unitsSold += item.quantity;
      productMap.set(key, current);
    });
  });

  return [...productMap.values()]
    .sort((left, right) => right.revenue - left.revenue || right.unitsSold - left.unitsSold)
    .slice(0, 5);
}

export async function applyForSeller(req, res) {
  if (req.user.role === ROLES.ADMIN) {
    throw new AppError('Admins cannot apply for seller access.', 403);
  }

  const existingProfile = await SellerProfile.findOne({ userId: req.user._id });

  if (existingProfile?.status === SELLER_STATUS.APPROVED) {
    throw new AppError('You are already an approved seller.', 409);
  }

  const sellerProfile = await SellerProfile.findOneAndUpdate(
    { userId: req.user._id },
    {
      ...req.body,
      userId: req.user._id,
      status: SELLER_STATUS.PENDING,
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

  req.user.name = req.body.fullName;
  if (req.user.role !== ROLES.SELLER) {
    req.user.role = ROLES.BUYER;
  }
  await req.user.save();

  return sendResponse(res, 200, true, 'Seller application submitted successfully.', {
    sellerProfile: serializeSellerProfile(sellerProfile),
  });
}

export async function getSellerStatus(req, res) {
  const sellerProfile = await SellerProfile.findOne({ userId: req.user._id });

  return sendResponse(res, 200, true, 'Seller status fetched successfully.', {
    status: sellerProfile?.status || 'not-applied',
    sellerProfile: serializeSellerProfile(sellerProfile),
  });
}

export async function getSellerDashboardOverview(req, res) {
  const sellerId = req.user._id;

  const [orders, productsCount, servicesCount, reviews] = await Promise.all([
    Order.find({ sellerId }),
    Product.countDocuments({ sellerId, isActive: true, status: LISTING_STATUS.APPROVED }),
    Service.countDocuments({ sellerId, isActive: true, status: LISTING_STATUS.APPROVED }),
    getSellerCombinedReviews(sellerId),
  ]);

  const deliveredOrders = orders.filter((order) => order.orderStatus === 'delivered');
  const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  return sendResponse(res, 200, true, 'Seller overview fetched successfully.', {
    overview: {
      totalRevenue,
      totalOrdersReceived: orders.length,
      activeListings: productsCount + servicesCount,
      averageRating: Number(averageRating.toFixed(2)),
    },
  });
}

export async function getSellerInventory(req, res) {
  const products = await Product.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
  const lowStockAlerts = products.filter((product) => product.stock <= 2);

  return sendResponse(res, 200, true, 'Inventory fetched successfully.', {
    inventory: products,
    lowStockAlerts,
  });
}

export async function getSellerRevenueChart(req, res) {
  const deliveredOrders = await Order.find({
    sellerId: req.user._id,
    orderStatus: 'delivered',
  }).sort({ createdAt: 1 });

  return sendResponse(res, 200, true, 'Revenue chart fetched successfully.', {
    chart: bucketOrdersByMonth(deliveredOrders),
  });
}

export async function getSellerOrderMetrics(req, res) {
  const orders = await Order.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
  const deliveredOrders = orders.filter((order) => order.orderStatus === 'delivered');

  const metrics = {
    total: orders.length,
    pending: orders.filter((order) => order.orderStatus === 'placed').length,
    confirmed: orders.filter((order) => order.orderStatus === 'confirmed').length,
    shipped: orders.filter((order) => order.orderStatus === 'shipped').length,
    delivered: deliveredOrders.length,
    cancelled: orders.filter((order) => order.orderStatus === 'cancelled').length,
  };

  return sendResponse(res, 200, true, 'Order metrics fetched successfully.', {
    metrics,
    topProducts: buildTopProducts(deliveredOrders),
  });
}

export async function getSellerCustomers(req, res) {
  const orders = await Order.find({ sellerId: req.user._id }).populate('buyerId', 'name email createdAt');
  const customerMap = new Map();

  orders.forEach((order) => {
    const buyerId = toObjectIdString(order.buyerId?._id || order.buyerId);

    if (!buyerId || !order.buyerId?.name) {
      return;
    }

    const current = customerMap.get(buyerId) || {
      id: buyerId,
      name: order.buyerId.name,
      email: order.buyerId.email,
      totalOrders: 0,
      totalSpent: 0,
      lastPurchaseAt: order.createdAt,
    };

    current.totalOrders += 1;
    current.totalSpent += order.totalAmount;
    current.lastPurchaseAt =
      new Date(order.createdAt) > new Date(current.lastPurchaseAt) ? order.createdAt : current.lastPurchaseAt;
    customerMap.set(buyerId, current);
  });

  return sendResponse(res, 200, true, 'Seller customers fetched successfully.', {
    customers: [...customerMap.values()].sort((left, right) => right.totalSpent - left.totalSpent),
  });
}

export async function getSellerCustomerDetail(req, res) {
  const customer = await User.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found.', 404);
  }

  const purchaseHistory = await Order.find({
    sellerId: req.user._id,
    buyerId: customer._id,
  }).sort({ createdAt: -1 });

  if (!purchaseHistory.length) {
    throw new AppError('This customer has no purchases with your store.', 404);
  }

  const { productIds, serviceIds } = await getSellerOwnedTargetIds(req.user._id);
  const reviews = await Review.find({
    reviewerId: customer._id,
    $or: [
      { targetType: 'seller', targetId: req.user._id },
      { targetType: 'product', targetId: { $in: productIds } },
      { targetType: 'service', targetId: { $in: serviceIds } },
    ],
  }).sort({ createdAt: -1 });

  return sendResponse(res, 200, true, 'Customer detail fetched successfully.', {
    customer: {
      id: customer._id,
      name: customer.name,
      email: customer.email,
      createdAt: customer.createdAt,
    },
    purchaseHistory,
    reviews,
  });
}

export async function getSellerRevenueTrend(req, res) {
  const deliveredOrders = await Order.find({
    sellerId: req.user._id,
    orderStatus: 'delivered',
  });

  return sendResponse(res, 200, true, 'Seller revenue trend fetched successfully.', {
    trend: bucketOrdersByMonth(deliveredOrders),
  });
}

export async function getSellerCategorySales(req, res) {
  const orders = await Order.find({
    sellerId: req.user._id,
    orderStatus: 'delivered',
  });

  const categoryMap = new Map();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const current = categoryMap.get(item.category) || {
        category: item.category || 'Uncategorized',
        revenue: 0,
        unitsSold: 0,
      };

      current.revenue += item.price * item.quantity;
      current.unitsSold += item.quantity;
      categoryMap.set(item.category || 'Uncategorized', current);
    });
  });

  return sendResponse(res, 200, true, 'Category sales fetched successfully.', {
    categories: [...categoryMap.values()].sort((left, right) => right.revenue - left.revenue),
  });
}

export async function getSellerTopProducts(req, res) {
  const deliveredOrders = await Order.find({
    sellerId: req.user._id,
    orderStatus: 'delivered',
  });

  return sendResponse(res, 200, true, 'Top products fetched successfully.', {
    products: buildTopProducts(deliveredOrders),
  });
}

export async function generateSellerReport(req, res) {
  const { type } = req.query;

  if (!['sales', 'orders', 'customers'].includes(type)) {
    throw new AppError('Invalid report type.', 400);
  }

  const dateFilter = parseDateRange(req.query);
  let rows = [];

  if (type === 'sales') {
    const deliveredOrders = await Order.find({
      sellerId: req.user._id,
      orderStatus: 'delivered',
      ...dateFilter,
    });

    rows = deliveredOrders.map((order) => ({
      orderId: order._id,
      totalAmount: order.totalAmount,
      transactionId: order.transactionId,
      deliveredAt: order.updatedAt.toISOString(),
    }));
  }

  if (type === 'orders') {
    const orders = await Order.find({
      sellerId: req.user._id,
      ...dateFilter,
    })
      .populate('buyerId', 'name email')
      .sort({ createdAt: -1 });

    rows = orders.map((order) => ({
      orderId: order._id,
      buyerName: order.buyerId?.name || 'Unknown',
      buyerEmail: order.buyerId?.email || 'Unknown',
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt.toISOString(),
    }));
  }

  if (type === 'customers') {
    const orders = await Order.find({
      sellerId: req.user._id,
      ...dateFilter,
    }).populate('buyerId', 'name email');
    const customerMap = new Map();

    orders.forEach((order) => {
      const key = toObjectIdString(order.buyerId?._id || order.buyerId);

      if (!key || !order.buyerId?.name) {
        return;
      }

      const current = customerMap.get(key) || {
        customerId: key,
        name: order.buyerId.name,
        email: order.buyerId.email,
        totalOrders: 0,
        totalSpent: 0,
      };

      current.totalOrders += 1;
      current.totalSpent += order.totalAmount;
      customerMap.set(key, current);
    });

    rows = [...customerMap.values()];
  }

  const csv = toCsv(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
  return res.status(200).send(csv);
}

export async function approveSellerApplication(profileId) {
  const sellerProfile = await SellerProfile.findById(profileId).populate('userId');

  if (!sellerProfile) {
    throw new AppError('Seller application not found.', 404);
  }

  sellerProfile.status = SELLER_STATUS.APPROVED;
  sellerProfile.rejectionReason = '';
  sellerProfile.approvedAt = new Date();
  await sellerProfile.save();

  sellerProfile.userId.role = ROLES.SELLER;
  await sellerProfile.userId.save();

  await sendSellerApplicationDecisionEmail({
    email: sellerProfile.userId.email,
    name: sellerProfile.userId.name,
    approved: true,
  });

  return sellerProfile;
}

export async function rejectSellerApplication(profileId, rejectionReason = '') {
  const sellerProfile = await SellerProfile.findById(profileId).populate('userId');

  if (!sellerProfile) {
    throw new AppError('Seller application not found.', 404);
  }

  sellerProfile.status = SELLER_STATUS.REJECTED;
  sellerProfile.rejectionReason = rejectionReason;
  sellerProfile.approvedAt = null;
  await sellerProfile.save();

  if (sellerProfile.userId.role !== ROLES.ADMIN) {
    sellerProfile.userId.role = ROLES.BUYER;
    await sellerProfile.userId.save();
  }

  await sendSellerApplicationDecisionEmail({
    email: sellerProfile.userId.email,
    name: sellerProfile.userId.name,
    approved: false,
    reason: rejectionReason,
  });

  return sellerProfile;
}

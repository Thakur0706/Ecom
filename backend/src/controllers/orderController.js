import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { ROLES } from '../constants/enums.js';
import { sendOrderStatusEmail } from '../services/emailService.js';
import { AppError, sendResponse } from '../utils/http.js';
import { buildPagination, getPagination } from '../utils/pagination.js';

const validSellerTransitions = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

async function populateOrder(orderId) {
  return Order.findById(orderId)
    .populate('buyerId', 'name email profilePictureUrl')
    .populate('sellerId', 'name email profilePictureUrl');
}

async function restockOrderItems(order) {
  await Promise.all(
    order.items.map((item) =>
      Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      }),
    ),
  );
}

export async function createOrder(req, res) {
  const cart = await Cart.findOne({ userId: req.user._id }).populate({
    path: 'items.productId',
    populate: {
      path: 'sellerId',
      select: 'name email',
    },
  });

  if (!cart || !cart.items.length) {
    throw new AppError('Your cart is empty.', 400);
  }

  const validItems = cart.items.filter((item) => item.productId);

  if (!validItems.length) {
    throw new AppError('No valid items found in cart.', 400);
  }

  const groupedBySeller = new Map();

  validItems.forEach((item) => {
    const product = item.productId;
    const sellerId = product.sellerId._id.toString();

    if (product.stock < item.quantity) {
      throw new AppError(`Not enough stock for ${product.title}.`, 400);
    }

    const current = groupedBySeller.get(sellerId) || {
      sellerId: product.sellerId._id,
      items: [],
      totalAmount: 0,
    };

    current.items.push({
      productId: product._id,
      title: product.title,
      category: product.category,
      imageUrl: product.imageUrl,
      quantity: item.quantity,
      price: product.price,
    });
    current.totalAmount += product.price * item.quantity;
    groupedBySeller.set(sellerId, current);
  });

  const baseTransactionId = `TXN_${Date.now()}`;
  const orders = [];
  let index = 1;

  for (const group of groupedBySeller.values()) {
    const order = await Order.create({
      buyerId: req.user._id,
      sellerId: group.sellerId,
      items: group.items,
      totalAmount: group.totalAmount,
      paymentStatus: 'paid',
      transactionId: `${baseTransactionId}_${index}`,
      orderStatus: 'placed',
      statusTimeline: [{ status: 'placed', timestamp: new Date() }],
      deliveryAddress: req.body.deliveryAddress,
    });

    orders.push(await populateOrder(order._id));
    index += 1;
  }

  await Promise.all(
    validItems.map((item) =>
      Product.findByIdAndUpdate(item.productId._id, {
        $inc: { stock: -item.quantity },
      }),
    ),
  );

  cart.items = [];
  await cart.save();

  return sendResponse(res, 201, true, 'Order placed successfully.', {
    orders,
  });
}

export async function getMyPurchases(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { buyerId: req.user._id };

  if (req.query.status) {
    filter.orderStatus = req.query.status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('sellerId', 'name email profilePictureUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Purchases fetched successfully.', {
    orders,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getMySales(req, res) {
  if (req.user.role !== ROLES.SELLER) {
    throw new AppError('Only sellers can access sales.', 403);
  }

  const { page, limit, skip } = getPagination(req.query);
  const filter = { sellerId: req.user._id };

  if (req.query.status) {
    filter.orderStatus = req.query.status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('buyerId', 'name email profilePictureUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Sales fetched successfully.', {
    orders,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getOrderById(req, res) {
  const order = await populateOrder(req.params.id);

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  const userId = req.user._id.toString();
  const isOwner =
    order.buyerId._id.toString() === userId ||
    order.sellerId._id.toString() === userId ||
    req.user.role === ROLES.ADMIN;

  if (!isOwner) {
    throw new AppError('You are not allowed to view this order.', 403);
  }

  return sendResponse(res, 200, true, 'Order fetched successfully.', {
    order,
  });
}

export async function updateOrderStatus(req, res) {
  const order = await populateOrder(req.params.id);

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  if (order.sellerId._id.toString() !== req.user._id.toString()) {
    throw new AppError('You can only update your own sales orders.', 403);
  }

  const allowedNextStatuses = validSellerTransitions[order.orderStatus] || [];

  if (!allowedNextStatuses.includes(req.body.orderStatus)) {
    throw new AppError(`You cannot change an order from ${order.orderStatus} to ${req.body.orderStatus}.`, 400);
  }

  order.orderStatus = req.body.orderStatus;
  order.statusTimeline.push({
    status: req.body.orderStatus,
    timestamp: new Date(),
  });
  await order.save();

  if (req.body.orderStatus === 'cancelled') {
    await restockOrderItems(order);
  }

  await sendOrderStatusEmail({
    email: order.buyerId.email,
    name: order.buyerId.name,
    orderId: order._id,
    status: req.body.orderStatus,
  });

  const updatedOrder = await populateOrder(order._id);

  return sendResponse(res, 200, true, 'Order status updated successfully.', {
    order: updatedOrder,
  });
}

export async function cancelOrder(req, res) {
  const order = await populateOrder(req.params.id);

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  if (order.buyerId._id.toString() !== req.user._id.toString()) {
    throw new AppError('You can only cancel your own orders.', 403);
  }

  if (!['placed', 'confirmed'].includes(order.orderStatus)) {
    throw new AppError('This order can no longer be cancelled.', 400);
  }

  order.orderStatus = 'cancelled';
  order.statusTimeline.push({
    status: 'cancelled',
    timestamp: new Date(),
  });
  await order.save();
  await restockOrderItems(order);

  const updatedOrder = await populateOrder(order._id);

  return sendResponse(res, 200, true, 'Order cancelled successfully.', {
    order: updatedOrder,
  });
}

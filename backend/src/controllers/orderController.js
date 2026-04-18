import mongoose from 'mongoose';
import { Cart } from '../models/Cart.js';
import AdminRevenue from '../models/AdminRevenue.js';
import { Order } from '../models/Order.js';
import { OrderMessage } from '../models/OrderMessage.js';
import { PaymentSession } from '../models/PaymentSession.js';
import { Product } from '../models/Product.js';
import { SupplierLedger } from '../models/SupplierLedger.js';
import { env } from '../config/env.js';
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  verifyRazorpaySignature,
} from '../services/razorpayService.js';
import { validateCoupon } from '../utils/couponHelpers.js';
import {
  acknowledgeCreditsForOrder,
  createLedgerCreditsForOrder,
  markOrderLedgerCreditsReversed,
} from '../utils/ledger.js';
import { updateCRMOnOrder } from '../utils/crmHelpers.js';
import { AppError, sendResponse } from '../utils/http.js';
import { buildPagination, getPagination } from '../utils/pagination.js';

const validAdminTransitions = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function withOptionalSession(query, session) {
  return session ? query.session(session) : query;
}

async function populateOrder(orderId) {
  return Order.findById(orderId)
    .populate('buyerId', 'name email profilePictureUrl')
    .populate('items.productId', 'title imageUrl category')
    .populate('items.supplierId', 'name email');
}

function serializeOrder(order, { includeSupplier = false } = {}) {
  if (!order) {
    return null;
  }

  return {
    id: order._id,
    buyer: order.buyerId
      ? {
          id: order.buyerId._id || order.buyerId,
          name: order.buyerId.name || '',
          email: order.buyerId.email || '',
        }
      : null,
    items: (order.items || []).map((item) => ({
      id: item._id,
      productId: item.productId?._id || item.productId,
      title: item.title,
      category: item.category,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      quotedPrice: item.quotedPrice,
      sellingPrice: item.sellingPrice,
      discountPercent: item.discountPercent,
      finalUnitPrice: item.finalUnitPrice,
      lineTotal: item.lineTotal,
      supplierPayable: item.supplierPayable,
      ...(includeSupplier && item.supplierId
        ? {
            supplier: {
              id: item.supplierId._id || item.supplierId,
              name: item.supplierId.name || '',
              email: item.supplierId.email || '',
            },
          }
        : {}),
    })),
    subtotal: order.subtotal,
    couponCode: order.couponCode,
    couponDiscount: order.couponDiscount,
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider,
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference,
    gatewayOrderId: order.gatewayOrderId,
    transactionId: order.transactionId,
    orderStatus: order.orderStatus,
    statusTimeline: order.statusTimeline,
    deliveryAddress: order.deliveryAddress,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

async function getCartWithProducts(userId, session = null) {
  return withOptionalSession(Cart.findOne({ userId }).populate('items.productId'), session);
}

function buildCheckoutReceipt(userId) {
  return `cc_${userId.toString().slice(-6)}_${Date.now()}`;
}

async function createAdminRevenueForDeliveredOrder(order) {
  const productIds = order.items
    .map((item) => item.productId)
    .filter(Boolean);

  if (!productIds.length) {
    return;
  }

  const products = await Product.find({ _id: { $in: productIds } })
    .select('listedByAdmin adminId title')
    .lean();
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));
  const grossSubtotal = Number(
    order.items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0).toFixed(2),
  );

  if (grossSubtotal <= 0) {
    return;
  }

  const revenueFactor = Number(order.totalAmount || 0) / grossSubtotal;
  const revenueByAdmin = new Map();

  order.items.forEach((item) => {
    const product = productMap.get(item.productId.toString());

    if (!product?.listedByAdmin || !product.adminId) {
      return;
    }

    const adminKey = product.adminId.toString();
    const netRevenue = Number((Number(item.lineTotal || 0) * revenueFactor).toFixed(2));
    const current = revenueByAdmin.get(adminKey) || {
      adminId: product.adminId,
      amount: 0,
    };

    current.amount = Number((current.amount + netRevenue).toFixed(2));
    revenueByAdmin.set(adminKey, current);
  });

  const revenueEntries = [...revenueByAdmin.values()]
    .filter((entry) => entry.amount > 0)
    .map((entry) => ({
      adminId: entry.adminId,
      sourceType: 'admin_product_order',
      sourceId: order._id,
      amount: entry.amount,
      description: 'Admin product order delivered',
      status: 'earned',
      earnedAt: new Date(),
    }));

  if (revenueEntries.length) {
    await AdminRevenue.create(revenueEntries);
  }
}

async function buildOrderSnapshot({ cart, userId, couponCodeOverride = '' }) {
  if (!cart || !cart.items.length) {
    throw new AppError('Your cart is empty.', 400);
  }

  const items = cart.items
    .filter((item) => item.productId)
    .map((item) => {
      const product = item.productId;

      if (product.status !== 'approved') {
        throw new AppError(`${product.title} is no longer available.`, 400);
      }

      if (product.availableStock < item.quantity) {
        throw new AppError(`Not enough stock for ${product.title}.`, 400);
      }

      const sellingPrice =
        product.sellingPrice === null || product.sellingPrice === undefined
          ? product.quotedPrice
          : product.sellingPrice;
      const finalUnitPrice = Number(product.finalPrice || 0);

      return {
        productId: product._id,
        supplierId: product.supplierId || null,
        title: product.title,
        category: product.category,
        imageUrl: product.imageUrl,
        quantity: item.quantity,
        quotedPrice: Number(product.quotedPrice || 0),
        sellingPrice: Number(sellingPrice || 0),
        discountPercent: product.discountActive ? Number(product.discountPercent || 0) : 0,
        finalUnitPrice,
        lineTotal: Number((finalUnitPrice * item.quantity).toFixed(2)),
        supplierPayable: Number((Number(product.quotedPrice || 0) * item.quantity).toFixed(2)),
      };
    });

  const subtotal = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const couponCode = couponCodeOverride || cart.couponCode || '';
  let couponDiscount = 0;
  let normalizedCouponCode = '';

  if (couponCode) {
    const couponResult = await validateCoupon({
      code: couponCode,
      orderTotal: subtotal,
      items,
      userId,
    });
    couponDiscount = couponResult.discountAmount;
    normalizedCouponCode = couponResult.coupon.code;
  }

  const totalAmount = Number((subtotal - couponDiscount).toFixed(2));

  return {
    items,
    subtotal,
    couponCode: normalizedCouponCode,
    couponDiscount,
    totalAmount,
    amountInPaise: Math.round(totalAmount * 100),
  };
}

async function decrementInventory(orderItems, session) {
  await Promise.all(
    orderItems.map((item) =>
      Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            availableStock: -item.quantity,
            unitsSold: item.quantity,
          },
        },
        { session },
      ),
    ),
  );

  const touchedProductIds = orderItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: touchedProductIds } }).session(session);

  await Promise.all(
    products.map((product) => {
      const isLowStock = product.availableStock <= product.lowStockThreshold;
      product.hasLowStockAlert = isLowStock;
      product.lowStockAlertAt = isLowStock ? product.lowStockAlertAt || new Date() : null;
      return product.save({ session });
    }),
  );
}

async function restockInventory(orderItems, session = null) {
  await Promise.all(
    orderItems.map((item) =>
      withOptionalSession(
        Product.findByIdAndUpdate(item.productId, {
          $inc: {
            availableStock: item.quantity,
            unitsSold: -item.quantity,
          },
        }),
        session,
      ),
    ),
  );
}

async function clearCartAfterOrder(userId, session) {
  await Cart.findOneAndUpdate(
    { userId },
    {
      $set: {
        items: [],
        couponCode: '',
      },
    },
    { session },
  );
}

async function createOrderRecord({
  buyerId,
  deliveryAddress,
  snapshot,
  paymentProvider,
  paymentMethod,
  paymentStatus,
  paymentReference,
  gatewayOrderId,
  transactionId,
  session,
}) {
  const [order] = await Order.create(
    [
      {
        buyerId,
        items: snapshot.items,
        subtotal: snapshot.subtotal,
        couponCode: snapshot.couponCode,
        couponDiscount: snapshot.couponDiscount,
        totalAmount: snapshot.totalAmount,
        paymentStatus,
        paymentProvider,
        paymentMethod,
        paymentReference,
        gatewayOrderId,
        transactionId,
        orderStatus: 'placed',
        statusTimeline: [{ status: 'placed', timestamp: new Date() }],
        deliveryAddress,
      },
    ],
    { session },
  );

  return order;
}


export async function createCheckoutSession(req, res) {
  const cart = await getCartWithProducts(req.user._id);
  const snapshot = await buildOrderSnapshot({
    cart,
    userId: req.user._id,
    couponCodeOverride: req.body.couponCode,
  });
  const receipt = buildCheckoutReceipt(req.user._id);

  const checkoutSession = await PaymentSession.create({
    userId: req.user._id,
    deliveryAddress: req.body.deliveryAddress,
    preferredMethod: req.body.preferredMethod,
    amount: snapshot.totalAmount,
    originalAmount: snapshot.subtotal,
    discountAmount: snapshot.couponDiscount,
    couponCode: snapshot.couponCode,
    amountInPaise: snapshot.amountInPaise,
    cartItems: snapshot.items,
    receipt,
  });

  try {
    const razorpayOrder = await createRazorpayOrder({
      amount: snapshot.amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        campusUserId: req.user._id.toString(),
        checkoutSessionId: checkoutSession._id.toString(),
      },
    });

    checkoutSession.razorpayOrderId = razorpayOrder.id;
    await checkoutSession.save();

    return sendResponse(res, 200, true, 'Checkout session created successfully.', {
      checkout: {
        sessionId: checkoutSession._id,
        keyId: env.razorpayKeyId,
        amount: razorpayOrder.amount,
        originalAmount: snapshot.subtotal,
        discountAmount: snapshot.couponDiscount,
        couponCode: snapshot.couponCode,
        currency: razorpayOrder.currency,
        razorpayOrderId: razorpayOrder.id,
        preferredMethod: checkoutSession.preferredMethod,
      },
    });
  } catch (error) {
    await PaymentSession.findByIdAndDelete(checkoutSession._id);
    throw error;
  }
}

export async function verifyCheckoutPayment(req, res) {
  const checkoutSession = await PaymentSession.findById(req.body.sessionId);

  if (!checkoutSession) {
    throw new AppError('Checkout session not found.', 404);
  }

  if (checkoutSession.userId.toString() !== req.user._id.toString()) {
    throw new AppError('You are not allowed to verify this payment.', 403);
  }

  if (checkoutSession.status === 'completed' && checkoutSession.localOrderIds.length > 0) {
    const existingOrder = await populateOrder(checkoutSession.localOrderIds[0]);

    return sendResponse(res, 200, true, 'Payment already verified.', {
      order: serializeOrder(existingOrder),
    });
  }

  if (checkoutSession.razorpayOrderId !== req.body.razorpayOrderId) {
    throw new AppError('Checkout session does not match this Razorpay order.', 400);
  }

  const isSignatureValid = verifyRazorpaySignature({
    orderId: req.body.razorpayOrderId,
    paymentId: req.body.razorpayPaymentId,
    signature: req.body.razorpaySignature,
  });

  if (!isSignatureValid) {
    checkoutSession.status = 'failed';
    checkoutSession.razorpayPaymentId = req.body.razorpayPaymentId;
    checkoutSession.razorpaySignature = req.body.razorpaySignature;
    await checkoutSession.save();
    throw new AppError('Payment verification failed. Please retry the checkout.', 400);
  }

  const payment = await fetchRazorpayPayment(req.body.razorpayPaymentId);

  if (payment.order_id !== checkoutSession.razorpayOrderId) {
    throw new AppError('Razorpay payment does not belong to this checkout session.', 400);
  }

  if (!['authorized', 'captured'].includes(payment.status)) {
    throw new AppError('Payment is not in a successful state yet.', 400);
  }

  if (payment.amount !== checkoutSession.amountInPaise) {
    throw new AppError('Paid amount does not match the checkout amount.', 400);
  }

  const session = await mongoose.startSession();
  let createdOrderId = null;
  let shouldUpdateCRM = false;

  try {
    await session.withTransaction(async () => {
      const latestCheckoutSession = await PaymentSession.findById(checkoutSession._id).session(session);

      if (!latestCheckoutSession) {
        throw new AppError('Checkout session expired before verification.', 404);
      }

      if (latestCheckoutSession.status === 'completed' && latestCheckoutSession.localOrderIds.length > 0) {
        [createdOrderId] = latestCheckoutSession.localOrderIds;
        return;
      }

      const currentProducts = await Product.find({
        _id: { $in: latestCheckoutSession.cartItems.map((item) => item.productId) },
      }).session(session);
      const productMap = new Map(currentProducts.map((product) => [product._id.toString(), product]));

      latestCheckoutSession.cartItems.forEach((item) => {
        const product = productMap.get(item.productId.toString());

        if (!product || product.status !== 'approved') {
          throw new AppError(`${item.title} is no longer available.`, 400);
        }

        if (product.availableStock < item.quantity) {
          throw new AppError(`Not enough stock for ${item.title}.`, 400);
        }
      });

      const order = await createOrderRecord({
        buyerId: req.user._id,
        deliveryAddress: latestCheckoutSession.deliveryAddress,
        snapshot: {
          items: latestCheckoutSession.cartItems,
          subtotal: latestCheckoutSession.originalAmount,
          couponCode: latestCheckoutSession.couponCode || '',
          couponDiscount: latestCheckoutSession.discountAmount,
          totalAmount: latestCheckoutSession.amount,
        },
        paymentProvider: 'razorpay',
        paymentMethod: 'card',
        paymentStatus: 'paid',
        paymentReference: payment.id,
        gatewayOrderId: latestCheckoutSession.razorpayOrderId,
        transactionId: payment.id,
        session,
      });

      createdOrderId = order._id;
      shouldUpdateCRM = true;
      await decrementInventory(order.items, session);
      await clearCartAfterOrder(req.user._id, session);

      latestCheckoutSession.status = 'completed';
      latestCheckoutSession.paymentMethod = 'card';
      latestCheckoutSession.razorpayPaymentId = payment.id;
      latestCheckoutSession.razorpaySignature = req.body.razorpaySignature;
      latestCheckoutSession.localOrderIds = [createdOrderId];
      latestCheckoutSession.completedAt = new Date();
      await latestCheckoutSession.save({ session });
    });
  } finally {
    await session.endSession();
  }

  const order = await populateOrder(createdOrderId);

  if (shouldUpdateCRM) {
    await updateCRMOnOrder(order.buyerId?._id || order.buyerId, order.totalAmount);
  }

  const serialized = serializeOrder(order);
  return sendResponse(res, 200, true, 'Payment verified and order placed successfully.', {
    order: serialized,
    orders: [serialized],
  });
}

export async function createOrder(req, res) {
  const cart = await getCartWithProducts(req.user._id);
  const snapshot = await buildOrderSnapshot({
    cart,
    userId: req.user._id,
    couponCodeOverride: req.body.couponCode,
  });
  const session = await mongoose.startSession();
  let createdOrderId = null;

  try {
    await session.withTransaction(async () => {
      const latestCart = await getCartWithProducts(req.user._id, session);
      const latestSnapshot = await buildOrderSnapshot({
        cart: latestCart,
        userId: req.user._id,
        couponCodeOverride: req.body.couponCode,
      });

      const order = await createOrderRecord({
        buyerId: req.user._id,
        deliveryAddress: req.body.deliveryAddress,
        snapshot: latestSnapshot,
        paymentProvider: req.body.paymentProvider,
        paymentMethod: req.body.paymentMethod,
        paymentStatus: req.body.paymentStatus,
        paymentReference: req.body.paymentReference,
        gatewayOrderId: req.body.gatewayOrderId,
        transactionId:
          req.body.paymentReference ||
          req.body.gatewayOrderId ||
          `ORD_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        session,
      });

      createdOrderId = order._id;
      await decrementInventory(order.items, session);
      await clearCartAfterOrder(req.user._id, session);
    });
  } finally {
    await session.endSession();
  }

  const order = await populateOrder(createdOrderId);
  await updateCRMOnOrder(order.buyerId?._id || order.buyerId, order.totalAmount);

  return sendResponse(res, 201, true, 'Order placed successfully.', {
    order: serializeOrder(order),
  });
}

export async function getOrders(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { buyerId: req.user._id };

  if (req.query.status) {
    filter.orderStatus = req.query.status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('buyerId', 'name email'),
    Order.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Orders fetched successfully.', {
    orders: orders.map((order) => serializeOrder(order)),
    pagination: buildPagination(page, limit, total),
  });
}

export async function getOrderById(req, res) {
  const order = await populateOrder(req.params.id);

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  if (req.user.role !== 'admin' && order.buyerId._id.toString() !== req.user._id.toString()) {
    throw new AppError('You are not allowed to view this order.', 403);
  }

  return sendResponse(res, 200, true, 'Order fetched successfully.', {
    order: serializeOrder(order, { includeSupplier: req.user.role === 'admin' }),
  });
}

export async function cancelOrder(req, res) {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  if (order.buyerId.toString() !== req.user._id.toString()) {
    throw new AppError('You can only cancel your own orders.', 403);
  }

  if (!['placed', 'confirmed'].includes(order.orderStatus)) {
    throw new AppError('This order can no longer be cancelled.', 400);
  }

  order.orderStatus = 'cancelled';
  order.statusTimeline.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: 'Cancelled by buyer.',
  });
  await order.save();
  await restockInventory(order.items);
  await markOrderLedgerCreditsReversed(order._id);

  const updatedOrder = await populateOrder(order._id);

  return sendResponse(res, 200, true, 'Order cancelled successfully.', {
    order: serializeOrder(updatedOrder),
  });
}

export async function getAdminOrders(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.status) {
    filter.orderStatus = req.query.status;
  }

  if (req.query.search) {
    filter.$or = [
      { transactionId: { $regex: req.query.search, $options: 'i' } },
      { deliveryAddress: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('buyerId', 'name email')
      .populate('items.supplierId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Admin orders fetched successfully.', {
    orders: orders.map((order) => serializeOrder(order, { includeSupplier: true })),
    pagination: buildPagination(page, limit, total),
  });
}

export async function getAdminOrderById(req, res) {
  const order = await populateOrder(req.params.id);

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  return sendResponse(res, 200, true, 'Admin order fetched successfully.', {
    order: serializeOrder(order, { includeSupplier: true }),
  });
}

export async function updateAdminOrderStatus(req, res) {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  const allowedNextStatuses = validAdminTransitions[order.orderStatus] || [];

  if (!allowedNextStatuses.includes(req.body.orderStatus)) {
    throw new AppError(
      `You cannot change an order from ${order.orderStatus} to ${req.body.orderStatus}.`,
      400,
    );
  }

  order.orderStatus = req.body.orderStatus;
  order.statusTimeline.push({
    status: req.body.orderStatus,
    timestamp: new Date(),
    note: 'Updated by admin.',
  });
  await order.save();

  if (req.body.orderStatus === 'cancelled') {
    await restockInventory(order.items);
    await markOrderLedgerCreditsReversed(order._id);
  } else if (req.body.orderStatus === 'confirmed') {
    // Create pending ledger credits when admin sends to supplier
    const ledgerEntries = await createLedgerCreditsForOrder(order);
    if (ledgerEntries.length) {
        const entryMap = new Map(
          ledgerEntries.map((entry) => [`${entry.orderItemId.toString()}`, entry._id]),
        );
        order.items.forEach((item) => {
          item.supplierLedgerEntryId = entryMap.get(item._id.toString()) || null;
        });
        await order.save();
    }
  } else if (req.body.orderStatus === 'delivered') {
    // If somehow not created yet, create at delivered
    const existingCredits = await SupplierLedger.find({ orderId: order._id });
    if (!existingCredits.length) {
        const ledgerEntries = await createLedgerCreditsForOrder(order);
        if (ledgerEntries.length) {
            const entryMap = new Map(
              ledgerEntries.map((entry) => [`${entry.orderItemId.toString()}`, entry._id]),
            );
            order.items.forEach((item) => {
              item.supplierLedgerEntryId = entryMap.get(item._id.toString()) || null;
            });
            await order.save();
        }
    }

    await createAdminRevenueForDeliveredOrder(order);
  }

  const updatedOrder = await populateOrder(order._id);

  if (req.body.orderStatus === 'confirmed') {
    const itemsList = updatedOrder.items.map(i => `${i.title} (Qty: ${i.quantity})`).join(', ');
    await OrderMessage.create({
      orderId: order._id,
      senderId: req.user._id,
      message: `System: Order confirmed by admin. Please confirm stock availability for: ${itemsList}. Admin will provide specific requirements below.`,
      isSystem: true,
    });
  }

  return sendResponse(res, 200, true, 'Order status updated successfully.', {
    order: serializeOrder(updatedOrder, { includeSupplier: true }),
  });
}

export async function getSupplierOrders(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { 'items.supplierId': req.user._id };

  if (req.query.status) {
    filter.orderStatus = req.query.status;
  }

  if (req.query.search) {
    filter.$or = [
      { transactionId: { $regex: req.query.search, $options: 'i' } },
      { deliveryAddress: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('buyerId', 'name email')
      .populate('items.supplierId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Supplier orders fetched successfully.', {
    orders: orders.map((order) => {
      // Filter items to only show the supplier's items instead of entire basket
      const supplierOrder = {
         ...serializeOrder(order, { includeSupplier: true }),
         items: serializeOrder(order, { includeSupplier: true }).items.filter(
            item => item.supplier && item.supplier.id.toString() === req.user._id.toString()
         )
      };
      return supplierOrder;
    }),
    pagination: buildPagination(page, limit, total),
  });
}

export async function updateSupplierOrderStatus(req, res) {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  const hasSupplierItems = order.items.some(item => 
      item.supplierId && item.supplierId.toString() === req.user._id.toString()
  );

  if (!hasSupplierItems) {
      throw new AppError('You do not have any items in this order.', 403);
  }

  const allowedNextStatuses = {
    confirmed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    placed: ['shipped'] // fallback allowance
  }[order.orderStatus] || [];

  if (!allowedNextStatuses.includes(req.body.orderStatus)) {
    throw new AppError(
      `You cannot change an order from ${order.orderStatus} to ${req.body.orderStatus}.`,
      400,
    );
  }

  order.orderStatus = req.body.orderStatus;
  order.statusTimeline.push({
    status: req.body.orderStatus,
    timestamp: new Date(),
    note: 'Updated by supplier.',
  });
  
  // Auto-acknowledge if supplier marks as shipped
  if (req.body.orderStatus === 'shipped' && !order.supplierAcknowledged) {
    order.supplierAcknowledged = true;
    await acknowledgeCreditsForOrder(order._id, req.user._id);
  }

  await order.save();

  if (req.body.orderStatus === 'cancelled') {
    await restockInventory(order.items);
    await markOrderLedgerCreditsReversed(order._id);
  } else if (req.body.orderStatus === 'confirmed') {
    // Create pending ledger credits when admin sends to supplier
    const ledgerEntries = await createLedgerCreditsForOrder(order);
    if (ledgerEntries.length) {
        const entryMap = new Map(
          ledgerEntries.map((entry) => [`${entry.orderItemId.toString()}`, entry._id]),
        );
        order.items.forEach((item) => {
          item.supplierLedgerEntryId = entryMap.get(item._id.toString()) || null;
        });
        await order.save();
    }
  } else if (req.body.orderStatus === 'delivered') {
    // Ensure ledger entries exist (backup)
    const existingCredits = await SupplierLedger.find({ orderId: order._id });
    if (!existingCredits.length) {
        const ledgerEntries = await createLedgerCreditsForOrder(order);
        if (ledgerEntries.length) {
            const entryMap = new Map(
              ledgerEntries.map((entry) => [`${entry.orderItemId.toString()}`, entry._id]),
            );
            order.items.forEach((item) => {
              item.supplierLedgerEntryId = entryMap.get(item._id.toString()) || null;
            });
            await order.save();
        }
    }

    await createAdminRevenueForDeliveredOrder(order);
  }

  const updatedOrder = await populateOrder(order._id);

  return sendResponse(res, 200, true, 'Order status updated successfully.', {
    order: serializeOrder(updatedOrder, { includeSupplier: true }),
  });
}

export async function getOrderMessages(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found.', 404);

  // Check if participant (Admin, Buyer, or Supplier of an item)
  const isSupplier = order.items.some(item => item.supplierId?.toString() === req.user._id.toString());
  const isBuyer = order.buyerId.toString() === req.user._id.toString();
  
  if (req.user.role !== 'admin' && !isSupplier && !isBuyer) {
    throw new AppError('Not authorized to view messages for this order.', 403);
  }

  const messages = await OrderMessage.find({ orderId: order._id })
    .populate('senderId', 'name email role profilePictureUrl')
    .sort({ createdAt: 1 });

  return sendResponse(res, 200, true, 'Order messages fetched successfully.', { messages });
}

export async function sendOrderMessage(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found.', 404);

  if (!order.isChatOpen && req.user.role !== 'admin') {
     throw new AppError('This order chat has been closed.', 403);
  }

  const isSupplier = order.items.some(item => item.supplierId?.toString() === req.user._id.toString());
  const isAdmin = req.user.role === 'admin';
  
  if (!isAdmin && !isSupplier) {
    throw new AppError('Only Admin or Order Suppliers can send messages.', 403);
  }

  const message = await OrderMessage.create({
    orderId: order._id,
    senderId: req.user._id,
    message: req.body.message,
    isSystem: false,
  });

  return sendResponse(res, 201, true, 'Message sent successfully.', {
    message: await OrderMessage.findById(message._id).populate('senderId', 'name email role profilePictureUrl'),
  });
}

export async function closeOrderChat(req, res) {
  if (req.user.role !== 'admin') {
    throw new AppError('Only Admin can close order chats.', 403);
  }

  const order = await Order.findByIdAndUpdate(req.params.id, { isChatOpen: false }, { new: true });
  if (!order) throw new AppError('Order not found.', 404);

  return sendResponse(res, 200, true, 'Order chat closed successfully.', { order: serializeOrder(order) });
}

export async function acknowledgeSupplierOrder(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found.', 404);

  const hasSupplierItems = order.items.some(item => 
      item.supplierId && item.supplierId.toString() === req.user._id.toString()
  );

  if (!hasSupplierItems) throw new AppError('No items for you in this order.', 403);

  order.supplierAcknowledged = true;
  await order.save();
  
  await acknowledgeCreditsForOrder(order._id, req.user._id);

  return sendResponse(res, 200, true, 'Order acknowledged successfully.', {
    id: order._id,
    supplierAcknowledged: order.supplierAcknowledged
  });
}

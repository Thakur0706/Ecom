import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { PaymentSession } from "../models/PaymentSession.js";
import { Product } from "../models/Product.js";
import { Sales } from "../models/Sales.js";
import { LISTING_STATUS, ROLES } from "../constants/enums.js";
import { env } from "../config/env.js";
import {
  fetchRazorpayPayment,
  createRazorpayOrder,
  verifyRazorpaySignature,
} from "../services/razorpayService.js";
import { resolveProductCoupon } from "../utils/couponHelpers.js";
import { sendOrderStatusEmail } from "../services/emailService.js";
import { AppError, sendResponse } from "../utils/http.js";
import { buildPagination, getPagination } from "../utils/pagination.js";

const validSellerTransitions = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

function withOptionalSession(query, dbSession) {
  return dbSession ? query.session(dbSession) : query;
}

async function populateOrder(orderId) {
  return Order.findById(orderId)
    .populate("buyerId", "name email profilePictureUrl")
    .populate("sellerId", "name email profilePictureUrl");
}

async function getPopulatedCart(userId, dbSession = null) {
  const query = Cart.findOne({ userId }).populate({
    path: "items.productId",
    populate: {
      path: "sellerId",
      select: "name email",
    },
  });

  return withOptionalSession(query, dbSession);
}

async function buildPricedCartSnapshot(
  cart,
  { userId, couponCode = "", paymentMethod = "card" } = {},
) {
  if (!cart || !cart.items.length) {
    throw new AppError("Your cart is empty.", 400);
  }

  const validItems = cart.items.filter((item) => item.productId);

  if (!validItems.length) {
    throw new AppError("No valid items found in cart.", 400);
  }

  validItems.forEach((item) => {
    const product = item.productId;
    const sellerId = product.sellerId?._id || product.sellerId;

    if (!sellerId) {
      throw new AppError(
        `${product.title} is missing seller information.`,
        400,
      );
    }

    if (product.status !== LISTING_STATUS.APPROVED || !product.isActive) {
      throw new AppError(`${product.title} is no longer available.`, 400);
    }

    if (product.stock < item.quantity) {
      throw new AppError(`Not enough stock for ${product.title}.`, 400);
    }
  });

  if (paymentMethod === "cod" && couponCode.trim()) {
    throw new AppError(
      "Coupons are only available for card and UPI payments.",
      400,
    );
  }

  const couponResult = await resolveProductCoupon({
    couponCode,
    validItems,
    userId,
  }).catch((error) => {
    if (!couponCode.trim()) {
      return {
        couponCode: "",
        discountAmount: 0,
        discountByProductId: new Map(),
      };
    }

    throw error;
  });

  const cartItems = validItems.map((item) => {
    const product = item.productId;
    const originalSubtotal = Number((product.price * item.quantity).toFixed(2));
    const discountAmount = Number(
      (
        couponResult.discountByProductId?.get(product._id.toString()) || 0
      ).toFixed(2),
    );
    const payableSubtotal = Number(
      (originalSubtotal - discountAmount).toFixed(2),
    );

    return {
      productId: product._id,
      sellerId: product.sellerId._id || product.sellerId,
      title: product.title,
      category: product.category,
      imageUrl: product.imageUrl,
      quantity: item.quantity,
      price: product.price,
      originalSubtotal,
      discountAmount,
      payableSubtotal,
    };
  });

  const originalAmount = Number(
    cartItems.reduce((sum, item) => sum + item.originalSubtotal, 0).toFixed(2),
  );
  const discountAmount = Number(
    cartItems.reduce((sum, item) => sum + item.discountAmount, 0).toFixed(2),
  );
  const totalAmount = Number((originalAmount - discountAmount).toFixed(2));

  return {
    cartItems,
    originalAmount,
    discountAmount,
    couponCode: couponResult.couponCode || "",
    totalAmount,
    amountInPaise: Math.round(totalAmount * 100),
  };
}

function buildSellerGroups(cartItems = [], couponCode = "") {
  const groupedBySeller = new Map();

  cartItems.forEach((item) => {
    const sellerKey = item.sellerId.toString();
    const currentGroup = groupedBySeller.get(sellerKey) || {
      sellerId: item.sellerId,
      items: [],
      totalAmount: 0,
      originalAmount: 0,
      discountAmount: 0,
      couponCode: "",
    };

    currentGroup.items.push({
      productId: item.productId,
      title: item.title,
      category: item.category,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      price: item.price,
    });
    currentGroup.totalAmount = Number(
      (currentGroup.totalAmount + item.payableSubtotal).toFixed(2),
    );
    currentGroup.originalAmount = Number(
      (currentGroup.originalAmount + item.originalSubtotal).toFixed(2),
    );
    currentGroup.discountAmount = Number(
      (currentGroup.discountAmount + item.discountAmount).toFixed(2),
    );
    currentGroup.couponCode = currentGroup.discountAmount > 0 ? couponCode : "";

    groupedBySeller.set(sellerKey, currentGroup);
  });

  return [...groupedBySeller.values()];
}

function normalizePaymentMethod(rawMethod = "", fallbackMethod = "card") {
  const normalized = rawMethod.toLowerCase();

  if (normalized.includes("upi")) {
    return "upi";
  }

  if (normalized.includes("card")) {
    return "card";
  }

  return fallbackMethod;
}

async function assertInventoryAvailable(cartItems, dbSession = null) {
  const productIds = cartItems.map((item) => item.productId);
  const products = await withOptionalSession(
    Product.find({ _id: { $in: productIds } }).select(
      "title stock status isActive",
    ),
    dbSession,
  );
  const productMap = new Map(
    products.map((product) => [product._id.toString(), product]),
  );

  cartItems.forEach((item) => {
    const product = productMap.get(item.productId.toString());

    if (
      !product ||
      product.status !== LISTING_STATUS.APPROVED ||
      !product.isActive
    ) {
      throw new AppError(`${item.title} is no longer available.`, 400);
    }

    if (product.stock < item.quantity) {
      throw new AppError(`Not enough stock for ${item.title}.`, 400);
    }
  });
}

async function decrementInventory(cartItems, dbSession) {
  await Promise.all(
    cartItems.map((item) =>
      Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { stock: -item.quantity },
        },
        { session: dbSession },
      ),
    ),
  );
}

async function removePurchasedItemsFromCart(userId, cartItems, dbSession) {
  const cart = await withOptionalSession(Cart.findOne({ userId }), dbSession);

  if (!cart) {
    return;
  }

  cartItems.forEach((item) => {
    const currentItem = cart.items.find(
      (cartItem) => cartItem.productId.toString() === item.productId.toString(),
    );

    if (!currentItem) {
      return;
    }

    currentItem.quantity -= item.quantity;
  });

  cart.items = cart.items.filter((item) => item.quantity > 0);
  await cart.save({ session: dbSession });
}

async function createOrdersFromSnapshot({
  buyerId,
  deliveryAddress,
  cartItems,
  paymentProvider,
  paymentMethod,
  paymentStatus,
  paymentReference,
  gatewayOrderId,
  couponCode,
  transactionBaseId,
  dbSession,
}) {
  const groupedOrders = buildSellerGroups(cartItems, couponCode);
  const createdOrderIds = [];
  let index = 1;

  for (const group of groupedOrders) {
    const [order] = await Order.create(
      [
        {
          buyerId,
          sellerId: group.sellerId,
          items: group.items,
          totalAmount: group.totalAmount,
          originalAmount: group.originalAmount,
          discountAmount: group.discountAmount,
          couponCode: group.couponCode,
          paymentStatus,
          paymentProvider,
          paymentMethod,
          paymentReference,
          gatewayOrderId,
          transactionId: `${transactionBaseId}_${index}`,
          orderStatus: "placed",
          statusTimeline: [{ status: "placed", timestamp: new Date() }],
          deliveryAddress,
        },
      ],
      { session: dbSession },
    );

    createdOrderIds.push(order._id);
    index += 1;
  }

  return createdOrderIds;
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

function buildCheckoutReceipt(userId) {
  return `cc_${userId.toString().slice(-6)}_${Date.now()}`;
}

export async function createCheckoutSession(req, res) {
  const cart = await getPopulatedCart(req.user._id);
  const snapshot = await buildPricedCartSnapshot(cart, {
    userId: req.user._id,
    couponCode: req.body.couponCode,
    paymentMethod: req.body.preferredMethod,
  });
  const receipt = buildCheckoutReceipt(req.user._id);

  const checkoutSession = await PaymentSession.create({
    userId: req.user._id,
    deliveryAddress: req.body.deliveryAddress,
    preferredMethod: req.body.preferredMethod,
    amount: snapshot.totalAmount,
    originalAmount: snapshot.originalAmount,
    discountAmount: snapshot.discountAmount,
    couponCode: snapshot.couponCode,
    amountInPaise: snapshot.amountInPaise,
    cartItems: snapshot.cartItems,
    receipt,
  });

  try {
    const razorpayOrder = await createRazorpayOrder({
      amount: snapshot.amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        campusUserId: req.user._id.toString(),
        checkoutSessionId: checkoutSession._id.toString(),
      },
    });

    checkoutSession.razorpayOrderId = razorpayOrder.id;
    await checkoutSession.save();

    return sendResponse(
      res,
      200,
      true,
      "Checkout session created successfully.",
      {
        checkout: {
          sessionId: checkoutSession._id,
          keyId: env.razorpayKeyId,
          amount: razorpayOrder.amount,
          originalAmount: snapshot.originalAmount,
          discountAmount: snapshot.discountAmount,
          couponCode: snapshot.couponCode,
          currency: razorpayOrder.currency,
          razorpayOrderId: razorpayOrder.id,
          preferredMethod: checkoutSession.preferredMethod,
          testMode: env.razorpayKeyId.startsWith("rzp_test_"),
        },
      },
    );
  } catch (error) {
    await PaymentSession.findByIdAndDelete(checkoutSession._id);
    throw error;
  }
}

export async function verifyCheckoutPayment(req, res) {
  const checkoutSession = await PaymentSession.findById(req.body.sessionId);

  if (!checkoutSession) {
    throw new AppError("Checkout session not found.", 404);
  }

  if (checkoutSession.userId.toString() !== req.user._id.toString()) {
    throw new AppError("You are not allowed to verify this payment.", 403);
  }

  if (
    checkoutSession.status === "completed" &&
    checkoutSession.localOrderIds.length > 0
  ) {
    const existingOrders = await Promise.all(
      checkoutSession.localOrderIds.map((orderId) => populateOrder(orderId)),
    );

    return sendResponse(res, 200, true, "Payment already verified.", {
      orders: existingOrders.filter(Boolean),
    });
  }

  if (checkoutSession.razorpayOrderId !== req.body.razorpayOrderId) {
    throw new AppError(
      "Checkout session does not match this Razorpay order.",
      400,
    );
  }

  const isSignatureValid = verifyRazorpaySignature({
    orderId: req.body.razorpayOrderId,
    paymentId: req.body.razorpayPaymentId,
    signature: req.body.razorpaySignature,
  });

  if (!isSignatureValid) {
    checkoutSession.status = "failed";
    checkoutSession.razorpayPaymentId = req.body.razorpayPaymentId;
    checkoutSession.razorpaySignature = req.body.razorpaySignature;
    await checkoutSession.save();
    throw new AppError(
      "Payment verification failed. Please retry the checkout.",
      400,
    );
  }

  const payment = await fetchRazorpayPayment(req.body.razorpayPaymentId);

  if (payment.order_id !== checkoutSession.razorpayOrderId) {
    throw new AppError(
      "Razorpay payment does not belong to this checkout session.",
      400,
    );
  }

  if (!["authorized", "captured"].includes(payment.status)) {
    throw new AppError("Payment is not in a successful state yet.", 400);
  }

  if (payment.amount !== checkoutSession.amountInPaise) {
    throw new AppError("Paid amount does not match the checkout amount.", 400);
  }

  const paymentMethod = normalizePaymentMethod(
    payment.method,
    checkoutSession.preferredMethod,
  );
  const dbSession = await mongoose.startSession();
  let createdOrderIds = [];

  try {
    await dbSession.withTransaction(async () => {
      const latestCheckoutSession = await PaymentSession.findById(
        checkoutSession._id,
      ).session(dbSession);

      if (!latestCheckoutSession) {
        throw new AppError(
          "Checkout session expired before verification.",
          404,
        );
      }

      if (
        latestCheckoutSession.status === "completed" &&
        latestCheckoutSession.localOrderIds.length > 0
      ) {
        createdOrderIds = latestCheckoutSession.localOrderIds;
        return;
      }

      await assertInventoryAvailable(
        latestCheckoutSession.cartItems,
        dbSession,
      );

      createdOrderIds = await createOrdersFromSnapshot({
        buyerId: req.user._id,
        deliveryAddress: latestCheckoutSession.deliveryAddress,
        cartItems: latestCheckoutSession.cartItems,
        paymentProvider: "razorpay",
        paymentMethod,
        paymentStatus: "paid",
        paymentReference: payment.id,
        gatewayOrderId: latestCheckoutSession.razorpayOrderId,
        couponCode: latestCheckoutSession.couponCode || "",
        transactionBaseId: payment.id,
        dbSession,
      });

      await decrementInventory(latestCheckoutSession.cartItems, dbSession);
      await removePurchasedItemsFromCart(
        req.user._id,
        latestCheckoutSession.cartItems,
        dbSession,
      );

      latestCheckoutSession.status = "completed";
      latestCheckoutSession.paymentMethod = paymentMethod;
      latestCheckoutSession.razorpayPaymentId = payment.id;
      latestCheckoutSession.razorpaySignature = req.body.razorpaySignature;
      latestCheckoutSession.localOrderIds = createdOrderIds;
      latestCheckoutSession.completedAt = new Date();
      await latestCheckoutSession.save({ session: dbSession });
    });
  } finally {
    await dbSession.endSession();
  }

  const orders = await Promise.all(
    createdOrderIds.map((orderId) => populateOrder(orderId)),
  );

  return sendResponse(
    res,
    200,
    true,
    "Payment verified and order placed successfully.",
    {
      orders: orders.filter(Boolean),
      payment: {
        provider: "razorpay",
        method: paymentMethod,
        paymentId: payment.id,
        orderId: checkoutSession.razorpayOrderId,
      },
    },
  );
}

export async function createOrder(req, res) {
  const paymentMethod = req.body.paymentMethod || "card";
  const paymentProvider =
    paymentMethod === "cod" ? "cod" : req.body.paymentProvider || "manual";
  const paymentStatus =
    paymentMethod === "cod" ? "pending" : req.body.paymentStatus || "paid";
  const paymentReference =
    paymentMethod === "cod" ? "" : req.body.paymentReference || "";
  const transactionBaseId =
    paymentMethod === "cod"
      ? `COD_${Date.now()}`
      : paymentReference ||
        (paymentMethod === "upi" ? `UPI_${Date.now()}` : `TXN_${Date.now()}`);

  const cart = await getPopulatedCart(req.user._id);
  const snapshot = await buildPricedCartSnapshot(cart, {
    userId: req.user._id,
    couponCode: req.body.couponCode,
    paymentMethod,
  });
  const dbSession = await mongoose.startSession();
  let createdOrderIds = [];

  try {
    await dbSession.withTransaction(async () => {
      await assertInventoryAvailable(snapshot.cartItems, dbSession);

      createdOrderIds = await createOrdersFromSnapshot({
        buyerId: req.user._id,
        deliveryAddress: req.body.deliveryAddress,
        cartItems: snapshot.cartItems,
        paymentProvider,
        paymentMethod,
        paymentStatus,
        paymentReference,
        gatewayOrderId: "",
        couponCode: snapshot.couponCode,
        transactionBaseId,
        dbSession,
      });

      await decrementInventory(snapshot.cartItems, dbSession);
      await removePurchasedItemsFromCart(
        req.user._id,
        snapshot.cartItems,
        dbSession,
      );
    });
  } finally {
    await dbSession.endSession();
  }

  const orders = await Promise.all(
    createdOrderIds.map((orderId) => populateOrder(orderId)),
  );

  return sendResponse(
    res,
    201,
    true,
    paymentMethod === "cod"
      ? "COD order placed successfully."
      : "Order placed successfully.",
    {
      orders: orders.filter(Boolean),
    },
  );
}

export async function getMyPurchases(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { buyerId: req.user._id };

  if (req.query.status) {
    filter.orderStatus = req.query.status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("sellerId", "name email profilePictureUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, "Purchases fetched successfully.", {
    orders,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getMySales(req, res) {
  if (req.user.role !== ROLES.SELLER) {
    throw new AppError("Only sellers can access sales.", 403);
  }

  const { page, limit, skip } = getPagination(req.query);
  const filter = { sellerId: req.user._id };

  if (req.query.status) {
    filter.orderStatus = req.query.status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("buyerId", "name email profilePictureUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, "Sales fetched successfully.", {
    orders,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getOrderById(req, res) {
  const order = await populateOrder(req.params.id);

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  const userId = req.user._id.toString();
  const isOwner =
    order.buyerId._id.toString() === userId ||
    order.sellerId._id.toString() === userId ||
    req.user.role === ROLES.ADMIN;

  if (!isOwner) {
    throw new AppError("You are not allowed to view this order.", 403);
  }

  return sendResponse(res, 200, true, "Order fetched successfully.", {
    order,
  });
}

export async function updateOrderStatus(req, res) {
  const order = await populateOrder(req.params.id);

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  if (order.sellerId._id.toString() !== req.user._id.toString()) {
    throw new AppError("You can only update your own sales orders.", 403);
  }

  const allowedNextStatuses = validSellerTransitions[order.orderStatus] || [];

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
  });
  await order.save();

  // Create sales record when order is delivered
  if (req.body.orderStatus === "delivered") {
    await Sales.create({
      sellerId: order.sellerId._id,
      orderId: order._id,
      type: "product",
      title: `Order ${order._id}`,
      amount: order.totalAmount,
      platformFee: order.platformFee,
      sellerEarns: order.totalAmount,
      completedAt: new Date(),
    });
  }

  if (req.body.orderStatus === "cancelled") {
    await restockOrderItems(order);
  }

  await sendOrderStatusEmail({
    email: order.buyerId.email,
    name: order.buyerId.name,
    orderId: order._id,
    status: req.body.orderStatus,
  });

  const updatedOrder = await populateOrder(order._id);

  return sendResponse(res, 200, true, "Order status updated successfully.", {
    order: updatedOrder,
  });
}

export async function cancelOrder(req, res) {
  const order = await populateOrder(req.params.id);

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  if (order.buyerId._id.toString() !== req.user._id.toString()) {
    throw new AppError("You can only cancel your own orders.", 403);
  }

  if (!["placed", "confirmed"].includes(order.orderStatus)) {
    throw new AppError("This order can no longer be cancelled.", 400);
  }

  order.orderStatus = "cancelled";
  order.statusTimeline.push({
    status: "cancelled",
    timestamp: new Date(),
  });
  await order.save();
  await restockOrderItems(order);

  const updatedOrder = await populateOrder(order._id);

  return sendResponse(res, 200, true, "Order cancelled successfully.", {
    order: updatedOrder,
  });
}

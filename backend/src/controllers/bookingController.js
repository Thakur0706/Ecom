import { Booking } from "../models/Booking.js";
import { BookingMessage } from "../models/BookingMessage.js";
import { Sales } from "../models/Sales.js";
import { Service } from "../models/Service.js";
import { LISTING_STATUS, ROLES } from "../constants/enums.js";
import { env } from "../config/env.js";
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  verifyRazorpaySignature,
} from "../services/razorpayService.js";
import { resolveServiceCoupon } from "../utils/couponHelpers.js";
import { AppError, sendResponse } from "../utils/http.js";
import { buildPagination, getPagination } from "../utils/pagination.js";

const validSellerTransitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function isValidUpiId(value = "") {
  return /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(value.trim());
}

async function populateBooking(bookingId) {
  return Booking.findById(bookingId)
    .populate("buyerId", "name email profilePictureUrl")
    .populate("sellerId", "name email profilePictureUrl")
    .populate("serviceId");
}

function ensureBuyerOwnsBooking(booking, buyerId) {
  if (booking.buyerId._id.toString() !== buyerId.toString()) {
    throw new AppError("You can only manage your own bookings.", 403);
  }
}

function ensureSellerOwnsBooking(booking, sellerId) {
  if (booking.sellerId._id.toString() !== sellerId.toString()) {
    throw new AppError(
      "You can only manage bookings for your own services.",
      403,
    );
  }
}

function ensureBookingParticipant(booking, userId) {
  const isParticipant =
    booking.buyerId._id.toString() === userId.toString() ||
    booking.sellerId._id.toString() === userId.toString();

  if (!isParticipant) {
    throw new AppError("You are not allowed to access this booking.", 403);
  }
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

export async function createBooking(req, res) {
  const service = await Service.findOne({
    _id: req.body.serviceId,
    status: LISTING_STATUS.APPROVED,
    isActive: true,
  }).populate("sellerId", "name email profilePictureUrl");

  if (!service) {
    throw new AppError("Service is not available.", 404);
  }

  if (service.sellerId._id.toString() === req.user._id.toString()) {
    throw new AppError("You cannot book your own service.", 400);
  }

  const couponResult = await resolveServiceCoupon({
    couponCode: req.body.couponCode,
    service,
    userId: req.user._id,
  }).catch((error) => {
    if (!req.body.couponCode) {
      return {
        couponCode: "",
        discountAmount: 0,
      };
    }

    throw error;
  });

  const booking = await Booking.create({
    buyerId: req.user._id,
    sellerId: service.sellerId._id,
    serviceId: service._id,
    serviceTitle: service.title,
    scheduledDate: new Date(req.body.scheduledDate),
    duration: req.body.duration,
    originalAmount: service.price,
    discountAmount: couponResult.discountAmount || 0,
    couponCode: couponResult.couponCode || "",
    totalAmount: Number(
      (service.price - (couponResult.discountAmount || 0)).toFixed(2),
    ),
    paymentStatus: "pending",
    transactionId: `BKG_${Date.now()}`,
    bookingStatus: "pending",
  });

  const populatedBooking = await populateBooking(booking._id);

  return sendResponse(
    res,
    201,
    true,
    "Booking request created successfully. Awaiting seller confirmation.",
    {
      booking: populatedBooking,
    },
  );
}

export async function getMyBookings(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { buyerId: req.user._id };

  if (req.query.status) {
    filter.bookingStatus = req.query.status;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("sellerId", "name email profilePictureUrl")
      .populate("serviceId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, "Bookings fetched successfully.", {
    bookings,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getMyServiceBookings(req, res) {
  if (req.user.role !== ROLES.SELLER) {
    throw new AppError("Only sellers can access service bookings.", 403);
  }

  const { page, limit, skip } = getPagination(req.query);
  const filter = { sellerId: req.user._id };

  if (req.query.status) {
    filter.bookingStatus = req.query.status;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("buyerId", "name email profilePictureUrl")
      .populate("serviceId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return sendResponse(
    res,
    200,
    true,
    "Service bookings fetched successfully.",
    {
      bookings,
      pagination: buildPagination(page, limit, total),
    },
  );
}

export async function updateBookingStatus(req, res) {
  const booking = await populateBooking(req.params.id);

  if (!booking) {
    throw new AppError("Booking not found.", 404);
  }

  ensureSellerOwnsBooking(booking, req.user._id);

  const allowedNextStatuses =
    validSellerTransitions[booking.bookingStatus] || [];

  if (!allowedNextStatuses.includes(req.body.bookingStatus)) {
    throw new AppError(
      `You cannot change a booking from ${booking.bookingStatus} to ${req.body.bookingStatus}.`,
      400,
    );
  }

  if (
    req.body.bookingStatus === "completed" &&
    booking.paymentStatus !== "paid"
  ) {
    throw new AppError(
      "The buyer must complete payment before the booking can be marked completed.",
      400,
    );
  }

  booking.bookingStatus = req.body.bookingStatus;

  if (req.body.bookingStatus === "confirmed") {
    booking.sellerConfirmedAt = new Date();
  }

  await booking.save();

  // Create sales record when booking is completed
  if (req.body.bookingStatus === "completed") {
    await Sales.create({
      sellerId: booking.sellerId,
      bookingId: booking._id,
      type: "service",
      title: booking.serviceTitle,
      amount: booking.totalAmount,
      platformFee: booking.platformFee,
      sellerEarns: booking.totalAmount,
      completedAt: new Date(),
    });
  }

  return sendResponse(res, 200, true, "Booking status updated successfully.", {
    booking: await populateBooking(booking._id),
  });
}

export async function createBookingPaymentSession(req, res) {
  const booking = await populateBooking(req.params.id);

  if (!booking) {
    throw new AppError("Booking not found.", 404);
  }

  ensureBuyerOwnsBooking(booking, req.user._id);

  if (booking.bookingStatus !== "confirmed") {
    throw new AppError(
      "This booking must be confirmed by the service provider before payment.",
      400,
    );
  }

  if (booking.paymentStatus === "paid") {
    return sendResponse(res, 200, true, "Booking is already paid.", {
      checkout: {
        bookingId: booking._id,
        keyId: env.razorpayKeyId,
        amount: Math.round(booking.totalAmount * 100),
        currency: "INR",
        razorpayOrderId: booking.gatewayOrderId,
        preferredMethod: "card",
        testMode: env.razorpayKeyId.startsWith("rzp_test_"),
      },
    });
  }

  const receipt = `booking_${booking._id.toString().slice(-6)}_${Date.now()}`;
  const razorpayOrder = await createRazorpayOrder({
    amount: Math.round(booking.totalAmount * 100),
    currency: "INR",
    receipt,
    notes: {
      bookingId: booking._id.toString(),
      buyerId: req.user._id.toString(),
    },
  });

  booking.gatewayOrderId = razorpayOrder.id;
  await booking.save();

  return sendResponse(
    res,
    200,
    true,
    "Booking payment session created successfully.",
    {
      checkout: {
        bookingId: booking._id,
        keyId: env.razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        razorpayOrderId: razorpayOrder.id,
        preferredMethod: "card",
        testMode: env.razorpayKeyId.startsWith("rzp_test_"),
      },
    },
  );
}

export async function verifyBookingPayment(req, res) {
  const booking = await populateBooking(req.params.id);

  if (!booking) {
    throw new AppError("Booking not found.", 404);
  }

  ensureBuyerOwnsBooking(booking, req.user._id);

  if (booking.paymentStatus === "paid") {
    return sendResponse(res, 200, true, "Booking payment already verified.", {
      booking,
    });
  }

  if (booking.gatewayOrderId !== req.body.razorpayOrderId) {
    throw new AppError(
      "This payment does not match the booking payment session.",
      400,
    );
  }

  const isSignatureValid = verifyRazorpaySignature({
    orderId: req.body.razorpayOrderId,
    paymentId: req.body.razorpayPaymentId,
    signature: req.body.razorpaySignature,
  });

  if (!isSignatureValid) {
    throw new AppError("Payment verification failed for this booking.", 400);
  }

  const payment = await fetchRazorpayPayment(req.body.razorpayPaymentId);

  if (payment.order_id !== booking.gatewayOrderId) {
    throw new AppError("The payment does not belong to this booking.", 400);
  }

  if (!["authorized", "captured"].includes(payment.status)) {
    throw new AppError("Payment is not in a successful state yet.", 400);
  }

  if (payment.amount !== Math.round(booking.totalAmount * 100)) {
    throw new AppError(
      "Payment amount does not match the booking amount.",
      400,
    );
  }

  const paymentMethod = normalizePaymentMethod(payment.method, "card");
  booking.paymentStatus = "paid";
  booking.paymentProvider = "razorpay";
  booking.paymentMethod = paymentMethod;
  booking.paymentReference = payment.id;
  booking.transactionId = payment.id;
  booking.paidAt = new Date();
  await booking.save();

  return sendResponse(res, 200, true, "Booking paid successfully.", {
    booking: await populateBooking(booking._id),
  });
}

export async function completeBookingUpiPayment(req, res) {
  const booking = await populateBooking(req.params.id);

  if (!booking) {
    throw new AppError("Booking not found.", 404);
  }

  ensureBuyerOwnsBooking(booking, req.user._id);

  if (booking.bookingStatus !== "confirmed") {
    throw new AppError("This booking must be confirmed before payment.", 400);
  }

  if (booking.paymentStatus === "paid") {
    return sendResponse(res, 200, true, "Booking is already paid.", {
      booking,
    });
  }

  if (!isValidUpiId(req.body.upiId)) {
    throw new AppError("Enter a valid UPI ID to continue.", 400);
  }

  const paymentReference = `UPI_${Date.now()}`;
  booking.paymentStatus = "paid";
  booking.paymentProvider = "manual";
  booking.paymentMethod = "upi";
  booking.paymentReference = paymentReference;
  booking.transactionId = paymentReference;
  booking.paidAt = new Date();
  await booking.save();

  return sendResponse(res, 200, true, "Booking paid successfully.", {
    booking: await populateBooking(booking._id),
  });
}

export async function getBookingMessages(req, res) {
  const booking = await populateBooking(req.params.id);

  if (!booking) {
    throw new AppError("Booking not found.", 404);
  }

  ensureBookingParticipant(booking, req.user._id);

  if (booking.paymentStatus !== "paid") {
    throw new AppError(
      "Chat becomes available only after the service payment is completed.",
      403,
    );
  }

  const messages = await BookingMessage.find({ bookingId: booking._id })
    .populate("senderId", "name email profilePictureUrl")
    .sort({ createdAt: 1 });

  return sendResponse(
    res,
    200,
    true,
    "Booking messages fetched successfully.",
    {
      messages,
    },
  );
}

export async function sendBookingMessage(req, res) {
  const booking = await populateBooking(req.params.id);

  if (!booking) {
    throw new AppError("Booking not found.", 404);
  }

  ensureBookingParticipant(booking, req.user._id);

  if (booking.paymentStatus !== "paid") {
    throw new AppError(
      "Chat becomes available only after the service payment is completed.",
      403,
    );
  }

  const message = await BookingMessage.create({
    bookingId: booking._id,
    senderId: req.user._id,
    message: req.body.message,
  });

  const populatedMessage = await BookingMessage.findById(message._id).populate(
    "senderId",
    "name email profilePictureUrl",
  );

  return sendResponse(res, 201, true, "Message sent successfully.", {
    message: populatedMessage,
  });
}

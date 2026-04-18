import { Booking } from '../models/Booking.js';
import { BookingMessage } from '../models/BookingMessage.js';
import AdminRevenue from '../models/AdminRevenue.js';
import { Service } from '../models/Service.js';
import { AppError, sendResponse } from '../utils/http.js';
import { buildPagination, getPagination } from '../utils/pagination.js';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  fetchRazorpayPayment,
} from '../services/razorpayService.js';
import { env } from '../config/env.js';
import { validateCoupon } from '../utils/couponHelpers.js';
import { updateCRMOnBooking } from '../utils/crmHelpers.js';

const validAdminTransitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

async function populateBooking(bookingId) {
  return Booking.findById(bookingId)
    .populate('buyerId', 'name email profilePictureUrl')
    .populate('serviceId');
}

function serializeBooking(booking, { includeBuyer = true } = {}) {
  if (!booking) {
    return null;
  }

  return {
    id: booking._id,
    buyer: includeBuyer && booking.buyerId
      ? {
          id: booking.buyerId._id || booking.buyerId,
          name: booking.buyerId.name || '',
          email: booking.buyerId.email || '',
        }
      : null,
    service: booking.serviceId
      ? {
          id: booking.serviceId._id || booking.serviceId,
          title: booking.serviceId.title || booking.serviceTitle,
          category: booking.serviceId.category || '',
          imageUrl: booking.serviceId.imageUrl || '',
        }
      : {
          id: booking.serviceId,
          title: booking.serviceTitle,
        },
    serviceTitle: booking.serviceTitle,
    scheduledDate: booking.scheduledDate,
    duration: booking.duration,
    totalAmount: booking.totalAmount,
    couponCode: booking.couponCode,
    couponDiscount: booking.couponDiscount,
    paymentStatus: booking.paymentStatus,
    paymentProvider: booking.paymentProvider,
    paymentMethod: booking.paymentMethod,
    paymentReference: booking.paymentReference,
    gatewayOrderId: booking.gatewayOrderId,
    transactionId: booking.transactionId,
    bookingStatus: booking.bookingStatus,
    statusTimeline: booking.statusTimeline,
    confirmedAt: booking.confirmedAt,
    completedAt: booking.completedAt,
    cancelledAt: booking.cancelledAt,
    paidAt: booking.paidAt,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

function ensureBookingParticipant(booking, user) {
  if (user.role === 'admin') {
    return;
  }

  if (booking.buyerId._id.toString() !== user._id.toString()) {
    throw new AppError('You are not allowed to access this booking.', 403);
  }
}

function ensureChatOpen(booking) {
  if (booking.paymentStatus !== 'paid') {
    throw new AppError('Chat is available only after the booking has been successfully paid.', 403);
  }
}

async function attachAdminServiceOwnerReference(booking, service) {
  if (!service?.ownedByAdmin) {
    return;
  }

  if (!service.adminId) {
    throw new AppError('Admin-owned service is missing its admin owner reference.', 400);
  }

  await Booking.updateOne(
    { _id: booking._id },
    {
      $set: {
        supplierId: service.adminId,
      },
    },
    { strict: false },
  );
}

async function handlePaidBookingRevenue(booking, serviceDocument = null) {
  const service = serviceDocument || (await Service.findById(booking.serviceId));

  if (!service) {
    return;
  }

  if (service.ownedByAdmin === true) {
    if (!service.adminId) {
      throw new AppError('Admin-owned service is missing its admin owner reference.', 400);
    }

    await AdminRevenue.create({
      adminId: service.adminId,
      sourceType: 'service_booking',
      sourceId: booking._id,
      amount: booking.totalAmount,
      description: `Service booking: ${service.title}`,
      status: 'earned',
      earnedAt: new Date(),
    });

    return;
  }

  // Supplier service: existing commission logic stays unchanged.
}

export async function createBooking(req, res) {
  const service = await Service.findById(req.body.serviceId);

  if (!service || service.status !== 'active') {
    throw new AppError('Service is not available.', 404);
  }

  if (service.ownedByAdmin === true && !service.adminId) {
    throw new AppError('Admin-owned service is missing its admin owner reference.', 400);
  }

  const existingActive = await Booking.findOne({
    buyerId: req.user._id,
    serviceId: service._id,
    bookingStatus: { $in: ['pending', 'confirmed'] },
    paymentStatus: { $ne: 'paid' },
  });

  if (existingActive) {
    throw new AppError('You already have an active request for this service. Please wait for admin approval or complete your payment.', 400);
  }

  let couponDiscount = 0;
  let normalizedCouponCode = '';

  if (req.body.couponCode) {
    const mockItem = {
      productId: service._id,
      title: service.title,
      category: service.category,
      quantity: 1,
      unitPrice: service.price,
      subtotal: service.price,
    };
    
    const couponResult = await validateCoupon({
      code: req.body.couponCode,
      orderTotal: service.price,
      items: [mockItem],
      userId: req.user._id,
    });
    couponDiscount = couponResult.discountAmount;
    normalizedCouponCode = couponResult.coupon.code;
  }

  const totalAmount = Number((service.price - couponDiscount).toFixed(2));

  const booking = await Booking.create({
    buyerId: req.user._id,
    serviceId: service._id,
    serviceTitle: service.title,
    scheduledDate: new Date(req.body.scheduledDate),
    duration: req.body.duration,
    totalAmount: totalAmount,
    couponCode: normalizedCouponCode,
    couponDiscount: couponDiscount,
    paymentStatus: 'pending',
    paymentProvider: '',
    paymentMethod: '',
    paymentReference: '',
    transactionId: `BKG_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    bookingStatus: 'pending',
    statusTimeline: [{ status: 'pending', timestamp: new Date() }],
  });

  await attachAdminServiceOwnerReference(booking, service);

  return sendResponse(res, 201, true, 'Booking requested successfully.', {
    booking: serializeBooking(await populateBooking(booking._id)),
  });
}

export async function createCheckoutSession(req, res) {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.buyerId.toString() !== req.user._id.toString()) {
    throw new AppError('You are not allowed to pay for this booking.', 403);
  }

  if (booking.bookingStatus !== 'confirmed') {
    throw new AppError('This booking has not been approved by the admin yet.', 400);
  }

  if (booking.paymentStatus === 'paid') {
    throw new AppError('This booking is already paid.', 400);
  }

  const amountInPaise = Math.round(booking.totalAmount * 100);
  const receipt = `bkg_${booking._id.toString().slice(-6)}_${Date.now()}`;

  const razorpayOrder = await createRazorpayOrder({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    notes: {
      campusUserId: req.user._id.toString(),
      bookingId: booking._id.toString(),
    },
  });

  booking.gatewayOrderId = razorpayOrder.id;
  await booking.save();

  return sendResponse(res, 200, true, 'Payment session created successfully.', {
    checkout: {
      bookingId: booking._id,
      keyId: env.razorpayKeyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrderId: razorpayOrder.id,
    },
  });
}

export async function verifyPayment(req, res) {
  const booking = await Booking.findById(req.body.bookingId);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.buyerId.toString() !== req.user._id.toString()) {
    throw new AppError('You are not allowed to verify this payment.', 403);
  }

  if (booking.gatewayOrderId !== req.body.razorpayOrderId) {
    throw new AppError('Checkout session does not match this Razorpay order.', 400);
  }

  const isSignatureValid = verifyRazorpaySignature({
    orderId: req.body.razorpayOrderId,
    paymentId: req.body.razorpayPaymentId,
    signature: req.body.razorpaySignature,
  });

  if (!isSignatureValid) {
    throw new AppError('Payment verification failed. Please retry the checkout.', 400);
  }

  const payment = await fetchRazorpayPayment(req.body.razorpayPaymentId);

  if (payment.order_id !== booking.gatewayOrderId) {
    throw new AppError('Razorpay payment does not belong to this booking checkout.', 400);
  }

  if (!['authorized', 'captured'].includes(payment.status)) {
    throw new AppError('Payment is not in a successful state yet.', 400);
  }

  const service = await Service.findById(booking.serviceId);

  if (service?.ownedByAdmin === true && !service.adminId) {
    throw new AppError('Admin-owned service is missing its admin owner reference.', 400);
  }

  booking.paymentStatus = 'paid';
  booking.paymentProvider = 'razorpay';
  booking.paymentMethod = 'card';
  booking.paymentReference = payment.id;
  booking.paidAt = new Date();
  
  await booking.save();
  await handlePaidBookingRevenue(booking, service);
  await updateCRMOnBooking(booking.buyerId?._id || booking.buyerId, booking.totalAmount);

  return sendResponse(res, 200, true, 'Booking payment verified successfully.', {
    booking: serializeBooking(await populateBooking(booking._id)),
  });
}

export async function payUpi(req, res) {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.buyerId.toString() !== req.user._id.toString()) {
    throw new AppError('You are not allowed to pay for this booking.', 403);
  }

  if (booking.bookingStatus !== 'confirmed') {
    throw new AppError('This booking has not been approved by the admin yet.', 400);
  }

  if (booking.paymentStatus === 'paid') {
    throw new AppError('This booking is already paid.', 400);
  }

  const service = await Service.findById(booking.serviceId);

  if (service?.ownedByAdmin === true && !service.adminId) {
    throw new AppError('Admin-owned service is missing its admin owner reference.', 400);
  }

  booking.paymentStatus = 'paid';
  booking.paymentProvider = 'manual';
  booking.paymentMethod = 'upi';
  booking.paymentReference = `UPI_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  booking.paidAt = new Date();

  await booking.save();
  await handlePaidBookingRevenue(booking, service);
  await updateCRMOnBooking(booking.buyerId?._id || booking.buyerId, booking.totalAmount);

  return sendResponse(res, 200, true, 'UPI Payment completed successfully.', {
    booking: serializeBooking(await populateBooking(booking._id)),
  });
}

export async function getBookings(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { buyerId: req.user._id };

  if (req.query.status) {
    filter.bookingStatus = req.query.status;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('buyerId', 'name email')
      .populate('serviceId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Bookings fetched successfully.', {
    bookings: bookings.map((booking) => serializeBooking(booking)),
    pagination: buildPagination(page, limit, total),
  });
}

export async function getBookingById(req, res) {
  const booking = await populateBooking(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  ensureBookingParticipant(booking, req.user);

  return sendResponse(res, 200, true, 'Booking fetched successfully.', {
    booking: serializeBooking(booking, { includeBuyer: req.user.role === 'admin' }),
  });
}

export async function cancelBooking(req, res) {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.buyerId.toString() !== req.user._id.toString()) {
    throw new AppError('You can only cancel your own bookings.', 403);
  }

  if (!['pending', 'confirmed'].includes(booking.bookingStatus)) {
    throw new AppError('This booking can no longer be cancelled.', 400);
  }

  booking.bookingStatus = 'cancelled';
  booking.cancelledAt = new Date();
  booking.statusTimeline.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: 'Cancelled by buyer.',
  });
  await booking.save();

  return sendResponse(res, 200, true, 'Booking cancelled successfully.', {
    booking: serializeBooking(await populateBooking(booking._id)),
  });
}

export async function getBookingMessages(req, res) {
  const booking = await populateBooking(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  ensureBookingParticipant(booking, req.user);
  ensureChatOpen(booking);

  const messages = await BookingMessage.find({ bookingId: booking._id })
    .populate('senderId', 'name email role profilePictureUrl')
    .sort({ createdAt: 1 });

  return sendResponse(res, 200, true, 'Booking messages fetched successfully.', {
    messages,
  });
}

export async function sendBookingMessage(req, res) {
  const booking = await populateBooking(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  ensureBookingParticipant(booking, req.user);
  ensureChatOpen(booking);

  const message = await BookingMessage.create({
    bookingId: booking._id,
    senderId: req.user._id,
    message: req.body.message,
  });

  return sendResponse(res, 201, true, 'Message sent successfully.', {
    message: await BookingMessage.findById(message._id).populate(
      'senderId',
      'name email role profilePictureUrl',
    ),
  });
}

export async function getAdminBookings(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.status) {
    filter.bookingStatus = req.query.status;
  }

  if (req.query.search) {
    filter.$or = [
      { serviceTitle: { $regex: req.query.search, $options: 'i' } },
      { transactionId: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('buyerId', 'name email')
      .populate('serviceId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Admin bookings fetched successfully.', {
    bookings: bookings.map((booking) => serializeBooking(booking)),
    pagination: buildPagination(page, limit, total),
  });
}

export async function getAdminBookingById(req, res) {
  const booking = await populateBooking(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  return sendResponse(res, 200, true, 'Admin booking fetched successfully.', {
    booking: serializeBooking(booking),
  });
}

export async function updateAdminBookingStatus(req, res) {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  const allowedStatuses = validAdminTransitions[booking.bookingStatus] || [];

  if (!allowedStatuses.includes(req.body.bookingStatus)) {
    throw new AppError(
      `You cannot change a booking from ${booking.bookingStatus} to ${req.body.bookingStatus}.`,
      400,
    );
  }

  booking.bookingStatus = req.body.bookingStatus;
  booking.statusTimeline.push({
    status: req.body.bookingStatus,
    timestamp: new Date(),
    note: 'Updated by admin.',
  });

  if (req.body.bookingStatus === 'confirmed') {
    booking.confirmedAt = new Date();
  }

  if (req.body.bookingStatus === 'completed') {
    booking.completedAt = new Date();
  }

  if (req.body.bookingStatus === 'cancelled') {
    booking.cancelledAt = new Date();
  }

  await booking.save();

  return sendResponse(res, 200, true, 'Booking status updated successfully.', {
    booking: serializeBooking(await populateBooking(booking._id)),
  });
}

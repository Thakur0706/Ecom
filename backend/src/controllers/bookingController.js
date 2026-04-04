import { Booking } from '../models/Booking.js';
import { Service } from '../models/Service.js';
import { LISTING_STATUS, ROLES } from '../constants/enums.js';
import { AppError, sendResponse } from '../utils/http.js';
import { buildPagination, getPagination } from '../utils/pagination.js';

export async function createBooking(req, res) {
  const service = await Service.findOne({
    _id: req.body.serviceId,
    status: LISTING_STATUS.APPROVED,
    isActive: true,
  }).populate('sellerId', 'name email');

  if (!service) {
    throw new AppError('Service is not available.', 404);
  }

  const booking = await Booking.create({
    buyerId: req.user._id,
    sellerId: service.sellerId._id,
    serviceId: service._id,
    serviceTitle: service.title,
    scheduledDate: new Date(req.body.scheduledDate),
    duration: req.body.duration,
    totalAmount: service.price,
    paymentStatus: 'paid',
    transactionId: `TXN_${Date.now()}`,
    bookingStatus: 'pending',
  });

  const populatedBooking = await Booking.findById(booking._id)
    .populate('buyerId', 'name email profilePictureUrl')
    .populate('sellerId', 'name email profilePictureUrl')
    .populate('serviceId');

  return sendResponse(res, 201, true, 'Booking created successfully.', {
    booking: populatedBooking,
  });
}

export async function getMyBookings(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { buyerId: req.user._id };

  if (req.query.status) {
    filter.bookingStatus = req.query.status;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('sellerId', 'name email profilePictureUrl')
      .populate('serviceId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Bookings fetched successfully.', {
    bookings,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getMyServiceBookings(req, res) {
  if (req.user.role !== ROLES.SELLER) {
    throw new AppError('Only sellers can access service bookings.', 403);
  }

  const { page, limit, skip } = getPagination(req.query);
  const filter = { sellerId: req.user._id };

  if (req.query.status) {
    filter.bookingStatus = req.query.status;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('buyerId', 'name email profilePictureUrl')
      .populate('serviceId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Service bookings fetched successfully.', {
    bookings,
    pagination: buildPagination(page, limit, total),
  });
}

export async function updateBookingStatus(req, res) {
  const booking = await Booking.findById(req.params.id)
    .populate('buyerId', 'name email profilePictureUrl')
    .populate('sellerId', 'name email profilePictureUrl')
    .populate('serviceId');

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.sellerId._id.toString() !== req.user._id.toString()) {
    throw new AppError('You can only update your own service bookings.', 403);
  }

  booking.bookingStatus = req.body.bookingStatus;
  await booking.save();

  return sendResponse(res, 200, true, 'Booking status updated successfully.', {
    booking,
  });
}

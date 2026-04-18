import { Booking } from '../models/Booking.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { Service } from '../models/Service.js';
import { refreshProductRating, refreshServiceRating } from '../services/ratingService.js';
import { AppError, sendResponse } from '../utils/http.js';
import { buildPagination, getPagination } from '../utils/pagination.js';

async function ensureProductReviewEligibility({ buyerId, productId }) {
  const deliveredOrder = await Order.findOne({
    buyerId,
    orderStatus: 'delivered',
    'items.productId': productId,
  });

  if (!deliveredOrder) {
    throw new AppError('You can review a product only after a delivered order.', 400);
  }
}

async function ensureServiceReviewEligibility({ buyerId, serviceId }) {
  const completedBooking = await Booking.findOne({
    buyerId,
    serviceId,
    bookingStatus: 'completed',
  });

  if (!completedBooking) {
    throw new AppError('You can review a service only after a completed booking.', 400);
  }
}

async function createTargetReview({ req, res, targetType }) {
  const targetId = req.params.id;
  const existingReview = await Review.findOne({
    reviewerId: req.user._id,
    targetId,
    targetType,
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this item.', 409);
  }

  if (targetType === 'product') {
    const product = await Product.findById(targetId);

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    await ensureProductReviewEligibility({
      buyerId: req.user._id,
      productId: targetId,
    });
  }

  if (targetType === 'service') {
    const service = await Service.findById(targetId);

    if (!service) {
      throw new AppError('Service not found.', 404);
    }

    await ensureServiceReviewEligibility({
      buyerId: req.user._id,
      serviceId: targetId,
    });
  }

  const review = await Review.create({
    reviewerId: req.user._id,
    targetId,
    targetType,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  if (targetType === 'product') {
    await refreshProductRating(targetId);
  }

  if (targetType === 'service') {
    await refreshServiceRating(targetId);
  }

  return sendResponse(res, 201, true, 'Review submitted successfully.', {
    review,
  });
}

async function listReviews(filter, req, res, message) {
  const { page, limit, skip } = getPagination(req.query);
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('reviewerId', 'name profilePictureUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, message, {
    reviews,
    pagination: buildPagination(page, limit, total),
  });
}

export async function createProductReview(req, res) {
  return createTargetReview({ req, res, targetType: 'product' });
}

export async function createServiceReview(req, res) {
  return createTargetReview({ req, res, targetType: 'service' });
}

export async function getProductReviews(req, res) {
  return listReviews({ targetType: 'product', targetId: req.params.id }, req, res, 'Product reviews fetched successfully.');
}

export async function getServiceReviews(req, res) {
  return listReviews({ targetType: 'service', targetId: req.params.id }, req, res, 'Service reviews fetched successfully.');
}

import { Booking } from '../models/Booking.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { Service } from '../models/Service.js';
import { refreshProductRating, refreshServiceRating } from '../services/ratingService.js';
import { AppError, sendResponse } from '../utils/http.js';
import { buildPagination, getPagination } from '../utils/pagination.js';

async function ensureReviewEligibility({ reviewerId, targetId, targetType }) {
  if (targetType === 'product') {
    const deliveredOrder = await Order.findOne({
      buyerId: reviewerId,
      orderStatus: 'delivered',
      'items.productId': targetId,
    });

    if (!deliveredOrder) {
      throw new AppError('You can review a product only after delivery.', 400);
    }
  }

  if (targetType === 'service') {
    const completedBooking = await Booking.findOne({
      buyerId: reviewerId,
      serviceId: targetId,
      bookingStatus: 'completed',
    });

    if (!completedBooking) {
      throw new AppError('You can review a service only after completion.', 400);
    }
  }

  if (targetType === 'seller') {
    const deliveredOrder = await Order.findOne({
      buyerId: reviewerId,
      sellerId: targetId,
      orderStatus: 'delivered',
    });

    if (!deliveredOrder) {
      throw new AppError('You can review a seller only after a delivered order.', 400);
    }
  }
}

export async function createReview(req, res) {
  const existingReview = await Review.findOne({
    reviewerId: req.user._id,
    targetId: req.body.targetId,
    targetType: req.body.targetType,
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this item.', 409);
  }

  if (req.body.targetType === 'product') {
    const product = await Product.findById(req.body.targetId);

    if (!product) {
      throw new AppError('Product not found.', 404);
    }
  }

  if (req.body.targetType === 'service') {
    const service = await Service.findById(req.body.targetId);

    if (!service) {
      throw new AppError('Service not found.', 404);
    }
  }

  await ensureReviewEligibility({
    reviewerId: req.user._id,
    targetId: req.body.targetId,
    targetType: req.body.targetType,
  });

  const review = await Review.create({
    ...req.body,
    reviewerId: req.user._id,
  });

  if (req.body.targetType === 'product') {
    await refreshProductRating(req.body.targetId);
  }

  if (req.body.targetType === 'service') {
    await refreshServiceRating(req.body.targetId);
  }

  return sendResponse(res, 201, true, 'Review submitted successfully.', {
    review,
  });
}

async function listReviews(filter, res, message) {
  const { page, limit, skip } = getPagination(res.req.query);
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

export async function getProductReviews(req, res) {
  return listReviews({ targetType: 'product', targetId: req.params.productId }, res, 'Product reviews fetched successfully.');
}

export async function getServiceReviews(req, res) {
  return listReviews({ targetType: 'service', targetId: req.params.serviceId }, res, 'Service reviews fetched successfully.');
}

export async function getSellerReviews(req, res) {
  return listReviews({ targetType: 'seller', targetId: req.params.sellerId }, res, 'Seller reviews fetched successfully.');
}

export async function getMyReviews(req, res) {
  return listReviews({ reviewerId: req.user._id }, res, 'Your reviews fetched successfully.');
}

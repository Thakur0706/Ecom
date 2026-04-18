import { Booking } from '../models/Booking.js';
import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { validateCoupon } from '../utils/couponHelpers.js';
import { AppError, sendResponse } from '../utils/http.js';
import { buildPagination, getPagination } from '../utils/pagination.js';

function serializeCoupon(coupon) {
  if (!coupon) {
    return null;
  }

  return {
    id: coupon._id,
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: coupon.value,
    maxDiscount: coupon.maxDiscount,
    minOrderValue: coupon.minOrderValue,
    usageLimit: coupon.usageLimit,
    perUserLimit: coupon.perUserLimit,
    startsAt: coupon.startsAt,
    endsAt: coupon.endsAt,
    isActive: coupon.isActive,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
  };
}

export async function validateCouponCode(req, res) {
  const items = req.query.items ? JSON.parse(req.query.items) : [];
  const result = await validateCoupon({
    code: req.query.code,
    orderTotal: Number(req.query.orderTotal || 0),
    items,
    userId: req.user?._id || null,
  });

  return sendResponse(res, 200, true, 'Coupon validated successfully.', {
    coupon: serializeCoupon(result.coupon),
    orderTotal: result.orderTotal,
    discountAmount: result.discountAmount,
    finalTotal: result.finalTotal,
  });
}

export async function getAdminCoupons(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.search) {
    filter.$or = [
      { code: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Coupon.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Coupons fetched successfully.', {
    coupons: coupons.map(serializeCoupon),
    pagination: buildPagination(page, limit, total),
  });
}

export async function createCoupon(req, res) {
  const coupon = await Coupon.create({
    ...req.body,
    code: req.body.code.toUpperCase(),
    startsAt: req.body.startsAt ? new Date(req.body.startsAt) : null,
    endsAt: req.body.endsAt ? new Date(req.body.endsAt) : null,
    createdBy: req.user._id,
  });

  return sendResponse(res, 201, true, 'Coupon created successfully.', {
    coupon: serializeCoupon(coupon),
  });
}

export async function updateCoupon(req, res) {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    throw new AppError('Coupon not found.', 404);
  }

  Object.assign(coupon, {
    ...req.body,
    code: req.body.code ? req.body.code.toUpperCase() : coupon.code,
    startsAt:
      req.body.startsAt === null
        ? null
        : req.body.startsAt
          ? new Date(req.body.startsAt)
          : coupon.startsAt,
    endsAt:
      req.body.endsAt === null
        ? null
        : req.body.endsAt
          ? new Date(req.body.endsAt)
          : coupon.endsAt,
  });
  await coupon.save();

  return sendResponse(res, 200, true, 'Coupon updated successfully.', {
    coupon: serializeCoupon(coupon),
  });
}

export async function deleteCoupon(req, res) {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    throw new AppError('Coupon not found.', 404);
  }

  await coupon.deleteOne();

  return sendResponse(res, 200, true, 'Coupon deleted successfully.', {});
}

export async function getCouponStats(req, res) {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    throw new AppError('Coupon not found.', 404);
  }

  const [orderUses, bookingUses] = await Promise.all([
    Order.find({ couponCode: coupon.code }).select('buyerId totalAmount createdAt'),
    Booking.find({ couponCode: coupon.code }).select('buyerId totalAmount createdAt'),
  ]);

  return sendResponse(res, 200, true, 'Coupon stats fetched successfully.', {
    coupon: serializeCoupon(coupon),
    stats: {
      totalUses: orderUses.length + bookingUses.length,
      orderUses: orderUses.length,
      bookingUses: bookingUses.length,
      revenueInfluenced:
        orderUses.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0) +
        bookingUses.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0),
    },
  });
}

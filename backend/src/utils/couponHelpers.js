import { Booking } from '../models/Booking.js';
import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { AppError } from './http.js';

function toMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

export function normalizeCouponCode(value = '') {
  return value.trim().toUpperCase();
}

export function calculateCouponDiscount(subtotal, coupon) {
  const amount = Number(subtotal || 0);

  if (!coupon || amount <= 0) {
    return 0;
  }

  const rawDiscount =
    coupon.type === 'flat' ? Number(coupon.value) : (amount * Number(coupon.value)) / 100;
  const cappedDiscount =
    coupon.type === 'percent' && Number(coupon.maxDiscount || 0) > 0
      ? Math.min(rawDiscount, Number(coupon.maxDiscount))
      : rawDiscount;

  return toMoney(Math.min(amount, cappedDiscount));
}

async function getCouponUsageCount(code) {
  const [orderCount, bookingCount] = await Promise.all([
    Order.countDocuments({ couponCode: code }),
    Booking.countDocuments({ couponCode: code }),
  ]);

  return orderCount + bookingCount;
}

async function getPerUserCouponUsageCount(code, userId) {
  if (!userId) {
    return 0;
  }

  const [orderCount, bookingCount] = await Promise.all([
    Order.countDocuments({ couponCode: code, buyerId: userId }),
    Booking.countDocuments({ couponCode: code, buyerId: userId }),
  ]);

  return orderCount + bookingCount;
}

function ensureCouponIsWithinValidity(coupon) {
  const now = new Date();

  if (!coupon.isActive) {
    throw new AppError('This coupon is inactive.', 400);
  }

  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    throw new AppError('This coupon is not active yet.', 400);
  }

  if (coupon.endsAt && new Date(coupon.endsAt) < now) {
    throw new AppError('This coupon has expired.', 400);
  }
}

export async function validateCoupon({
  code,
  orderTotal,
  items = [],
  userId = null,
}) {
  const normalizedCode = normalizeCouponCode(code);

  if (!normalizedCode) {
    throw new AppError('Coupon code is required.', 400);
  }

  const coupon = await Coupon.findOne({ code: normalizedCode });

  if (!coupon) {
    throw new AppError('Coupon code not found.', 404);
  }

  ensureCouponIsWithinValidity(coupon);

  const [usageCount, perUserUsageCount] = await Promise.all([
    getCouponUsageCount(normalizedCode),
    getPerUserCouponUsageCount(normalizedCode, userId),
  ]);

  if (Number(coupon.usageLimit || 0) > 0 && usageCount >= Number(coupon.usageLimit)) {
    throw new AppError('This coupon has reached its usage limit.', 400);
  }

  if (Number(coupon.perUserLimit || 0) > 0 && perUserUsageCount >= Number(coupon.perUserLimit)) {
    throw new AppError('You have already used this coupon the maximum number of times.', 400);
  }

  const numericOrderTotal = Number(orderTotal || 0);

  if (numericOrderTotal < Number(coupon.minOrderValue || 0)) {
    throw new AppError(
      `This coupon requires a minimum order value of Rs ${coupon.minOrderValue}.`,
      400,
    );
  }

  const discountAmount = calculateCouponDiscount(numericOrderTotal, coupon);

  return {
    coupon,
    items,
    orderTotal: toMoney(numericOrderTotal),
    discountAmount,
    finalTotal: toMoney(numericOrderTotal - discountAmount),
    usageCount,
    perUserUsageCount,
  };
}

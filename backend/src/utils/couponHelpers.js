import { Booking } from '../models/Booking.js';
import { Order } from '../models/Order.js';
import { AppError } from './http.js';

export const FIRST_TIME_COUPON = {
  code: 'FIRSTBUY10',
  type: 'percent',
  value: 10,
  minOrderAmount: 200,
  description: '10% off on your first successful online payment',
};

function toFixedNumber(value) {
  return Number(Number(value || 0).toFixed(2));
}

export function normalizeCouponCode(value = '') {
  return value.trim().toUpperCase();
}

export function sanitizeListingCoupon(coupon) {
  if (!coupon?.code || !coupon?.type || !coupon?.value) {
    return null;
  }

  return {
    code: normalizeCouponCode(coupon.code),
    type: coupon.type,
    value: Number(coupon.value),
    minOrderAmount: Number(coupon.minOrderAmount || 0),
    description: coupon.description?.trim() || '',
  };
}

export async function isFirstTimeBuyer(userId) {
  const [paidOrders, paidBookings] = await Promise.all([
    Order.countDocuments({ buyerId: userId, paymentStatus: 'paid' }),
    Booking.countDocuments({ buyerId: userId, paymentStatus: 'paid' }),
  ]);

  return paidOrders === 0 && paidBookings === 0;
}

export function calculateCouponDiscount(subtotal, coupon) {
  if (!coupon) {
    return 0;
  }

  const numericSubtotal = Number(subtotal || 0);

  if (numericSubtotal <= 0) {
    return 0;
  }

  const rawDiscount =
    coupon.type === 'flat'
      ? Number(coupon.value)
      : (numericSubtotal * Number(coupon.value)) / 100;

  return toFixedNumber(Math.min(numericSubtotal, rawDiscount));
}

function allocateDiscountAcrossSubtotals(entries, totalDiscount) {
  const allocationMap = new Map();

  if (!entries.length || totalDiscount <= 0) {
    return allocationMap;
  }

  const totalSubtotal = entries.reduce((sum, entry) => sum + Number(entry.subtotal || 0), 0);
  let allocatedTotal = 0;

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const share = totalSubtotal === 0 ? 0 : (totalDiscount * entry.subtotal) / totalSubtotal;
    const roundedShare = isLast
      ? toFixedNumber(totalDiscount - allocatedTotal)
      : toFixedNumber(share);

    allocationMap.set(entry.key, roundedShare);
    allocatedTotal = toFixedNumber(allocatedTotal + roundedShare);
  });

  return allocationMap;
}

export async function resolveProductCoupon({ couponCode, validItems, userId }) {
  const normalizedCode = normalizeCouponCode(couponCode);

  if (!normalizedCode) {
    return {
      couponCode: '',
      discountAmount: 0,
      discountByProductId: new Map(),
      couponMeta: null,
    };
  }

  let eligibleItems = [];
  let couponMeta = null;

  if (normalizedCode === FIRST_TIME_COUPON.code) {
    const isEligible = await isFirstTimeBuyer(userId);

    if (!isEligible) {
      throw new AppError('The first-time coupon is only available before your first paid order or booking.', 400);
    }

    eligibleItems = validItems;
    couponMeta = FIRST_TIME_COUPON;
  } else {
    eligibleItems = validItems.filter(
      (item) => normalizeCouponCode(item.productId?.coupon?.code) === normalizedCode,
    );

    if (!eligibleItems.length) {
      throw new AppError('This coupon is not valid for the items in your cart.', 400);
    }

    couponMeta = eligibleItems[0].productId?.coupon || null;
  }

  const eligibleSubtotal = toFixedNumber(
    eligibleItems.reduce((sum, item) => sum + item.productId.price * item.quantity, 0),
  );

  if (eligibleSubtotal < Number(couponMeta?.minOrderAmount || 0)) {
    throw new AppError(`This coupon requires a minimum spend of Rs ${couponMeta.minOrderAmount}.`, 400);
  }

  const discountAmount = calculateCouponDiscount(eligibleSubtotal, couponMeta);
  const discountByProductId = allocateDiscountAcrossSubtotals(
    eligibleItems.map((item) => ({
      key: item.productId._id.toString(),
      subtotal: item.productId.price * item.quantity,
    })),
    discountAmount,
  );

  return {
    couponCode: normalizedCode,
    discountAmount,
    discountByProductId,
    couponMeta,
  };
}

export async function resolveServiceCoupon({ couponCode, service, userId }) {
  const normalizedCode = normalizeCouponCode(couponCode);

  if (!normalizedCode) {
    return {
      couponCode: '',
      discountAmount: 0,
      couponMeta: null,
    };
  }

  let couponMeta = null;

  if (normalizedCode === FIRST_TIME_COUPON.code) {
    const isEligible = await isFirstTimeBuyer(userId);

    if (!isEligible) {
      throw new AppError('The first-time coupon is only available before your first paid order or booking.', 400);
    }

    couponMeta = FIRST_TIME_COUPON;
  } else if (normalizeCouponCode(service?.coupon?.code) === normalizedCode) {
    couponMeta = service.coupon;
  }

  if (!couponMeta) {
    throw new AppError('This coupon is not valid for the selected service.', 400);
  }

  if (Number(service.price) < Number(couponMeta.minOrderAmount || 0)) {
    throw new AppError(`This coupon requires a minimum spend of Rs ${couponMeta.minOrderAmount}.`, 400);
  }

  return {
    couponCode: normalizedCode,
    discountAmount: calculateCouponDiscount(service.price, couponMeta),
    couponMeta,
  };
}

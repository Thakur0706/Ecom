import MarketingCoupon from "../models/MarketingCoupon.js";
import ReferralCode from "../models/ReferralCode.js";
import { AppError, sendResponse } from "../utils/http.js";

/**
 * ============================================
 * COUPON MANAGEMENT
 * ============================================
 */

export async function createCoupon(req, res) {
  const {
    code,
    type,
    value,
    minOrderAmount,
    maxUses,
    maxUsesPerUser,
    expiresAt,
    applicableTo,
    description,
  } = req.body;

  if (!code || !type || value === undefined || applicableTo === undefined) {
    throw new AppError(
      "Missing required fields: code, type, value, applicableTo",
      400,
    );
  }

  if (!["flat", "percent"].includes(type)) {
    throw new AppError('Type must be "flat" or "percent"', 400);
  }

  if (!["products", "services", "both"].includes(applicableTo)) {
    throw new AppError(
      'applicableTo must be "products", "services", or "both"',
      400,
    );
  }

  // Check if code already exists
  const existingCoupon = await MarketingCoupon.findOne({
    code: code.toUpperCase(),
  });
  if (existingCoupon) {
    throw new AppError("Coupon code already exists", 400);
  }

  const coupon = new MarketingCoupon({
    code: code.toUpperCase(),
    type,
    value: Number(value),
    minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
    maxUses: maxUses ? Number(maxUses) : null,
    maxUsesPerUser: maxUsesPerUser ? Number(maxUsesPerUser) : 1,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    applicableTo,
    description: description || "",
    createdBy: req.user._id,
  });

  await coupon.save();

  return sendResponse(res, 201, true, "Coupon created successfully", {
    coupon: coupon.toObject(),
  });
}

export async function getAllCoupons(req, res) {
  const coupons = await MarketingCoupon.find()
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  const couponsWithStats = coupons.map((coupon) => ({
    ...coupon.toObject(),
    usageStats: {
      used: coupon.usedCount,
      limit: coupon.maxUses,
      remaining: coupon.maxUses
        ? coupon.maxUses - coupon.usedCount
        : "Unlimited",
    },
  }));

  return sendResponse(res, 200, true, "Coupons fetched successfully", {
    coupons: couponsWithStats,
  });
}

export async function updateCoupon(req, res) {
  const { id } = req.params;
  const { value, minOrderAmount, maxUses, expiresAt, isActive, description } =
    req.body;

  const coupon = await MarketingCoupon.findById(id);
  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  if (value !== undefined) {
    coupon.value = Number(value);
  }
  if (minOrderAmount !== undefined) {
    coupon.minOrderAmount = Number(minOrderAmount);
  }
  if (maxUses !== undefined) {
    coupon.maxUses = maxUses ? Number(maxUses) : null;
  }
  if (expiresAt !== undefined) {
    coupon.expiresAt = expiresAt ? new Date(expiresAt) : null;
  }
  if (isActive !== undefined) {
    coupon.isActive = Boolean(isActive);
  }
  if (description !== undefined) {
    coupon.description = description;
  }

  await coupon.save();

  return sendResponse(res, 200, true, "Coupon updated successfully", {
    coupon: coupon.toObject(),
  });
}

export async function deleteCoupon(req, res) {
  const { id } = req.params;

  const coupon = await MarketingCoupon.findByIdAndDelete(id);
  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  return sendResponse(res, 200, true, "Coupon deleted successfully", {
    message: "Coupon has been removed",
  });
}

export async function validateCoupon(req, res) {
  const { code, orderAmount, applicationType } = req.body;

  if (!code || orderAmount === undefined || !applicationType) {
    throw new AppError(
      "Missing required fields: code, orderAmount, applicationType",
      400,
    );
  }

  if (!["products", "services", "both"].includes(applicationType)) {
    throw new AppError(
      'applicationType must be "products", "services", or "both"',
      400,
    );
  }

  const coupon = await MarketingCoupon.findOne({ code: code.toUpperCase() });

  // Check coupon exists
  if (!coupon) {
    return sendResponse(res, 200, true, "Validation result", {
      valid: false,
      reason: "Coupon code not found",
    });
  }

  // Check coupon is active
  if (!coupon.isActive) {
    return sendResponse(res, 200, true, "Validation result", {
      valid: false,
      reason: "Coupon is no longer active",
    });
  }

  // Check expiration
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return sendResponse(res, 200, true, "Validation result", {
      valid: false,
      reason: "Coupon has expired",
    });
  }

  // Check max uses
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return sendResponse(res, 200, true, "Validation result", {
      valid: false,
      reason: "Coupon usage limit reached",
    });
  }

  // Check order amount
  if (Number(orderAmount) < Number(coupon.minOrderAmount)) {
    return sendResponse(res, 200, true, "Validation result", {
      valid: false,
      reason: `Minimum order amount is ₹${coupon.minOrderAmount}`,
    });
  }

  // Check user has not exceeded per-user limit
  const userUseCount = coupon.usedBy.filter(
    (entry) => entry.userId.toString() === req.user._id.toString(),
  ).length;
  if (coupon.maxUsesPerUser && userUseCount >= coupon.maxUsesPerUser) {
    return sendResponse(res, 200, true, "Validation result", {
      valid: false,
      reason: `You can use this coupon maximum ${coupon.maxUsesPerUser} time(s)`,
    });
  }

  // Check applicableTo matches applicationType
  if (
    coupon.applicableTo !== "both" &&
    coupon.applicableTo !== applicationType
  ) {
    return sendResponse(res, 200, true, "Validation result", {
      valid: false,
      reason: `Coupon is applicable only to ${coupon.applicableTo}`,
    });
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === "flat") {
    discount = Number(coupon.value);
  } else if (coupon.type === "percent") {
    discount = (Number(orderAmount) * Number(coupon.value)) / 100;
  }

  return sendResponse(res, 200, true, "Coupon is valid", {
    valid: true,
    discount: Number(discount.toFixed(2)),
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: Number(discount.toFixed(2)),
    },
  });
}

export async function applyCouponToOrder(couponCode, userId, orderAmount) {
  const coupon = await MarketingCoupon.findOne({
    code: couponCode.toUpperCase(),
  });

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  if (!coupon.isActive) {
    throw new AppError("Coupon is not active", 400);
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    throw new AppError("Coupon has expired", 400);
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new AppError("Coupon usage limit reached", 400);
  }

  if (Number(orderAmount) < Number(coupon.minOrderAmount)) {
    throw new AppError(
      `Minimum order amount is ₹${coupon.minOrderAmount}`,
      400,
    );
  }

  const userUseCount = coupon.usedBy.filter(
    (entry) => entry.userId.toString() === userId.toString(),
  ).length;
  if (coupon.maxUsesPerUser && userUseCount >= coupon.maxUsesPerUser) {
    throw new AppError(
      `You can use this coupon maximum ${coupon.maxUsesPerUser} time(s)`,
      400,
    );
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === "flat") {
    discount = Number(coupon.value);
  } else if (coupon.type === "percent") {
    discount = (Number(orderAmount) * Number(coupon.value)) / 100;
  }

  // Update coupon usage
  coupon.usedCount += 1;
  coupon.usedBy.push({ userId, usedAt: new Date() });
  await coupon.save();

  return {
    discount: Number(discount.toFixed(2)),
    coupon,
  };
}

/**
 * ============================================
 * REFERRAL SYSTEM
 * ============================================
 */

function generateReferralCodeForUser(userId) {
  const userIdStr = userId.toString();
  const lastSix = userIdStr.slice(-6).toUpperCase();
  return `CC${lastSix}`;
}

export async function generateReferralCode(req, res) {
  const userId = req.user._id;

  let referralRecord = await ReferralCode.findOne({ userId });

  if (referralRecord) {
    return sendResponse(res, 200, true, "Your referral code", {
      code: referralRecord.code,
      totalRewards: referralRecord.totalRewards,
      usedCount: referralRecord.usedBy.length,
    });
  }

  const code = generateReferralCodeForUser(userId);

  referralRecord = new ReferralCode({
    userId,
    code,
  });

  await referralRecord.save();

  return sendResponse(res, 201, true, "Referral code generated", {
    code: referralRecord.code,
    totalRewards: referralRecord.totalRewards,
    usedCount: referralRecord.usedBy.length,
  });
}

export async function getReferralStats(req, res) {
  const userId = req.user._id;

  const referralRecord = await ReferralCode.findOne({ userId }).populate(
    "usedBy.userId",
    "name email",
  );

  if (!referralRecord) {
    return sendResponse(res, 200, true, "No referral record found", {
      code: null,
      totalRewards: 0,
      usedCount: 0,
      referredUsers: [],
    });
  }

  return sendResponse(res, 200, true, "Referral stats fetched", {
    code: referralRecord.code,
    totalRewards: referralRecord.totalRewards,
    usedCount: referralRecord.usedBy.length,
    referredUsers: referralRecord.usedBy.map((entry) => ({
      userId: entry.userId._id,
      name: entry.userId.name,
      email: entry.userId.email,
      usedAt: entry.usedAt,
    })),
  });
}

export async function applyReferralCode(req, res) {
  const { referralCode } = req.body;
  const userId = req.user._id;

  if (!referralCode) {
    throw new AppError("Referral code is required", 400);
  }

  const referralRecord = await ReferralCode.findOne({
    code: referralCode.toUpperCase(),
  });

  if (!referralRecord) {
    throw new AppError("Invalid referral code", 404);
  }

  // Check if user is the referrer
  if (referralRecord.userId.toString() === userId.toString()) {
    throw new AppError("You cannot use your own referral code", 400);
  }

  // Check if user already used this code
  const alreadyUsed = referralRecord.usedBy.some(
    (entry) => entry.userId.toString() === userId.toString(),
  );

  if (alreadyUsed) {
    throw new AppError("You have already used this referral code", 400);
  }

  // Add user to usedBy
  referralRecord.usedBy.push({ userId, usedAt: new Date() });
  referralRecord.totalRewards += 50;
  await referralRecord.save();

  return sendResponse(res, 200, true, "Referral code applied successfully", {
    message: "Referral applied. The referrer has earned 50 reward points.",
    referralReward: 50,
  });
}

/**
 * Admin endpoint: Get all referral stats for dashboard
 */
export async function getAllReferralStats(req, res) {
  const referralRecords = await ReferralCode.find()
    .populate("userId", "name email")
    .sort({ totalRewards: -1 });

  const stats = referralRecords.map((record) => ({
    id: record._id,
    userId: record.userId._id,
    userName: record.userId.name,
    userEmail: record.userId.email,
    code: record.code,
    usedCount: record.usedBy.length,
    totalRewards: record.totalRewards,
  }));

  return sendResponse(res, 200, true, "All referral stats fetched", {
    referrers: stats,
    totalGenerated: referralRecords.length,
  });
}

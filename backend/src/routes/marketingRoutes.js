import express from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  generateReferralCode,
  getReferralStats,
  applyReferralCode,
  getAllReferralStats,
} from "../controllers/marketingController.js";

const router = express.Router();

/**
 * Middleware to check admin role
 */
function ensureAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
}

/**
 * ============================================
 * COUPON ROUTES (Admin Only)
 * ============================================
 */

// Create coupon
router.post("/coupons", authenticate, ensureAdmin, asyncHandler(createCoupon));

// Get all coupons
router.get("/coupons", authenticate, ensureAdmin, asyncHandler(getAllCoupons));

// Update coupon
router.patch(
  "/coupons/:id",
  authenticate,
  ensureAdmin,
  asyncHandler(updateCoupon),
);

// Delete coupon
router.delete(
  "/coupons/:id",
  authenticate,
  ensureAdmin,
  asyncHandler(deleteCoupon),
);

/**
 * ============================================
 * COUPON VALIDATION (Authenticated Users)
 * ============================================
 */

// Validate coupon at checkout
router.post("/coupons/validate", authenticate, asyncHandler(validateCoupon));

/**
 * ============================================
 * REFERRAL ROUTES (Authenticated Users)
 * ============================================
 */

// Generate referral code for current user
router.post(
  "/referral/generate",
  authenticate,
  asyncHandler(generateReferralCode),
);

// Get referral stats for current user
router.get("/referral", authenticate, asyncHandler(getReferralStats));

// Apply referral code (new user registration / first order flow)
router.post("/referral/apply", authenticate, asyncHandler(applyReferralCode));

/**
 * ============================================
 * ADMIN REFERRAL OVERVIEW (Admin Only)
 * ============================================
 */

// Get all referral stats for administrator
router.get(
  "/referral/admin/stats",
  authenticate,
  ensureAdmin,
  asyncHandler(getAllReferralStats),
);

export default router;

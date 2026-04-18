import { Router } from 'express';
import { validateCouponCode } from '../controllers/couponController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.get('/validate', authenticate, authorizeRoles('buyer', 'supplier'), asyncHandler(validateCouponCode));

export default router;

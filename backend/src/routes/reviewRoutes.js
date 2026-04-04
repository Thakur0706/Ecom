import { Router } from 'express';
import {
  createReview,
  getMyReviews,
  getProductReviews,
  getSellerReviews,
  getServiceReviews,
} from '../controllers/reviewController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { reviewSchema } from '../schemas/index.js';

const router = Router();

router.post('/', authenticate, authorizeRoles('buyer', 'seller'), validate(reviewSchema), asyncHandler(createReview));
router.get('/me', authenticate, authorizeRoles('buyer', 'seller'), asyncHandler(getMyReviews));
router.get('/product/:productId', asyncHandler(getProductReviews));
router.get('/service/:serviceId', asyncHandler(getServiceReviews));
router.get('/seller/:sellerId', asyncHandler(getSellerReviews));

export default router;

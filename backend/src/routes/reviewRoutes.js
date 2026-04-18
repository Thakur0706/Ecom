import { Router } from 'express';
import {
  createProductReview,
  createServiceReview,
  getProductReviews,
  getServiceReviews,
} from '../controllers/reviewController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { reviewSchema } from '../schemas/index.js';

const router = Router();

// GET /api/reviews/product/:id  and  /api/reviews/service/:id
router.get('/product/:id', asyncHandler(getProductReviews));
router.get('/service/:id', asyncHandler(getServiceReviews));

// POST /api/reviews/product/:id  or  /api/reviews/service/:id
router.post(
  '/product/:id',
  authenticate,
  authorizeRoles('buyer', 'supplier'),
  validate(reviewSchema),
  asyncHandler(createProductReview),
);

router.post(
  '/service/:id',
  authenticate,
  authorizeRoles('buyer', 'supplier'),
  validate(reviewSchema),
  asyncHandler(createServiceReview),
);

export default router;

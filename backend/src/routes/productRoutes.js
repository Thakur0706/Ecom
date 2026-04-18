import { Router } from 'express';
import {
  getProductById,
  getProducts,
} from '../controllers/productController.js';
import {
  createProductReview,
  getProductReviews,
} from '../controllers/reviewController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { reviewSchema } from '../schemas/index.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.get('/', asyncHandler(getProducts));
router.get('/:id', asyncHandler(getProductById));
router.get('/:id/reviews', asyncHandler(getProductReviews));
router.post(
  '/:id/reviews',
  authenticate,
  authorizeRoles('buyer', 'supplier'),
  validate(reviewSchema),
  asyncHandler(createProductReview),
);

export default router;

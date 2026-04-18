import { Router } from 'express';
import { getServiceById, getServices } from '../controllers/serviceController.js';
import {
  createServiceReview,
  getServiceReviews,
} from '../controllers/reviewController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { reviewSchema } from '../schemas/index.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.get('/', asyncHandler(getServices));
router.get('/:id', asyncHandler(getServiceById));
router.get('/:id/reviews', asyncHandler(getServiceReviews));
router.post(
  '/:id/reviews',
  authenticate,
  authorizeRoles('buyer', 'supplier'),
  validate(reviewSchema),
  asyncHandler(createServiceReview),
);

export default router;

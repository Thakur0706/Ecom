import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getMyServiceBookings,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { authenticate, authorizeRoles, requireApprovedSeller } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { bookingCreateSchema, bookingStatusSchema } from '../schemas/index.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorizeRoles('buyer', 'seller'),
  validate(bookingCreateSchema),
  asyncHandler(createBooking),
);
router.get('/my-bookings', authenticate, authorizeRoles('buyer', 'seller'), asyncHandler(getMyBookings));
router.get(
  '/my-service-bookings',
  authenticate,
  requireApprovedSeller,
  asyncHandler(getMyServiceBookings),
);
router.patch(
  '/:id/status',
  authenticate,
  requireApprovedSeller,
  validate(bookingStatusSchema),
  asyncHandler(updateBookingStatus),
);

export default router;

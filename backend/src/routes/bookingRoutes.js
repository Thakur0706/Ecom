import { Router } from 'express';
import {
  completeBookingUpiPayment,
  createBooking,
  createBookingPaymentSession,
  getBookingMessages,
  getMyBookings,
  getMyServiceBookings,
  sendBookingMessage,
  updateBookingStatus,
  verifyBookingPayment,
} from '../controllers/bookingController.js';
import { authenticate, authorizeRoles, requireApprovedSeller } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import {
  bookingCreateSchema,
  bookingMessageSchema,
  bookingPaymentSessionSchema,
  bookingPaymentVerificationSchema,
  bookingStatusSchema,
  bookingUpiPaymentSchema,
} from '../schemas/index.js';

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
router.post(
  '/:id/payment-session',
  authenticate,
  authorizeRoles('buyer', 'seller'),
  validate(bookingPaymentSessionSchema),
  asyncHandler(createBookingPaymentSession),
);
router.post(
  '/:id/verify-payment',
  authenticate,
  authorizeRoles('buyer', 'seller'),
  validate(bookingPaymentVerificationSchema),
  asyncHandler(verifyBookingPayment),
);
router.post(
  '/:id/pay-upi',
  authenticate,
  authorizeRoles('buyer', 'seller'),
  validate(bookingUpiPaymentSchema),
  asyncHandler(completeBookingUpiPayment),
);
router.get('/:id/messages', authenticate, authorizeRoles('buyer', 'seller'), asyncHandler(getBookingMessages));
router.post(
  '/:id/messages',
  authenticate,
  authorizeRoles('buyer', 'seller'),
  validate(bookingMessageSchema),
  asyncHandler(sendBookingMessage),
);
router.patch(
  '/:id/status',
  authenticate,
  requireApprovedSeller,
  validate(bookingStatusSchema),
  asyncHandler(updateBookingStatus),
);

export default router;

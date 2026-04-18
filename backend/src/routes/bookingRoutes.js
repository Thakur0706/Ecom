import { Router } from 'express';
import {
  cancelBooking,
  createBooking,
  getBookingById,
  getBookingMessages,
  getBookings,
  sendBookingMessage,
  createCheckoutSession,
  verifyPayment,
  payUpi,
} from '../controllers/bookingController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  bookingCreateSchema,
  bookingMessageSchema,
  bookingPaymentVerificationSchema,
} from '../schemas/index.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.use(authenticate, authorizeRoles('buyer', 'supplier', 'admin'));

router.post('/', authorizeRoles('buyer', 'supplier'), validate(bookingCreateSchema), asyncHandler(createBooking));
router.get('/', authorizeRoles('buyer', 'supplier'), asyncHandler(getBookings));
router.post('/:id/checkout-session', authorizeRoles('buyer', 'supplier'), asyncHandler(createCheckoutSession));
router.post('/verify-payment', authorizeRoles('buyer', 'supplier'), validate(bookingPaymentVerificationSchema), asyncHandler(verifyPayment));
router.post('/:id/upi-payment', authorizeRoles('buyer', 'supplier'), asyncHandler(payUpi));
router.get('/:id/messages', asyncHandler(getBookingMessages));
router.post('/:id/messages', validate(bookingMessageSchema), asyncHandler(sendBookingMessage));
router.get('/:id', asyncHandler(getBookingById));
router.post('/:id/cancel', authorizeRoles('buyer', 'supplier'), asyncHandler(cancelBooking));

export default router;

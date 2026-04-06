import { Router } from 'express';
import {
  cancelOrder,
  createCheckoutSession,
  createOrder,
  getMyPurchases,
  getMySales,
  getOrderById,
  updateOrderStatus,
  verifyCheckoutPayment,
} from '../controllers/orderController.js';
import { authenticate, authorizeRoles, requireApprovedSeller } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import {
  orderCheckoutSchema,
  orderCreateSchema,
  orderPaymentVerificationSchema,
  orderStatusSchema,
} from '../schemas/index.js';

const router = Router();

router.post(
  '/checkout-session',
  authenticate,
  authorizeRoles('buyer', 'seller'),
  validate(orderCheckoutSchema),
  asyncHandler(createCheckoutSession),
);
router.post(
  '/verify-payment',
  authenticate,
  authorizeRoles('buyer', 'seller'),
  validate(orderPaymentVerificationSchema),
  asyncHandler(verifyCheckoutPayment),
);
router.post(
  '/',
  authenticate,
  authorizeRoles('buyer', 'seller'),
  validate(orderCreateSchema),
  asyncHandler(createOrder),
);
router.get('/my-purchases', authenticate, authorizeRoles('buyer', 'seller'), asyncHandler(getMyPurchases));
router.get('/my-sales', authenticate, requireApprovedSeller, asyncHandler(getMySales));
router.get('/:id', authenticate, asyncHandler(getOrderById));
router.patch(
  '/:id/status',
  authenticate,
  requireApprovedSeller,
  validate(orderStatusSchema),
  asyncHandler(updateOrderStatus),
);
router.patch('/:id/cancel', authenticate, authorizeRoles('buyer', 'seller'), asyncHandler(cancelOrder));

export default router;

import { Router } from 'express';
import {
  cancelOrder,
  createCheckoutSession,
  createOrder,
  getOrderById,
  getOrders,
  getOrderMessages,
  sendOrderMessage,
  verifyCheckoutPayment,
} from '../controllers/orderController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  orderCheckoutSchema,
  orderCreateSchema,
  orderPaymentVerificationSchema,
} from '../schemas/index.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.use(authenticate, authorizeRoles('buyer', 'supplier', 'admin'));

router.post('/checkout-session', validate(orderCheckoutSchema), asyncHandler(createCheckoutSession));
router.post('/verify-payment', validate(orderPaymentVerificationSchema), asyncHandler(verifyCheckoutPayment));
router.post('/', validate(orderCreateSchema), asyncHandler(createOrder));
router.get('/', asyncHandler(getOrders));
router.get('/:id', asyncHandler(getOrderById));
router.post('/:id/cancel', asyncHandler(cancelOrder));
router.get('/:id/messages', asyncHandler(getOrderMessages));
router.post('/:id/messages', asyncHandler(sendOrderMessage));

export default router;

import { Router } from 'express';
import {
  addToCart,
  applyCoupon,
  clearCart,
  getCart,
  removeCartItem,
  removeCoupon,
  updateCartItem,
} from '../controllers/cartController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  cartAddSchema,
  cartItemUpdateSchema,
  couponApplySchema,
} from '../schemas/index.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.use(authenticate, authorizeRoles('buyer', 'supplier'));

router.get('/', asyncHandler(getCart));
router.post('/add', validate(cartAddSchema), asyncHandler(addToCart));
router.delete('/clear', asyncHandler(clearCart));
router.post('/apply-coupon', validate(couponApplySchema), asyncHandler(applyCoupon));
router.delete('/remove-coupon', asyncHandler(removeCoupon));
router.patch('/:itemId', validate(cartItemUpdateSchema), asyncHandler(updateCartItem));
router.delete('/:itemId', asyncHandler(removeCartItem));

export default router;

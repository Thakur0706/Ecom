import { Router } from 'express';
import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../controllers/cartController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { cartAddSchema, cartUpdateSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate, authorizeRoles('buyer', 'seller'));

router.get('/', asyncHandler(getCart));
router.post('/add', validate(cartAddSchema), asyncHandler(addToCart));
router.put('/update', validate(cartUpdateSchema), asyncHandler(updateCartItem));
router.delete('/remove/:productId', asyncHandler(removeCartItem));
router.delete('/clear', asyncHandler(clearCart));

export default router;

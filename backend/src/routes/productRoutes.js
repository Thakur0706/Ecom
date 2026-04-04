import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getOwnProducts,
  getProductById,
  getProducts,
  toggleProduct,
  updateProduct,
} from '../controllers/productController.js';
import { authenticate, requireApprovedSeller } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { productSchema } from '../schemas/index.js';

const router = Router();

router.get('/', asyncHandler(getProducts));
router.get('/mine', authenticate, requireApprovedSeller, asyncHandler(getOwnProducts));
router.get('/:id', asyncHandler(getProductById));
router.post('/', authenticate, requireApprovedSeller, validate(productSchema), asyncHandler(createProduct));
router.put('/:id', authenticate, requireApprovedSeller, validate(productSchema), asyncHandler(updateProduct));
router.delete('/:id', authenticate, requireApprovedSeller, asyncHandler(deleteProduct));
router.patch('/:id/toggle', authenticate, requireApprovedSeller, asyncHandler(toggleProduct));

export default router;

import { Router } from 'express';
import {
  createSupplierProduct,
  deleteSupplierProduct,
  getSupplierProductById,
  getSupplierProducts,
  updateSupplierProduct,
} from '../controllers/productController.js';
import {
  applyForSupplier,
  getSupplierLedgerEntries,
  getSupplierLedgerSummaryController,
  getSupplierStatus,
  requestSupplierPayment,
} from '../controllers/supplierController.js';
import {
  getSupplierOrders,
  updateSupplierOrderStatus,
  acknowledgeSupplierOrder,
  getOrderMessages,
  sendOrderMessage,
} from '../controllers/orderController.js';
import { authenticate, authorizeRoles, requireApprovedSupplier } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  supplierApplicationSchema,
  supplierPaymentRequestSchema,
  supplierProductCreateSchema,
  supplierProductUpdateSchema,
} from '../schemas/index.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.post(
  '/apply',
  authenticate,
  authorizeRoles('buyer', 'supplier'),
  validate(supplierApplicationSchema),
  asyncHandler(applyForSupplier),
);
router.get('/status', authenticate, authorizeRoles('buyer', 'supplier'), asyncHandler(getSupplierStatus));

router.post(
  '/products',
  authenticate,
  requireApprovedSupplier,
  validate(supplierProductCreateSchema),
  asyncHandler(createSupplierProduct),
);
router.get('/products', authenticate, requireApprovedSupplier, asyncHandler(getSupplierProducts));
router.get('/products/:id', authenticate, requireApprovedSupplier, asyncHandler(getSupplierProductById));
router.patch(
  '/products/:id',
  authenticate,
  requireApprovedSupplier,
  validate(supplierProductUpdateSchema),
  asyncHandler(updateSupplierProduct),
);
router.delete('/products/:id', authenticate, requireApprovedSupplier, asyncHandler(deleteSupplierProduct));

router.get('/ledger', authenticate, requireApprovedSupplier, asyncHandler(getSupplierLedgerEntries));
router.get(
  '/ledger/summary',
  authenticate,
  requireApprovedSupplier,
  asyncHandler(getSupplierLedgerSummaryController),
);
router.post(
  '/ledger/payment-request',
  authenticate,
  requireApprovedSupplier,
  validate(supplierPaymentRequestSchema),
  asyncHandler(requestSupplierPayment),
);

router.get('/orders', authenticate, requireApprovedSupplier, asyncHandler(getSupplierOrders));
router.patch('/orders/:id/status', authenticate, requireApprovedSupplier, asyncHandler(updateSupplierOrderStatus));
router.get('/orders/:id/messages', authenticate, requireApprovedSupplier, asyncHandler(getOrderMessages));
router.post('/orders/:id/messages', authenticate, requireApprovedSupplier, asyncHandler(sendOrderMessage));
router.post('/orders/:id/acknowledge', authenticate, requireApprovedSupplier, asyncHandler(acknowledgeSupplierOrder));

export default router;

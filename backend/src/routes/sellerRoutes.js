import { Router } from 'express';
import {
  applyForSeller,
  generateSellerReport,
  getSellerCategorySales,
  getSellerCustomerDetail,
  getSellerCustomers,
  getSellerDashboardOverview,
  getSellerInventory,
  getSellerOrderMetrics,
  getSellerRevenueChart,
  getSellerRevenueTrend,
  getSellerStatus,
  getSellerTopProducts,
} from '../controllers/sellerController.js';
import { authenticate, authorizeRoles, requireApprovedSeller } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { sellerApplySchema } from '../schemas/index.js';

const router = Router();

router.post(
  '/apply',
  authenticate,
  authorizeRoles('buyer', 'seller'),
  validate(sellerApplySchema),
  asyncHandler(applyForSeller),
);
router.get('/status', authenticate, authorizeRoles('buyer', 'seller'), asyncHandler(getSellerStatus));

router.get(
  '/dashboard/overview',
  authenticate,
  requireApprovedSeller,
  asyncHandler(getSellerDashboardOverview),
);
router.get('/erp/inventory', authenticate, requireApprovedSeller, asyncHandler(getSellerInventory));
router.get(
  '/erp/revenue-chart',
  authenticate,
  requireApprovedSeller,
  asyncHandler(getSellerRevenueChart),
);
router.get('/erp/order-metrics', authenticate, requireApprovedSeller, asyncHandler(getSellerOrderMetrics));
router.get('/crm/customers', authenticate, requireApprovedSeller, asyncHandler(getSellerCustomers));
router.get('/crm/customers/:id', authenticate, requireApprovedSeller, asyncHandler(getSellerCustomerDetail));
router.get(
  '/analytics/revenue-trend',
  authenticate,
  requireApprovedSeller,
  asyncHandler(getSellerRevenueTrend),
);
router.get(
  '/analytics/category-sales',
  authenticate,
  requireApprovedSeller,
  asyncHandler(getSellerCategorySales),
);
router.get('/analytics/top-products', authenticate, requireApprovedSeller, asyncHandler(getSellerTopProducts));
router.get('/reports/generate', authenticate, requireApprovedSeller, asyncHandler(generateSellerReport));

export default router;

import { Router } from 'express';
import {
  approveProduct,
  approveSeller,
  approveService,
  generateAdminReport,
  getAdminActivityFeed,
  getAdminCrmCustomers,
  getAdminDashboardOverview,
  getAdminErpOverview,
  getAdminOrders,
  getAdminProducts,
  getAdminRevenueChart,
  getAdminRevenueTrend,
  getAdminServices,
  getAdminTickets,
  getAdminTopProducts,
  getAdminTopSellers,
  getAdminUserGrowth,
  getPendingSellers,
  getSellerApplicationDetail,
  getUsers,
  rejectSeller,
  removeProduct,
  removeService,
  resolveTicket,
  toggleUserStatus,
} from '../controllers/adminController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import {
  adminTicketUpdateSchema,
  sellerRejectionSchema,
  userStatusToggleSchema,
} from '../schemas/index.js';

const router = Router();

router.use(authenticate, authorizeRoles('admin'));

router.get('/dashboard/overview', asyncHandler(getAdminDashboardOverview));
router.get('/sellers/pending', asyncHandler(getPendingSellers));
router.get('/sellers/:id', asyncHandler(getSellerApplicationDetail));
router.patch('/sellers/:id/approve', asyncHandler(approveSeller));
router.patch('/sellers/:id/reject', validate(sellerRejectionSchema), asyncHandler(rejectSeller));
router.get('/users', asyncHandler(getUsers));
router.patch('/users/:id/toggle-status', validate(userStatusToggleSchema), asyncHandler(toggleUserStatus));
router.get('/products', asyncHandler(getAdminProducts));
router.patch('/products/:id/approve', asyncHandler(approveProduct));
router.patch('/products/:id/remove', asyncHandler(removeProduct));
router.get('/services', asyncHandler(getAdminServices));
router.patch('/services/:id/approve', asyncHandler(approveService));
router.patch('/services/:id/remove', asyncHandler(removeService));
router.get('/orders', asyncHandler(getAdminOrders));
router.get('/erp/overview', asyncHandler(getAdminErpOverview));
router.get('/erp/revenue-chart', asyncHandler(getAdminRevenueChart));
router.get('/erp/tickets', asyncHandler(getAdminTickets));
router.patch('/erp/tickets/:id/resolve', validate(adminTicketUpdateSchema), asyncHandler(resolveTicket));
router.get('/crm/customers', asyncHandler(getAdminCrmCustomers));
router.get('/crm/activity-feed', asyncHandler(getAdminActivityFeed));
router.get('/analytics/revenue-trend', asyncHandler(getAdminRevenueTrend));
router.get('/analytics/top-sellers', asyncHandler(getAdminTopSellers));
router.get('/analytics/top-products', asyncHandler(getAdminTopProducts));
router.get('/analytics/user-growth', asyncHandler(getAdminUserGrowth));
router.get('/reports/generate', asyncHandler(generateAdminReport));

export default router;

import { Router } from 'express';
import {
  createAdminProduct as createAdminOwnedProduct,
  createSupplierPayment,
  getAdminAnalytics,
  getAdminDashboardOverview,
  getAdminProducts as getAdminOwnedProducts,
  getAdminRevenueChart,
  getAdminTopProducts,
  getCRMCustomers,
  getCRMOverview,
  getUsers,
  toggleUserStatus,
  updateCRMRecord,
  updateAdminProduct,
} from '../controllers/adminController.js';
import {
  getAdminBookings,
  getAdminBookingById,
  updateAdminBookingStatus,
} from '../controllers/bookingController.js';
import {
  createCoupon,
  deleteCoupon,
  getAdminCoupons,
  getCouponStats,
  updateCoupon,
} from '../controllers/couponController.js';
import {
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
  getOrderMessages,
  sendOrderMessage,
  closeOrderChat,
} from '../controllers/orderController.js';
import {
  approveProduct,
  createAdminProduct as createDirectAdminProduct,
  delistProduct,
  getAdminProductById,
  getAdminProducts as getAllAdminProducts,
  getPendingProducts,
  rejectProduct,
  relistProduct,
  updateProductPricing,
  updateProductStock,
} from '../controllers/productController.js';
import { createService, deleteService, getAdminServices, updateService } from '../controllers/serviceController.js';
import {
  approveSupplierApplication,
  getAdminSupplierDetail,
  getAdminSupplierLedger,
  getAdminSuppliers,
  getSupplierApplications,
  getSupplierPaymentRequests,
  rejectSupplierApplication,
} from '../controllers/supplierController.js';
import { getAdminTickets, updateAdminTicket } from '../controllers/ticketController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  adminApproveProductSchema,
  adminDirectProductSchema,
  adminProductPricingSchema,
  adminProductStockSchema,
  adminRejectProductSchema,
  adminTicketUpdateSchema,
  bookingStatusSchema,
  couponSchema,
  orderStatusSchema,
  serviceSchema,
  supplierPaymentSchema,
  userStatusToggleSchema,
} from '../schemas/index.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.use(authenticate, isAdmin);

router.get('/dashboard/overview', asyncHandler(getAdminDashboardOverview));
router.get('/dashboard/revenue-chart', asyncHandler(getAdminRevenueChart));
router.get('/dashboard/top-products', asyncHandler(getAdminTopProducts));
router.get('/dashboard/analytics', asyncHandler(getAdminAnalytics));
router.get('/crm/overview', asyncHandler(getCRMOverview));
router.get('/crm/customers', asyncHandler(getCRMCustomers));
router.patch('/crm/:userId', asyncHandler(updateCRMRecord));

router.get('/users', asyncHandler(getUsers));
router.patch('/users/:id/toggle-status', validate(userStatusToggleSchema), asyncHandler(toggleUserStatus));

router.get('/products/pending', asyncHandler(getPendingProducts));
router.get('/products', asyncHandler(getAllAdminProducts));
router.get('/products/my-list', asyncHandler(getAdminOwnedProducts));
router.post('/products/create', asyncHandler(createAdminOwnedProduct));
router.get('/products/:id', asyncHandler(getAdminProductById));
router.patch('/products/:id/edit', asyncHandler(updateAdminProduct));
router.post('/products/approve/:id', validate(adminApproveProductSchema), asyncHandler(approveProduct));
router.post('/products/reject/:id', validate(adminRejectProductSchema), asyncHandler(rejectProduct));
router.patch('/products/:id/pricing', validate(adminProductPricingSchema), asyncHandler(updateProductPricing));
router.patch('/products/:id/delist', asyncHandler(delistProduct));
router.patch('/products/:id/relist', asyncHandler(relistProduct));
router.post('/products/direct', validate(adminDirectProductSchema), asyncHandler(createDirectAdminProduct));
router.patch('/products/:id/stock', validate(adminProductStockSchema), asyncHandler(updateProductStock));

router.get('/services', asyncHandler(getAdminServices));
router.post('/services', validate(serviceSchema), asyncHandler(createService));
router.patch('/services/:id', validate(serviceSchema), asyncHandler(updateService));
router.delete('/services/:id', asyncHandler(deleteService));

router.get('/orders', asyncHandler(getAdminOrders));
router.get('/orders/:id', asyncHandler(getAdminOrderById));
router.patch('/orders/:id/status', validate(orderStatusSchema), asyncHandler(updateAdminOrderStatus));
router.get('/orders/:id/messages', asyncHandler(getOrderMessages));
router.post('/orders/:id/messages', asyncHandler(sendOrderMessage));
router.patch('/orders/:id/close-chat', asyncHandler(closeOrderChat));

router.get('/bookings', asyncHandler(getAdminBookings));
router.get('/bookings/:id', asyncHandler(getAdminBookingById));
router.patch('/bookings/:id/status', validate(bookingStatusSchema), asyncHandler(updateAdminBookingStatus));

router.get('/suppliers', asyncHandler(getAdminSuppliers));
router.get('/suppliers/payment-requests', asyncHandler(getSupplierPaymentRequests));
router.get('/suppliers/:id', asyncHandler(getAdminSupplierDetail));
router.get('/suppliers/:id/ledger', asyncHandler(getAdminSupplierLedger));
router.post('/suppliers/:id/payment', validate(supplierPaymentSchema), asyncHandler(createSupplierPayment));

router.get('/coupons', asyncHandler(getAdminCoupons));
router.post('/coupons', validate(couponSchema), asyncHandler(createCoupon));
router.patch('/coupons/:id', validate(couponSchema.partial()), asyncHandler(updateCoupon));
router.delete('/coupons/:id', asyncHandler(deleteCoupon));
router.get('/coupons/:id/stats', asyncHandler(getCouponStats));

router.get('/supplier-applications', asyncHandler(getSupplierApplications));
router.patch('/supplier-applications/:id/approve', asyncHandler(approveSupplierApplication));
router.patch('/supplier-applications/:id/reject', validate(adminRejectProductSchema), asyncHandler(rejectSupplierApplication));

router.get('/support/tickets', asyncHandler(getAdminTickets));
router.patch('/support/tickets/:id', validate(adminTicketUpdateSchema), asyncHandler(updateAdminTicket));

export default router;

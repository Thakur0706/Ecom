import { Router } from 'express';
import {
  createAdminService,
  deleteAdminService,
  getAdminServiceRevenue,
  getAdminServices,
  updateAdminService,
} from '../controllers/adminServiceController.js';
import { authenticate as authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const adminServiceRouter = Router();

adminServiceRouter.use(authenticateToken, authorizeRoles('admin'));

adminServiceRouter.post('/create', asyncHandler(createAdminService));
adminServiceRouter.patch('/:id', asyncHandler(updateAdminService));
adminServiceRouter.delete('/:id', asyncHandler(deleteAdminService));
adminServiceRouter.get('/my-services', asyncHandler(getAdminServices));
adminServiceRouter.get('/revenue', asyncHandler(getAdminServiceRevenue));

export default adminServiceRouter;

import { Router } from 'express';
import {
  createService,
  deleteService,
  getOwnServices,
  getServiceById,
  getServices,
  toggleService,
  updateService,
} from '../controllers/serviceController.js';
import { authenticate, requireApprovedSeller } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { serviceSchema } from '../schemas/index.js';

const router = Router();

router.get('/', asyncHandler(getServices));
router.get('/mine', authenticate, requireApprovedSeller, asyncHandler(getOwnServices));
router.get('/:id', asyncHandler(getServiceById));
router.post('/', authenticate, requireApprovedSeller, validate(serviceSchema), asyncHandler(createService));
router.put('/:id', authenticate, requireApprovedSeller, validate(serviceSchema), asyncHandler(updateService));
router.delete('/:id', authenticate, requireApprovedSeller, asyncHandler(deleteService));
router.patch('/:id/toggle', authenticate, requireApprovedSeller, asyncHandler(toggleService));

export default router;

import { Router } from 'express';
import { createTicket, getMyTickets } from '../controllers/ticketController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { ticketSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate, authorizeRoles('buyer', 'seller'));

router.post('/', validate(ticketSchema), asyncHandler(createTicket));
router.get('/mine', asyncHandler(getMyTickets));

export default router;

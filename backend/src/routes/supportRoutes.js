import { Router } from 'express';
import { createTicket, getMyTickets } from '../controllers/ticketController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ticketSchema } from '../schemas/index.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.use(authenticate, authorizeRoles('buyer', 'supplier'));

router.post('/tickets', validate(ticketSchema), asyncHandler(createTicket));
router.get('/tickets', asyncHandler(getMyTickets));

export default router;

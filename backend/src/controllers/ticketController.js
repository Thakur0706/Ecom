import { SupportTicket } from '../models/SupportTicket.js';
import { AppError, sendResponse } from '../utils/http.js';
import { buildPagination, getPagination } from '../utils/pagination.js';

export async function createTicket(req, res) {
  const ticket = await SupportTicket.create({
    raisedBy: req.user._id,
    subject: req.body.subject,
    description: req.body.description,
    status: 'open',
  });

  return sendResponse(res, 201, true, 'Support ticket created successfully.', {
    ticket,
  });
}

export async function getMyTickets(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { raisedBy: req.user._id };
  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SupportTicket.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Support tickets fetched successfully.', {
    tickets,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getTicketById(ticketId) {
  const ticket = await SupportTicket.findById(ticketId).populate('raisedBy', 'name email');

  if (!ticket) {
    throw new AppError('Support ticket not found.', 404);
  }

  return ticket;
}

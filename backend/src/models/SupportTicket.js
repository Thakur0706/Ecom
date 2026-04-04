import mongoose from 'mongoose';
import { TICKET_STATUS } from '../constants/enums.js';

const supportTicketSchema = new mongoose.Schema(
  {
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: TICKET_STATUS,
      default: 'open',
    },
    adminNote: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

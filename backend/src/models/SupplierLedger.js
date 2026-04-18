import mongoose from 'mongoose';
import {
  LEDGER_ENTRY_STATUS,
  LEDGER_ENTRY_TYPES,
} from '../constants/enums.js';

const supplierLedgerSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    orderItemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    type: {
      type: String,
      enum: LEDGER_ENTRY_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: LEDGER_ENTRY_STATUS,
      default: 'pending',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: '',
      trim: true,
    },
    reference: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    linkedCreditIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'SupplierLedger',
      default: [],
    },
    paidAt: {
      type: Date,
      default: null,
    },
    isAcknowledged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

supplierLedgerSchema.index({ supplierId: 1, createdAt: -1 });
supplierLedgerSchema.index({ orderId: 1, orderItemId: 1 });

export const SupplierLedger = mongoose.model('SupplierLedger', supplierLedgerSchema);

import mongoose from 'mongoose';
import { ORDER_STATUS, PAYMENT_STATUS } from '../constants/enums.js';

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    quotedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 90,
    },
    finalUnitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    supplierPayable: {
      type: Number,
      required: true,
      min: 0,
    },
    supplierLedgerEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplierLedger',
      default: null,
    },
  },
  {
    _id: true,
  },
);

const statusTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUS,
      required: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    couponCode: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS,
      default: 'paid',
    },
    paymentProvider: {
      type: String,
      default: 'manual',
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: 'card',
      trim: true,
    },
    paymentReference: {
      type: String,
      default: '',
      trim: true,
    },
    gatewayOrderId: {
      type: String,
      default: '',
      trim: true,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUS,
      default: 'placed',
      index: true,
    },
    statusTimeline: {
      type: [statusTimelineSchema],
      default: () => [{ status: 'placed', timestamp: new Date() }],
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    isChatOpen: {
      type: Boolean,
      default: true,
    },
    supplierAcknowledged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);

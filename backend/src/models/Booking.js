import mongoose from 'mongoose';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../constants/enums.js';

const bookingTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: BOOKING_STATUS,
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

const bookingSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    serviceTitle: {
      type: String,
      default: '',
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    couponCode: {
      type: String,
      default: '',
      trim: true,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS,
      default: 'pending',
    },
    paymentProvider: {
      type: String,
      default: '',
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: '',
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
    bookingStatus: {
      type: String,
      enum: BOOKING_STATUS,
      default: 'pending',
      index: true,
    },
    statusTimeline: {
      type: [bookingTimelineSchema],
      default: () => [{ status: 'pending', timestamp: new Date() }],
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({ buyerId: 1, createdAt: -1 });

export const Booking = mongoose.model('Booking', bookingSchema);

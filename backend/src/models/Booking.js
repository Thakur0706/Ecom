import mongoose from "mongoose";
import { BOOKING_STATUS, PAYMENT_STATUS } from "../constants/enums.js";

const bookingSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    serviceTitle: {
      type: String,
      default: "",
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
    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    originalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS,
      default: "pending",
    },
    paymentProvider: {
      type: String,
      default: "",
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: "",
      trim: true,
    },
    paymentReference: {
      type: String,
      default: "",
      trim: true,
    },
    gatewayOrderId: {
      type: String,
      default: "",
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
      default: "pending",
    },
    sellerConfirmedAt: {
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

export const Booking = mongoose.model("Booking", bookingSchema);

import mongoose from "mongoose";
import { ORDER_STATUS, PAYMENT_STATUS } from "../constants/enums.js";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const statusTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUS,
      required: true,
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
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
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
      default: "paid",
    },
    paymentProvider: {
      type: String,
      default: "manual",
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: "card",
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
    orderStatus: {
      type: String,
      enum: ORDER_STATUS,
      default: "placed",
    },
    statusTimeline: {
      type: [statusTimelineSchema],
      default: () => [{ status: "placed", timestamp: new Date() }],
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Order = mongoose.model("Order", orderSchema);

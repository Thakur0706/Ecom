import mongoose from "mongoose";

const sellerCommissionSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    type: {
      type: String,
      enum: ["order", "booking", "cod"],
      required: true,
    },
    orderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    sellerPayableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentReference: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for quick lookups
sellerCommissionSchema.index({ sellerId: 1, paymentStatus: 1 });
sellerCommissionSchema.index({ createdAt: -1 });

export const SellerCommission = mongoose.model(
  "SellerCommission",
  sellerCommissionSchema,
);

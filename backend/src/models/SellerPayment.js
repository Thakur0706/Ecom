import mongoose from "mongoose";

const sellerPaymentSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentReference: {
      type: String,
      default: "",
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: "bank",
      trim: true,
    },
    paidAt: {
      type: Date,
      default: null,
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
sellerPaymentSchema.index({ sellerId: 1, status: 1 });
sellerPaymentSchema.index({ createdAt: -1 });

export const SellerPayment = mongoose.model(
  "SellerPayment",
  sellerPaymentSchema,
);

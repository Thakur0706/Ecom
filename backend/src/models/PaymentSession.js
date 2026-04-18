import mongoose from 'mongoose';

const paymentSessionItemSchema = new mongoose.Schema(
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
  },
  {
    _id: false,
  },
);

const paymentSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    preferredMethod: {
      type: String,
      enum: ['upi', 'card'],
      default: 'upi',
    },
    amount: {
      type: Number,
      required: true,
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
      default: '',
      trim: true,
      uppercase: true,
    },
    amountInPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    cartItems: {
      type: [paymentSessionItemSchema],
      default: [],
    },
    receipt: {
      type: String,
      required: true,
      trim: true,
    },
    paymentProvider: {
      type: String,
      default: 'razorpay',
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'completed', 'failed'],
      default: 'created',
    },
    razorpayOrderId: {
      type: String,
      default: '',
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      default: '',
      trim: true,
    },
    razorpaySignature: {
      type: String,
      default: '',
      trim: true,
    },
    localOrderIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Order',
      default: [],
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const PaymentSession = mongoose.model('PaymentSession', paymentSessionSchema);

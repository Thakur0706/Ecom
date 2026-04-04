import mongoose from 'mongoose';
import { SELLER_STATUS } from '../constants/enums.js';

const sellerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
    },
    collegeName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    upiOrBankDetails: {
      type: String,
      required: true,
      trim: true,
    },
    govIdUrl: {
      type: String,
      required: true,
      trim: true,
    },
    studentIdUrl: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(SELLER_STATUS),
      default: SELLER_STATUS.PENDING,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema);

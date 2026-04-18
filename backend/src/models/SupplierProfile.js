import mongoose from 'mongoose';
import { SUPPLIER_STATUS } from '../constants/enums.js';

const supplierProfileSchema = new mongoose.Schema(
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
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    businessType: {
      type: String,
      enum: ['physical_shop', 'side_business', 'individual', 'freelance'],
      default: 'individual',
    },
    businessAddress: {
      type: String,
      trim: true,
      default: '',
    },
    businessDescription: {
      type: String,
      trim: true,
      default: '',
    },
    isStudent: {
      type: Boolean,
      default: true,
    },
    studentId: {
      type: String,
      trim: true,
    },
    collegeName: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
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
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(SUPPLIER_STATUS),
      default: SUPPLIER_STATUS.PENDING,
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
    paymentRequestRaised: {
      type: Boolean,
      default: false,
    },
    paymentRequestRaisedAt: {
      type: Date,
      default: null,
    },
    paymentRequestNote: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const SupplierProfile = mongoose.model('SupplierProfile', supplierProfileSchema);

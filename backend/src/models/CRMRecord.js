import mongoose from 'mongoose';

const crmRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBookings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityAt: {
      type: Date,
      default: null,
    },
    firstPurchaseAt: {
      type: Date,
      default: null,
    },
    segment: {
      type: String,
      enum: ['new', 'active', 'high_value', 'at_risk', 'churned'],
      default: 'new',
    },
    satisfactionScore: {
      type: Number,
      default: null,
      min: 1,
      max: 5,
    },
    lifetimeValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const CRMRecord = mongoose.model('CRMRecord', crmRecordSchema);

export default CRMRecord;

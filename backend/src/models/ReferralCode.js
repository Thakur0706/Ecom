import mongoose from 'mongoose';

const referralUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const referralCodeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    usedBy: {
      type: [referralUsageSchema],
      default: [],
    },
    totalRewards: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

const ReferralCode = mongoose.model('ReferralCode', referralCodeSchema);

export default ReferralCode;

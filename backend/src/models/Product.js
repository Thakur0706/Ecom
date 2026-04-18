import mongoose from 'mongoose';
import {
  LISTING_SOURCE,
  PRODUCT_CONDITIONS,
  PRODUCT_STATUS,
} from '../constants/enums.js';

const productSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    listedByAdmin: {
      type: Boolean,
      default: false,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    listingSource: {
      type: String,
      enum: Object.values(LISTING_SOURCE),
      required: true,
      default: LISTING_SOURCE.SUPPLIER,
    },
    revenueType: {
      type: String,
      enum: ['admin', 'supplier'],
      default: 'supplier',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    condition: {
      type: String,
      enum: PRODUCT_CONDITIONS,
      required: true,
    },
    quotedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 90,
    },
    discountActive: {
      type: Boolean,
      default: false,
    },
    finalPrice: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    availableStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    unitsSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isFlashSale: {
      type: Boolean,
      default: false,
    },
    hasLowStockAlert: {
      type: Boolean,
      default: false,
    },
    lowStockAlertAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.PENDING,
      index: true,
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
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    delistedAt: {
      type: Date,
      default: null,
    },
    delistedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

function computeFinalPrice(product) {
  const basePrice =
    product.sellingPrice === null || product.sellingPrice === undefined
      ? Number(product.quotedPrice || 0)
      : Number(product.sellingPrice || 0);
  const effectiveDiscount = product.discountActive ? Number(product.discountPercent || 0) : 0;
  const finalPrice = basePrice * (1 - effectiveDiscount / 100);

  return Number(finalPrice.toFixed(2));
}

productSchema.pre('save', function setComputedFields(next) {
  this.finalPrice = computeFinalPrice(this);

  const isLowStock = Number(this.availableStock || 0) <= Number(this.lowStockThreshold || 0);
  this.hasLowStockAlert = isLowStock;
  this.lowStockAlertAt = isLowStock ? this.lowStockAlertAt || new Date() : null;

  next();
});

productSchema.methods.recomputePricing = function recomputePricing() {
  this.finalPrice = computeFinalPrice(this);
  return this.finalPrice;
};

const Product = mongoose.model('Product', productSchema);

export { Product };
export default Product;

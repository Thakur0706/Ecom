import { z } from 'zod';
import {
  BOOKING_STATUS,
  COUPON_TYPES,
  ORDER_STATUS,
  PRODUCT_CONDITIONS,
  TICKET_STATUS,
} from '../constants/enums.js';

const nonEmptyString = (label) => z.string().trim().min(1, `${label} is required.`);
const optionalUrlString = (label) =>
  z
    .string()
    .trim()
    .url(`${label} must be a valid URL.`)
    .or(z.literal(''))
    .optional()
    .default('');

export const supplierApplicationSchema = z.object({
  fullName: nonEmptyString('Full name'),
  storeName: nonEmptyString('Store/Shop name'),
  businessType: z.enum(['physical_shop', 'side_business', 'individual', 'freelance']).default('individual'),
  businessAddress: z.string().trim().optional().default(''),
  businessDescription: z.string().trim().optional().default(''),
  isStudent: z.boolean().optional().default(false),
  studentId: z.string().trim().optional().default(''),
  collegeName: z.string().trim().optional().default(''),
  department: z.string().trim().optional().default(''),
  contactNumber: nonEmptyString('Contact number'),
  upiOrBankDetails: nonEmptyString('UPI or bank details'),
  govIdUrl: z.string().trim().url('Government ID URL must be valid.'),
  studentIdUrl: z.string().trim().url().or(z.literal('')).optional().default(''),
});

export const registerSchema = z.object({
  name: nonEmptyString('Name'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.')
    .max(100, 'Password must be less than 100 characters.'),
  profilePictureUrl: optionalUrlString('Profile picture URL'),
  desiredRole: z.string().optional(),
  sellerApplication: supplierApplicationSchema.optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: nonEmptyString('Password'),
});

export const refreshTokenSchema = z.object({
  refreshToken: nonEmptyString('Refresh token'),
});

export const supplierProductCreateSchema = z.object({
  title: nonEmptyString('Title'),
  description: nonEmptyString('Description'),
  category: nonEmptyString('Category'),
  quotedPrice: z.coerce.number().min(0, 'Quoted price must be at least 0.'),
  imageUrl: optionalUrlString('Image URL'),
  condition: z.enum(PRODUCT_CONDITIONS, {
    errorMap: () => ({ message: 'Condition must be new, like-new, good, or fair.' }),
  }),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(5),
});

export const supplierProductUpdateSchema = z.object({
  title: nonEmptyString('Title'),
  description: nonEmptyString('Description'),
  category: nonEmptyString('Category'),
  imageUrl: optionalUrlString('Image URL'),
  condition: z.enum(PRODUCT_CONDITIONS, {
    errorMap: () => ({ message: 'Condition must be new, like-new, good, or fair.' }),
  }),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(5),
});

export const adminApproveProductSchema = z.object({
  sellingPrice: z.coerce.number().min(0, 'Selling price must be at least 0.'),
  discountPercent: z.coerce.number().min(0).max(90).optional().default(0),
  discountActive: z.boolean().optional().default(false),
  availableStock: z.coerce.number().int().min(0, 'Available stock must be 0 or more.'),
  isFeatured: z.boolean().optional().default(false),
  isFlashSale: z.boolean().optional().default(false),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(5),
});

export const adminRejectProductSchema = z.object({
  rejectionReason: nonEmptyString('Rejection reason'),
});

export const adminProductPricingSchema = z.object({
  sellingPrice: z.coerce.number().min(0).optional(),
  discountPercent: z.coerce.number().min(0).max(90).optional(),
  discountActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isFlashSale: z.boolean().optional(),
});

export const adminDirectProductSchema = z.object({
  title: nonEmptyString('Title'),
  description: nonEmptyString('Description'),
  category: nonEmptyString('Category'),
  imageUrl: optionalUrlString('Image URL'),
  condition: z.enum(PRODUCT_CONDITIONS, {
    errorMap: () => ({ message: 'Condition must be new, like-new, good, or fair.' }),
  }),
  quotedPrice: z.coerce.number().min(0).optional().default(0),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be at least 0.'),
  discountPercent: z.coerce.number().min(0).max(90).optional().default(0),
  discountActive: z.boolean().optional().default(false),
  availableStock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(5),
  isFeatured: z.boolean().optional().default(false),
  isFlashSale: z.boolean().optional().default(false),
});

export const adminProductStockSchema = z.object({
  availableStock: z.coerce.number().int().min(0, 'Available stock must be 0 or more.'),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
});

export const serviceSchema = z.object({
  title: nonEmptyString('Title'),
  description: nonEmptyString('Description'),
  category: nonEmptyString('Category'),
  price: z.coerce.number().min(0, 'Price must be at least 0.'),
  imageUrl: optionalUrlString('Image URL'),
  availability: z.string().trim().optional().default(''),
  duration: z.string().trim().optional().default(''),
  isFeatured: z.boolean().optional().default(false),
});

export const cartAddSchema = z.object({
  productId: nonEmptyString('Product ID'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.'),
});

export const cartItemUpdateSchema = z.object({
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.'),
});

export const couponApplySchema = z.object({
  code: nonEmptyString('Coupon code'),
});

export const orderCreateSchema = z.object({
  deliveryAddress: nonEmptyString('Delivery address'),
  paymentMethod: z.enum(['upi', 'card', 'cod']).optional().default('card'),
  paymentProvider: z.enum(['manual', 'cod', 'razorpay']).optional().default('manual'),
  paymentReference: z.string().trim().optional().default(''),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).optional().default('paid'),
  couponCode: z.string().trim().optional().default(''),
  gatewayOrderId: z.string().trim().optional().default(''),
});

export const orderCheckoutSchema = z.object({
  deliveryAddress: nonEmptyString('Delivery address'),
  preferredMethod: z.enum(['upi', 'card']).optional().default('upi'),
  couponCode: z.string().trim().optional().default(''),
});

export const orderPaymentVerificationSchema = z.object({
  sessionId: nonEmptyString('Checkout session ID'),
  razorpayOrderId: nonEmptyString('Razorpay order ID'),
  razorpayPaymentId: nonEmptyString('Razorpay payment ID'),
  razorpaySignature: nonEmptyString('Razorpay signature'),
});

export const orderStatusSchema = z.object({
  orderStatus: z.enum(ORDER_STATUS, {
    errorMap: () => ({ message: 'Invalid order status.' }),
  }),
});

export const bookingCreateSchema = z.object({
  serviceId: nonEmptyString('Service ID'),
  scheduledDate: z.string().datetime('Scheduled date must be a valid ISO date-time.'),
  duration: nonEmptyString('Duration'),
  couponCode: z.string().trim().optional().default(''),
});

export const bookingPaymentVerificationSchema = z.object({
  bookingId: nonEmptyString('Booking ID'),
  razorpayOrderId: nonEmptyString('Razorpay order ID'),
  razorpayPaymentId: nonEmptyString('Razorpay payment ID'),
  razorpaySignature: nonEmptyString('Razorpay signature'),
});

export const bookingStatusSchema = z.object({
  bookingStatus: z.enum(BOOKING_STATUS, {
    errorMap: () => ({ message: 'Invalid booking status.' }),
  }),
});

export const bookingMessageSchema = z.object({
  message: nonEmptyString('Message'),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: nonEmptyString('Comment'),
});

export const supplierPaymentRequestSchema = z.object({
  note: z.string().trim().optional().default(''),
});

export const supplierPaymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0.'),
  method: nonEmptyString('Method'),
  reference: nonEmptyString('Reference'),
  notes: z.string().trim().optional().default(''),
});

export const couponSchema = z.object({
  code: nonEmptyString('Coupon code'),
  description: z.string().trim().optional().default(''),
  type: z.enum(COUPON_TYPES),
  value: z.coerce.number().positive('Coupon value must be greater than 0.'),
  maxDiscount: z.coerce.number().min(0).optional().default(0),
  minOrderValue: z.coerce.number().min(0).optional().default(0),
  usageLimit: z.coerce.number().int().min(0).optional().default(0),
  perUserLimit: z.coerce.number().int().min(0).optional().default(0),
  startsAt: z.string().datetime().nullable().optional().default(null),
  endsAt: z.string().datetime().nullable().optional().default(null),
  isActive: z.boolean().optional().default(true),
});

export const ticketSchema = z.object({
  subject: nonEmptyString('Subject'),
  description: nonEmptyString('Description'),
});

export const adminTicketUpdateSchema = z.object({
  status: z.enum(TICKET_STATUS).optional().default('resolved'),
  adminNote: z.string().trim().optional().default(''),
});

export const userStatusToggleSchema = z.object({
  isActive: z.boolean(),
});

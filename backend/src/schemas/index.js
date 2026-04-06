import { z } from 'zod';
import {
  BOOKING_STATUS,
  ORDER_STATUS,
  PRODUCT_CONDITIONS,
  TARGET_TYPES,
  TICKET_STATUS,
} from '../constants/enums.js';

const nonEmptyString = (label) => z.string().trim().min(1, `${label} is required.`);
const urlString = (label) =>
  z
    .string()
    .trim()
    .url(`${label} must be a valid URL.`)
    .or(z.literal(''));

const couponInputSchema = z
  .object({
    code: z.string().trim().optional().default(''),
    type: z.enum(['percent', 'flat']).optional(),
    value: z.coerce.number().optional(),
    minOrderAmount: z.coerce.number().min(0).optional().default(0),
    description: z.string().trim().optional().default(''),
  })
  .superRefine((value, ctx) => {
    const hasAnyCouponValue = Boolean(value.code || value.type || value.value);

    if (!hasAnyCouponValue) {
      return;
    }

    if (!value.code) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Coupon code is required.' });
    }

    if (!value.type) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Coupon type is required.' });
    }

    if (!value.value || value.value <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Coupon value must be greater than 0.' });
    }
  });

export const sellerApplySchema = z.object({
  fullName: nonEmptyString('Full name'),
  studentId: nonEmptyString('Student ID number'),
  collegeName: nonEmptyString('College name'),
  department: nonEmptyString('Department'),
  contactNumber: nonEmptyString('Contact number'),
  upiOrBankDetails: nonEmptyString('UPI or bank details'),
  govIdUrl: z.string().trim().url('Government ID URL must be valid.'),
  studentIdUrl: z.string().trim().url('Student ID URL must be valid.'),
});

export const registerSchema = z.object({
  name: nonEmptyString('Name'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.')
    .max(100, 'Password must be less than 100 characters.'),
  profilePictureUrl: urlString('Profile picture URL').optional().default(''),
  desiredRole: z.enum(['buyer', 'seller']).optional().default('buyer'),
  sellerApplication: sellerApplySchema.optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: nonEmptyString('Password'),
});

export const refreshTokenSchema = z.object({
  refreshToken: nonEmptyString('Refresh token'),
});

export const productSchema = z.object({
  title: nonEmptyString('Title'),
  description: nonEmptyString('Description'),
  category: nonEmptyString('Category'),
  price: z.coerce.number().min(0, 'Price must be at least 0.'),
  imageUrl: urlString('Image URL').default(''),
  condition: z.enum(PRODUCT_CONDITIONS, {
    errorMap: () => ({ message: 'Condition must be new, like-new, good, or fair.' }),
  }),
  stock: z.coerce.number().int().min(0, 'Stock must be 0 or more.'),
  coupon: couponInputSchema.optional().default({}),
});

export const serviceSchema = z.object({
  title: nonEmptyString('Title'),
  description: nonEmptyString('Description'),
  category: nonEmptyString('Category'),
  price: z.coerce.number().min(0, 'Price must be at least 0.'),
  imageUrl: urlString('Image URL').default(''),
  availability: nonEmptyString('Availability'),
  coupon: couponInputSchema.optional().default({}),
});

export const cartAddSchema = z.object({
  productId: nonEmptyString('Product ID'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.'),
});

export const cartUpdateSchema = z.object({
  productId: nonEmptyString('Product ID'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.'),
});

export const orderCreateSchema = z.object({
  deliveryAddress: nonEmptyString('Delivery address'),
  paymentMethod: z.enum(['upi', 'card', 'cod']).optional().default('card'),
  paymentProvider: z.enum(['manual', 'cod', 'razorpay']).optional().default('manual'),
  paymentReference: z.string().trim().optional().default(''),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).optional().default('paid'),
  couponCode: z.string().trim().optional().default(''),
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

export const bookingStatusSchema = z.object({
  bookingStatus: z.enum(BOOKING_STATUS, {
    errorMap: () => ({ message: 'Invalid booking status.' }),
  }),
});

export const bookingPaymentSessionSchema = z.object({
  preferredMethod: z.enum(['card']).optional().default('card'),
});

export const bookingPaymentVerificationSchema = z.object({
  razorpayOrderId: nonEmptyString('Razorpay order ID'),
  razorpayPaymentId: nonEmptyString('Razorpay payment ID'),
  razorpaySignature: nonEmptyString('Razorpay signature'),
});

export const bookingUpiPaymentSchema = z.object({
  upiId: nonEmptyString('UPI ID'),
});

export const bookingMessageSchema = z.object({
  message: nonEmptyString('Message'),
});

export const reviewSchema = z.object({
  targetId: nonEmptyString('Target ID'),
  targetType: z.enum(TARGET_TYPES, {
    errorMap: () => ({ message: 'Target type must be product, service, or seller.' }),
  }),
  rating: z.coerce.number().int().min(1).max(5),
  comment: nonEmptyString('Comment'),
});

export const ticketSchema = z.object({
  subject: nonEmptyString('Subject'),
  description: nonEmptyString('Description'),
});

export const sellerRejectionSchema = z.object({
  rejectionReason: z.string().trim().default(''),
});

export const adminTicketUpdateSchema = z.object({
  status: z.enum(TICKET_STATUS).optional().default('resolved'),
  adminNote: z.string().trim().optional().default(''),
});

export const userStatusToggleSchema = z.object({
  isActive: z.boolean(),
});

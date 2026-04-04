export const ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
};

export const SELLER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const LISTING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REMOVED: 'removed',
};

export const PRODUCT_CONDITIONS = ['new', 'like-new', 'good', 'fair'];

export const ORDER_STATUS = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];
export const BOOKING_STATUS = ['pending', 'confirmed', 'completed', 'cancelled'];
export const PAYMENT_STATUS = ['pending', 'paid', 'failed'];
export const TARGET_TYPES = ['product', 'service', 'seller'];
export const TICKET_STATUS = ['open', 'in-progress', 'resolved', 'closed'];
export const REPORT_TYPES = {
  SELLER: ['sales', 'orders', 'customers'],
  ADMIN: ['orders', 'users', 'sellers', 'revenue', 'product-performance'],
};

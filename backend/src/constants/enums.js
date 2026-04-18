export const ROLES = {
  BUYER: 'buyer',
  SUPPLIER: 'supplier',
  ADMIN: 'admin',
};

export const SUPPLIER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const PRODUCT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DELISTED: 'delisted',
};

export const PRODUCT_CONDITIONS = ['new', 'like-new', 'good', 'fair'];

export const ORDER_STATUS = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];
export const BOOKING_STATUS = ['pending', 'confirmed', 'completed', 'cancelled'];
export const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'refunded'];
export const TARGET_TYPES = ['product', 'service'];
export const TICKET_STATUS = ['open', 'in-progress', 'resolved', 'closed'];

export const LEDGER_ENTRY_TYPES = ['credit', 'debit'];
export const LEDGER_ENTRY_STATUS = ['pending', 'paid', 'reversed'];
export const COUPON_TYPES = ['percent', 'flat'];

export const LISTING_SOURCE = {
  SUPPLIER: 'supplier',
  ADMIN: 'admin',
};

export const SERVICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const REPORT_TYPES = {
  SUPPLIER: ['products', 'ledger'],
  ADMIN: ['products', 'orders', 'bookings', 'suppliers', 'revenue'],
};

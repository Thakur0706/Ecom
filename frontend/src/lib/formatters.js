export const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/e2e8f0/475569?text=CampusConnect';

const ORDER_STATUS_LABELS = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const PAYMENT_METHOD_LABELS = {
  upi: 'UPI',
  card: 'Card',
  cod: 'Cash on Delivery',
};

const BOOKING_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function sentenceCase(value = '') {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatCoupon(coupon) {
  if (!coupon?.code) {
    return null;
  }

  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrderAmount: coupon.minOrderAmount || 0,
    description: coupon.description || '',
  };
}

export function imageWithFallback(url) {
  return url || PLACEHOLDER_IMAGE;
}

export function formatProduct(product) {
  if (!product) {
    return null;
  }

  return {
    id: product._id,
    title: product.title,
    description: product.description,
    category: product.category,
    price: product.price,
    image: imageWithFallback(product.imageUrl),
    imageUrl: imageWithFallback(product.imageUrl),
    condition: sentenceCase(product.condition),
    seller: product.supplier?.name || 'Campus Seller',
    sellerId: product.supplier?.id || product.supplier?._id || product.supplier,
    sellerProfilePictureUrl: product.supplier?.profilePictureUrl || '',
    rating: product.averageRating || 0,
    coupon: formatCoupon(product.coupon),
    stock: product.stock,
    isActive: product.isActive,
    status: product.status,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function formatService(service) {
  if (!service) {
    return null;
  }

  return {
    id: service._id,
    title: service.title,
    description: service.description,
    category: service.category,
    price: service.price,
    image: imageWithFallback(service.imageUrl),
    imageUrl: imageWithFallback(service.imageUrl),
    provider: service.supplier?.name || 'Campus Seller',
    sellerId: service.supplier?.id || service.supplier?._id || service.supplier,
    availability: service.availability,
    rating: service.averageRating || 0,
    coupon: formatCoupon(service.coupon),
    isActive: service.isActive,
    status: service.status,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

function buildTimelineEntry(entry) {
  const label = ORDER_STATUS_LABELS[entry.status] || sentenceCase(entry.status);

  return {
    status: label,
    timestamp: entry.timestamp,
    description: `${label} update recorded.`,
  };
}

export function formatOrder(order) {
  if (!order) {
    return null;
  }

  const items = order.items || [];
  const primaryItem = items[0] || {};
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Resiliently extract IDs (handle raw Mongoose and serialized JSON)
  const orderId = order.id || order._id;
  const buyerData = order.buyerId || order.buyer || {};
  const buyerId = buyerData.id || buyerData._id || (typeof buyerData === 'string' ? buyerData : null);
  const supplierData = order.supplierId || order.supplier || {};
  const supplierId = supplierData.id || supplierData._id || (typeof supplierData === 'string' ? supplierData : null);

  const paymentMethod = order.paymentMethod || 'card';
  const paymentProvider = order.paymentProvider || 'manual';
  const paymentMethodLabel = PAYMENT_METHOD_LABELS[paymentMethod] || sentenceCase(paymentMethod);
  const paymentProviderLabel = paymentProvider === 'razorpay' ? 'Razorpay' : sentenceCase(paymentProvider);
  const paymentDisplayLabel =
    paymentMethod === 'cod'
      ? PAYMENT_METHOD_LABELS.cod
      : paymentProvider === 'razorpay'
        ? `${paymentMethodLabel} via ${paymentProviderLabel}`
        : paymentMethodLabel;

  return {
    id: orderId,
    buyerId: buyerId,
    buyerName: buyerData.name || 'Buyer',
    buyerEmail: buyerData.email || '',
    supplierId: supplierId,
    supplierName: supplierData.name || 'Supplier',
    supplierEmail: supplierData.email || '',
    product: {
      id: primaryItem.productId?.id || primaryItem.productId?._id || primaryItem.productId,
      title: items.length > 1 ? `${primaryItem.title} + ${items.length - 1} more` : primaryItem.title,
      category: primaryItem.category || 'General',
      image: imageWithFallback(primaryItem.imageUrl),
      condition: 'As listed',
    },
    items: items.map((item) => ({
      ...item,
      imageUrl: imageWithFallback(item.imageUrl),
    })),
    quantity: totalQuantity,
    unitPrice: totalQuantity ? Math.round(order.totalAmount / totalQuantity) : primaryItem.price || 0,
    totalAmount: order.totalAmount,
    originalAmount: order.originalAmount || order.totalAmount,
    discountAmount: order.discountAmount || 0,
    couponCode: order.couponCode || '',
    platformFee: 0,
    paymentStatus: sentenceCase(order.paymentStatus),
    paymentMethod: paymentDisplayLabel,
    paymentProvider: paymentProviderLabel,
    paymentReference: order.paymentReference || order.transactionId,
    gatewayOrderId: order.gatewayOrderId || '',
    orderStatus: ORDER_STATUS_LABELS[order.orderStatus] || sentenceCase(order.orderStatus),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    deliveryAddress: order.deliveryAddress,
    timeline: (order.statusTimeline || []).map(buildTimelineEntry),
    notes: '',
    transactionId: order.transactionId,
  };
}

export function formatBooking(booking) {
  if (!booking) {
    return null;
  }

  const buyerValue = booking.buyer || booking.buyerId || {};
  const sellerValue = booking.seller || booking.sellerId || {};
  const serviceValue = booking.service || booking.serviceId || {};

  return {
    id: booking._id || booking.id,
    buyerId: buyerValue._id || buyerValue.id || buyerValue,
    buyerName: buyerValue.name || '',
    supplierId: sellerValue?._id || sellerValue?.id || sellerValue,
    supplierName: sellerValue?.name || 'Campus Admin',
    serviceId: serviceValue?._id || serviceValue?.id || serviceValue,
    serviceTitle: serviceValue.title || booking.serviceTitle || 'Service booking',
    totalAmount: booking.totalAmount,
    originalAmount: booking.originalAmount || booking.totalAmount,
    discountAmount: booking.discountAmount || 0,
    couponCode: booking.couponCode || '',
    paymentStatus: sentenceCase(booking.paymentStatus),
    paymentMethod: PAYMENT_METHOD_LABELS[booking.paymentMethod] || sentenceCase(booking.paymentMethod || ''),
    paymentReference: booking.paymentReference || booking.transactionId,
    gatewayOrderId: booking.gatewayOrderId || '',
    bookingStatus: BOOKING_STATUS_LABELS[booking.bookingStatus] || sentenceCase(booking.bookingStatus),
    scheduledDate: booking.scheduledDate,
    duration: booking.duration,
    sellerConfirmedAt: booking.sellerConfirmedAt,
    paidAt: booking.paidAt,
    chatEnabled: booking.paymentStatus === 'paid' || booking.paymentStatus?.toLowerCase() === 'paid',
    createdAt: booking.createdAt,
    transactionId: booking.transactionId,
  };
}

export function formatReview(review) {
  if (!review) {
    return null;
  }

  return {
    id: review._id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    name: review.reviewerId?.name || 'Student',
    reviewer: review.reviewerId,
  };
}

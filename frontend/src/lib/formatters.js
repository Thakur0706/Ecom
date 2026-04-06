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
    seller: product.sellerId?.name || 'Campus Seller',
    sellerId: product.sellerId?._id || product.sellerId,
    sellerProfilePictureUrl: product.sellerId?.profilePictureUrl || '',
    rating: product.averageRating || 0,
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
    provider: service.sellerId?.name || 'Campus Seller',
    sellerId: service.sellerId?._id || service.sellerId,
    availability: service.availability,
    rating: service.averageRating || 0,
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
  const paymentMethod = order.paymentMethod || 'card';
  const paymentProvider = order.paymentProvider || 'manual';
  const paymentMethodLabel = PAYMENT_METHOD_LABELS[paymentMethod] || sentenceCase(paymentMethod);
  const paymentProviderLabel = paymentProvider === 'razorpay' ? 'Razorpay' : sentenceCase(paymentProvider);
  const paymentDisplayLabel =
    paymentProvider === 'razorpay'
      ? `${paymentMethodLabel} via ${paymentProviderLabel}`
      : paymentProvider === 'simulation'
        ? `${paymentMethodLabel} (Simulated)`
        : paymentMethodLabel;

  return {
    id: order._id,
    buyerId: order.buyerId?._id || order.buyerId,
    buyerName: order.buyerId?.name || 'Buyer',
    buyerEmail: order.buyerId?.email || '',
    sellerId: order.sellerId?._id || order.sellerId,
    sellerName: order.sellerId?.name || 'Seller',
    sellerEmail: order.sellerId?.email || '',
    product: {
      id: primaryItem.productId,
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
    platformFee: 0,
    paymentStatus: sentenceCase(order.paymentStatus),
    paymentMethod: paymentDisplayLabel,
    paymentProvider: paymentProviderLabel,
    paymentReference: order.paymentReference || order.transactionId,
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

  return {
    id: booking._id,
    buyerId: booking.buyerId?._id || booking.buyerId,
    buyerName: booking.buyerId?.name || '',
    sellerId: booking.sellerId?._id || booking.sellerId,
    sellerName: booking.sellerId?.name || '',
    serviceId: booking.serviceId?._id || booking.serviceId,
    serviceTitle: booking.serviceId?.title || booking.serviceTitle || 'Service booking',
    totalAmount: booking.totalAmount,
    paymentStatus: sentenceCase(booking.paymentStatus),
    bookingStatus: BOOKING_STATUS_LABELS[booking.bookingStatus] || sentenceCase(booking.bookingStatus),
    scheduledDate: booking.scheduledDate,
    duration: booking.duration,
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

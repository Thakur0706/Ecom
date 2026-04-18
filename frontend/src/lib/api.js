import axios from 'axios';

export const ACCESS_TOKEN_KEY = 'campusconnect_access_token';
export const REFRESH_TOKEN_KEY = 'campusconnect_refresh_token';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const tokenListeners = new Set();

function notifyTokenListeners() {
  const tokens = {
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
  };

  tokenListeners.forEach((listener) => {
    listener(tokens);
  });
}

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || '';
}

export function getRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY) || '';
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  notifyTokenListeners();
}

export function clearTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  notifyTokenListeners();
}

export function subscribeToTokenChanges(listener) {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

const refreshClient = axios.create({ baseURL });

export const apiClient = axios.create({
  baseURL,
});

let refreshPromise = null;

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = getRefreshToken();

    if (
      error.response?.status === 401 &&
      refreshToken &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshClient
            .post('/auth/refresh-token', { refreshToken })
            .then((response) => {
              const tokens = response.data?.data?.tokens;

              if (tokens?.accessToken && tokens?.refreshToken) {
                setTokens(tokens);
                return tokens;
              }

              throw new Error('No tokens returned during refresh.');
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const tokens = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

function unwrap(response) {
  return response.data;
}

export const api = {
  auth: {
    register: (payload) => apiClient.post('/auth/register', payload).then(unwrap),
    login: (payload) => apiClient.post('/auth/login', payload).then(unwrap),
    logout: () => apiClient.post('/auth/logout').then(unwrap),
    me: () => apiClient.get('/auth/me').then(unwrap),
  },
  supplier: {
    apply: (payload) => apiClient.post('/supplier/apply', payload).then(unwrap),
    status: () => apiClient.get('/supplier/status').then(unwrap),
    products: (params = {}) => apiClient.get('/supplier/products', { params }).then(unwrap),
    product: (id) => apiClient.get(`/supplier/products/${id}`).then(unwrap),
    createProduct: (payload) => apiClient.post('/supplier/products', payload).then(unwrap),
    updateProduct: (id, payload) => apiClient.patch(`/supplier/products/${id}`, payload).then(unwrap),
    deleteProduct: (id) => apiClient.delete(`/supplier/products/${id}`).then(unwrap),
    orders: (params = {}) => apiClient.get('/supplier/orders', { params }).then(unwrap),
    updateOrderStatus: (id, payload) =>
      apiClient.patch(`/supplier/orders/${id}/status`, payload).then(unwrap),
    ledger: (params = {}) => apiClient.get('/supplier/ledger', { params }).then(unwrap),
    ledgerSummary: () => apiClient.get('/supplier/ledger/summary').then(unwrap),
    requestPayment: (payload = {}) =>
      apiClient.post('/supplier/ledger/payment-request', payload).then(unwrap),
    acknowledge: (id) =>
      apiClient.post(`/supplier/orders/${id}/acknowledge`).then(unwrap),
  },
  products: {
    list: (params = {}) => apiClient.get('/products', { params }).then(unwrap),
    get: (id) => apiClient.get(`/products/${id}`).then(unwrap),
    reviews: (id, params = {}) => apiClient.get(`/products/${id}/reviews`, { params }).then(unwrap),
    createReview: (id, payload) => apiClient.post(`/products/${id}/reviews`, payload).then(unwrap),
  },
  services: {
    list: (params = {}) => apiClient.get('/services', { params }).then(unwrap),
    get: (id) => apiClient.get(`/services/${id}`).then(unwrap),
    reviews: (id, params = {}) => apiClient.get(`/services/${id}/reviews`, { params }).then(unwrap),
    createReview: (id, payload) => apiClient.post(`/services/${id}/reviews`, payload).then(unwrap),
  },
  cart: {
    get: () => apiClient.get('/cart').then(unwrap),
    add: (payload) => apiClient.post('/cart/add', payload).then(unwrap),
    update: (itemId, payload) => apiClient.patch(`/cart/${itemId}`, payload).then(unwrap),
    remove: (itemId) => apiClient.delete(`/cart/${itemId}`).then(unwrap),
    clear: () => apiClient.delete('/cart/clear').then(unwrap),
    applyCoupon: (payload) => apiClient.post('/cart/apply-coupon', payload).then(unwrap),
    removeCoupon: () => apiClient.delete('/cart/remove-coupon').then(unwrap),
  },
  orders: {
    create: (payload) => apiClient.post('/orders', payload).then(unwrap),
    list: (params = {}) => apiClient.get('/orders', { params }).then(unwrap),
    get: (id) => apiClient.get(`/orders/${id}`).then(unwrap),
    cancel: (id) => apiClient.post(`/orders/${id}/cancel`).then(unwrap),
    createCheckoutSession: (payload) =>
      apiClient.post('/orders/checkout-session', payload).then(unwrap),
    verifyPayment: (payload) => apiClient.post('/orders/verify-payment', payload).then(unwrap),
    messages: (id) => apiClient.get(`/orders/${id}/messages`).then(unwrap),
    sendMessage: (id, payload) => apiClient.post(`/orders/${id}/messages`, payload).then(unwrap),
    closeChat: (id) => apiClient.patch(`/admin/orders/${id}/close-chat`).then(unwrap),
  },
  bookings: {
    create: (payload) => apiClient.post('/bookings', payload).then(unwrap),
    list: (params = {}) => apiClient.get('/bookings', { params }).then(unwrap),
    get: (id) => apiClient.get(`/bookings/${id}`).then(unwrap),
    cancel: (id) => apiClient.post(`/bookings/${id}/cancel`).then(unwrap),
    createCheckoutSession: (id) =>
      apiClient.post(`/bookings/${id}/checkout-session`).then(unwrap),
    // payload = { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
    verifyPayment: (payload) => apiClient.post('/bookings/verify-payment', payload).then(unwrap),
    payUpi: (id, payload) => apiClient.post(`/bookings/${id}/upi-payment`, payload).then(unwrap),
    messages: (id) => apiClient.get(`/bookings/${id}/messages`).then(unwrap),
    sendMessage: (id, payload) => apiClient.post(`/bookings/${id}/messages`, payload).then(unwrap),
  },
  coupons: {
    validate: (params) => apiClient.get('/coupons/validate', { params }).then(unwrap),
  },
  reviews: {
    // Creates a product or service review via the item-specific endpoints
    create: ({ targetId, targetType, rating, comment }) => {
      const path = targetType === 'service'
        ? `/services/${targetId}/reviews`
        : `/products/${targetId}/reviews`;
      return apiClient.post(path, { rating, comment }).then(unwrap);
    },
    product: (productId, params = {}) =>
      apiClient.get(`/products/${productId}/reviews`, { params }).then(unwrap),
    service: (serviceId, params = {}) =>
      apiClient.get(`/services/${serviceId}/reviews`, { params }).then(unwrap),
    me: (params = {}) => apiClient.get('/reviews/me', { params }).then(unwrap),
  },

  support: {
    createTicket: (payload) => apiClient.post('/support/tickets', payload).then(unwrap),
    listTickets: (params = {}) => apiClient.get('/support/tickets', { params }).then(unwrap),
  },
  admin: {
    dashboardOverview: () => apiClient.get('/admin/dashboard/overview').then(unwrap),
    revenueChart: () => apiClient.get('/admin/dashboard/revenue-chart').then(unwrap),
    topProducts: () => apiClient.get('/admin/dashboard/top-products').then(unwrap),
    analytics: () => apiClient.get('/admin/dashboard/analytics').then(unwrap),
    users: (params = {}) => apiClient.get('/admin/users', { params }).then(unwrap),
    toggleUser: (id, payload) => apiClient.patch(`/admin/users/${id}/toggle-status`, payload).then(unwrap),
    pendingProducts: (params = {}) =>
      apiClient.get('/admin/products/pending', { params }).then(unwrap),
    products: (params = {}) => apiClient.get('/admin/products', { params }).then(unwrap),
    product: (id) => apiClient.get(`/admin/products/${id}`).then(unwrap),
    approveProduct: (id, payload) =>
      apiClient.post(`/admin/products/approve/${id}`, payload).then(unwrap),
    rejectProduct: (id, payload) =>
      apiClient.post(`/admin/products/reject/${id}`, payload).then(unwrap),
    updateProductPricing: (id, payload) =>
      apiClient.patch(`/admin/products/${id}/pricing`, payload).then(unwrap),
    delistProduct: (id) => apiClient.patch(`/admin/products/${id}/delist`).then(unwrap),
    relistProduct: (id) => apiClient.patch(`/admin/products/${id}/relist`).then(unwrap),
    createDirectProduct: (payload) => apiClient.post('/admin/products/direct', payload).then(unwrap),
    updateProductStock: (id, payload) =>
      apiClient.patch(`/admin/products/${id}/stock`, payload).then(unwrap),
    services: (params = {}) => apiClient.get('/admin/services', { params }).then(unwrap),
    createService: (payload) => apiClient.post('/admin/services', payload).then(unwrap),
    updateService: (id, payload) => apiClient.patch(`/admin/services/${id}`, payload).then(unwrap),
    deleteService: (id) => apiClient.delete(`/admin/services/${id}`).then(unwrap),
    orders: (params = {}) => apiClient.get('/admin/orders', { params }).then(unwrap),
    order: (id) => apiClient.get(`/admin/orders/${id}`).then(unwrap),
    updateOrderStatus: (id, payload) =>
      apiClient.patch(`/admin/orders/${id}/status`, payload).then(unwrap),
    bookings: (params = {}) => apiClient.get('/admin/bookings', { params }).then(unwrap),
    booking: (id) => apiClient.get(`/admin/bookings/${id}`).then(unwrap),
    updateBookingStatus: (id, payload) =>
      apiClient.patch(`/admin/bookings/${id}/status`, payload).then(unwrap),
    suppliers: () => apiClient.get('/admin/suppliers').then(unwrap),
    supplier: (id) => apiClient.get(`/admin/suppliers/${id}`).then(unwrap),
    supplierLedger: (id) => apiClient.get(`/admin/suppliers/${id}/ledger`).then(unwrap),
    createSupplierPayment: (id, payload) =>
      apiClient.post(`/admin/suppliers/${id}/payment`, payload).then(unwrap),
    supplierPaymentRequests: () => apiClient.get('/admin/suppliers/payment-requests').then(unwrap),
    supplierApplications: () => apiClient.get('/admin/supplier-applications').then(unwrap),
    approveSupplierApplication: (id) =>
      apiClient.patch(`/admin/supplier-applications/${id}/approve`).then(unwrap),
    rejectSupplierApplication: (id, payload) =>
      apiClient.patch(`/admin/supplier-applications/${id}/reject`, payload).then(unwrap),
    coupons: (params = {}) => apiClient.get('/admin/coupons', { params }).then(unwrap),
    createCoupon: (payload) => apiClient.post('/admin/coupons', payload).then(unwrap),
    updateCoupon: (id, payload) => apiClient.patch(`/admin/coupons/${id}`, payload).then(unwrap),
    deleteCoupon: (id) => apiClient.delete(`/admin/coupons/${id}`).then(unwrap),
    couponStats: (id) => apiClient.get(`/admin/coupons/${id}/stats`).then(unwrap),
    supportTickets: (params = {}) => apiClient.get('/admin/support/tickets', { params }).then(unwrap),
    updateSupportTicket: (id, payload) =>
      apiClient.patch(`/admin/support/tickets/${id}`, payload).then(unwrap),
  },
};

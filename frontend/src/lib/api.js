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
  return () => {
    tokenListeners.delete(listener);
  };
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
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh-token')
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
    adminLogin: (payload) => apiClient.post('/auth/admin/login', payload).then(unwrap),
    logout: () => apiClient.post('/auth/logout').then(unwrap),
    me: () => apiClient.get('/auth/me').then(unwrap),
  },
  seller: {
    apply: (payload) => apiClient.post('/seller/apply', payload).then(unwrap),
    status: () => apiClient.get('/seller/status').then(unwrap),
    overview: () => apiClient.get('/seller/dashboard/overview').then(unwrap),
    inventory: () => apiClient.get('/seller/erp/inventory?limit=100').then(unwrap),
    revenueChart: () => apiClient.get('/seller/erp/revenue-chart').then(unwrap),
    orderMetrics: () => apiClient.get('/seller/erp/order-metrics').then(unwrap),
    customers: () => apiClient.get('/seller/crm/customers').then(unwrap),
    customerDetail: (id) => apiClient.get(`/seller/crm/customers/${id}`).then(unwrap),
    revenueTrend: () => apiClient.get('/seller/analytics/revenue-trend').then(unwrap),
    categorySales: () => apiClient.get('/seller/analytics/category-sales').then(unwrap),
    topProducts: () => apiClient.get('/seller/analytics/top-products').then(unwrap),
    downloadReport: (params) =>
      apiClient
        .get('/seller/reports/generate', {
          params,
          responseType: 'blob',
        })
        .then((response) => response.data),
  },
  products: {
    list: (params = {}) => apiClient.get('/products', { params }).then(unwrap),
    mine: (params = {}) => apiClient.get('/products/mine', { params }).then(unwrap),
    get: (id) => apiClient.get(`/products/${id}`).then(unwrap),
    create: (payload) => apiClient.post('/products', payload).then(unwrap),
    update: (id, payload) => apiClient.put(`/products/${id}`, payload).then(unwrap),
    remove: (id) => apiClient.delete(`/products/${id}`).then(unwrap),
    toggle: (id) => apiClient.patch(`/products/${id}/toggle`).then(unwrap),
  },
  services: {
    list: (params = {}) => apiClient.get('/services', { params }).then(unwrap),
    mine: (params = {}) => apiClient.get('/services/mine', { params }).then(unwrap),
    get: (id) => apiClient.get(`/services/${id}`).then(unwrap),
    create: (payload) => apiClient.post('/services', payload).then(unwrap),
    update: (id, payload) => apiClient.put(`/services/${id}`, payload).then(unwrap),
    remove: (id) => apiClient.delete(`/services/${id}`).then(unwrap),
    toggle: (id) => apiClient.patch(`/services/${id}/toggle`).then(unwrap),
  },
  cart: {
    get: () => apiClient.get('/cart').then(unwrap),
    add: (payload) => apiClient.post('/cart/add', payload).then(unwrap),
    update: (payload) => apiClient.put('/cart/update', payload).then(unwrap),
    remove: (productId) => apiClient.delete(`/cart/remove/${productId}`).then(unwrap),
    clear: () => apiClient.delete('/cart/clear').then(unwrap),
  },
  orders: {
    create: (payload) => apiClient.post('/orders', payload).then(unwrap),
    myPurchases: (params = {}) => apiClient.get('/orders/my-purchases', { params }).then(unwrap),
    mySales: (params = {}) => apiClient.get('/orders/my-sales', { params }).then(unwrap),
    get: (id) => apiClient.get(`/orders/${id}`).then(unwrap),
    updateStatus: (id, payload) => apiClient.patch(`/orders/${id}/status`, payload).then(unwrap),
    cancel: (id) => apiClient.patch(`/orders/${id}/cancel`).then(unwrap),
  },
  bookings: {
    create: (payload) => apiClient.post('/bookings', payload).then(unwrap),
    mine: (params = {}) => apiClient.get('/bookings/my-bookings', { params }).then(unwrap),
    sellerMine: (params = {}) => apiClient.get('/bookings/my-service-bookings', { params }).then(unwrap),
    updateStatus: (id, payload) => apiClient.patch(`/bookings/${id}/status`, payload).then(unwrap),
  },
  reviews: {
    create: (payload) => apiClient.post('/reviews', payload).then(unwrap),
    product: (productId, params = {}) =>
      apiClient.get(`/reviews/product/${productId}`, { params }).then(unwrap),
    service: (serviceId, params = {}) =>
      apiClient.get(`/reviews/service/${serviceId}`, { params }).then(unwrap),
    seller: (sellerId, params = {}) =>
      apiClient.get(`/reviews/seller/${sellerId}`, { params }).then(unwrap),
    mine: () => apiClient.get('/reviews/me').then(unwrap),
  },
  tickets: {
    create: (payload) => apiClient.post('/tickets', payload).then(unwrap),
    mine: (params = {}) => apiClient.get('/tickets/mine', { params }).then(unwrap),
  },
  admin: {
    overview: () => apiClient.get('/admin/dashboard/overview').then(unwrap),
    sellersPending: (params = {}) => apiClient.get('/admin/sellers/pending', { params }).then(unwrap),
    sellerDetail: (id) => apiClient.get(`/admin/sellers/${id}`).then(unwrap),
    approveSeller: (id) => apiClient.patch(`/admin/sellers/${id}/approve`).then(unwrap),
    rejectSeller: (id, payload) => apiClient.patch(`/admin/sellers/${id}/reject`, payload).then(unwrap),
    users: (params = {}) => apiClient.get('/admin/users', { params }).then(unwrap),
    toggleUser: (id, payload) => apiClient.patch(`/admin/users/${id}/toggle-status`, payload).then(unwrap),
    products: (params = {}) => apiClient.get('/admin/products', { params }).then(unwrap),
    approveProduct: (id) => apiClient.patch(`/admin/products/${id}/approve`).then(unwrap),
    removeProduct: (id) => apiClient.patch(`/admin/products/${id}/remove`).then(unwrap),
    services: (params = {}) => apiClient.get('/admin/services', { params }).then(unwrap),
    approveService: (id) => apiClient.patch(`/admin/services/${id}/approve`).then(unwrap),
    removeService: (id) => apiClient.patch(`/admin/services/${id}/remove`).then(unwrap),
    orders: (params = {}) => apiClient.get('/admin/orders', { params }).then(unwrap),
    erpOverview: () => apiClient.get('/admin/erp/overview').then(unwrap),
    erpRevenueChart: () => apiClient.get('/admin/erp/revenue-chart').then(unwrap),
    erpTickets: (params = {}) => apiClient.get('/admin/erp/tickets', { params }).then(unwrap),
    resolveTicket: (id, payload) =>
      apiClient.patch(`/admin/erp/tickets/${id}/resolve`, payload).then(unwrap),
    crmCustomers: () => apiClient.get('/admin/crm/customers').then(unwrap),
    crmActivity: () => apiClient.get('/admin/crm/activity-feed').then(unwrap),
    revenueTrend: () => apiClient.get('/admin/analytics/revenue-trend').then(unwrap),
    topSellers: () => apiClient.get('/admin/analytics/top-sellers').then(unwrap),
    topProducts: () => apiClient.get('/admin/analytics/top-products').then(unwrap),
    userGrowth: () => apiClient.get('/admin/analytics/user-growth').then(unwrap),
    downloadReport: (params) =>
      apiClient
        .get('/admin/reports/generate', {
          params,
          responseType: 'blob',
        })
        .then((response) => response.data),
  },
};

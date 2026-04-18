import { createContext, useContext, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from './AppContext';
import { api } from '../lib/api';
import { formatBooking, formatOrder, imageWithFallback } from '../lib/formatters';

const OrderContext = createContext(null);

const statusDescriptions = {
  Placed: 'Order placed successfully and awaiting confirmation.',
  Confirmed: 'Supplier confirmed the order and started preparing the item.',
  Shipped: 'Order has been shipped and is on the way to the buyer.',
  Delivered: 'Order marked as delivered successfully.',
  Cancelled: 'Order has been cancelled.',
};

const capitalizeCondition = (value = '') =>
  value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getInventoryStatus = (availableStock) => {
  if (availableStock === 0) {
    return 'Out of Stock';
  }

  if (availableStock <= 2) {
    return 'Low Stock';
  }

  return 'Active';
};

function buildOrders(purchasesResponse, salesResponse) {
  const purchases = purchasesResponse?.data?.orders || [];
  const sales = salesResponse?.data?.orders || [];
  const orderMap = new Map();

  [...purchases, ...sales].forEach((order) => {
    const key = order.id || order._id;
    if (key) {
      orderMap.set(key, formatOrder(order));
    }
  });

  return [...orderMap.values()].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function buildInventory(rawInventory = [], orders = []) {
  const safeInventory = Array.isArray(rawInventory) ? rawInventory : [];
  const soldCountMap = new Map();

  orders.forEach((order) => {
    if (order.orderStatus === 'Cancelled') {
      return;
    }
    (order.items || []).forEach((item) => {
      if (!item.productId) return;
      const current = soldCountMap.get(item.productId) || 0;
      soldCountMap.set(item.productId, current + item.quantity);
    });
  });

  return safeInventory.map((product) => {
    const availableStock = product.availableStock ?? product.stock ?? 0;
    const soldCount = soldCountMap.get(product._id?.toString()) || 0;

    return {
      id: product._id,
      supplierId: product.supplierId,
      productId: product._id,
      title: product.title,
      category: product.category,
      condition: capitalizeCondition(product.condition),
      totalStock: availableStock + soldCount,
      soldCount,
      availableStock,
      price: product.finalPrice || product.sellingPrice || product.quotedPrice || product.price || 0,
      image: imageWithFallback(product.imageUrl),
      listedAt: product.createdAt,
      lastUpdated: product.updatedAt,
      status: getInventoryStatus(availableStock),
      raw: product,
    };
  });
}

function buildBookings(buyerBookingsResponse, supplierBookingsResponse) {
  const bookings = buyerBookingsResponse?.data?.bookings || [];
  const supplierBookings = supplierBookingsResponse?.data?.bookings || [];

  return {
    buyerBookings: bookings.map(formatBooking),
    supplierBookings: supplierBookings.map(formatBooking),
  };
}

export function OrderProvider({ children }) {
  const { currentUser } = useAppContext();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const purchasesQuery = useQuery({
    queryKey: ['orders', 'purchases'],
    queryFn: () => api.orders.list({ limit: 100 }),
    enabled: Boolean(currentUser && currentUser.role !== 'admin'),
  });

  const salesQuery = useQuery({
    queryKey: ['orders', 'sales'],
    queryFn: () => api.supplier.orders({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'supplier' && currentUser?.supplierStatus === 'approved'),
    retry: false,
  });

  const supplierInventoryQuery = useQuery({
    queryKey: ['supplier', 'products'],
    queryFn: () => api.supplier.products({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'supplier' && currentUser?.supplierStatus === 'approved'),
    retry: false,
  });

  const buyerBookingsQuery = useQuery({
    queryKey: ['bookings', 'buyer'],
    queryFn: () => api.bookings.list({ limit: 100 }),
    enabled: Boolean(currentUser && currentUser.role !== 'admin'),
  });

  const supplierBookingsQuery = useQuery({
    queryKey: ['bookings', 'supplier'],
    queryFn: () => api.bookings.list({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'supplier' && currentUser?.supplierStatus === 'approved'),
    retry: false,
  });

  const orders = useMemo(
    () => buildOrders(purchasesQuery.data, salesQuery.data),
    [purchasesQuery.data, salesQuery.data],
  );

  const inventory = useMemo(
    () => buildInventory(supplierInventoryQuery.data?.data?.products || [], orders),
    [supplierInventoryQuery.data, orders],
  );

  const bookings = useMemo(
    () => buildBookings(buyerBookingsQuery.data, supplierBookingsQuery.data),
    [buyerBookingsQuery.data, supplierBookingsQuery.data],
  );

  const orderMutation = useMutation({
    mutationFn: ({ action, orderId, payload }) => {
      if (action === 'cancel') {
        return api.orders.cancel(orderId);
      }

      return api.orders.updateStatus(orderId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['supplier'] });
    },
  });

  const inventoryMutation = useMutation({
    mutationFn: async ({ action, itemId, payload }) => {
      if (action === 'add') {
        return api.supplier.createProduct(payload);
      }

      if (action === 'remove') {
        return api.supplier.deleteProduct(itemId);
      }

      return api.supplier.updateProduct(itemId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateOrderStatus = (orderId, nextStatus) =>
    orderMutation.mutateAsync({
      action: 'update',
      orderId,
      payload: { orderStatus: nextStatus.toLowerCase() },
    });

  const cancelOrder = (orderId) =>
    orderMutation.mutateAsync({
      action: 'cancel',
      orderId,
    });

  const addInventoryItem = (item) =>
    inventoryMutation.mutateAsync({
      action: 'add',
      payload: {
        title: item.title,
        category: item.category,
        description: item.description || `${item.title} added by supplier`,
        quotedPrice: Number(item.price),
        imageUrl: item.image || item.imageUrl || '',
        condition: (item.condition || 'New').toLowerCase(),
        availableStock: Number(item.totalStock || item.stock || 0),
      },
    });

  const updateInventoryStock = (itemId, newStock) => {
    const inventoryItem = inventory.find((item) => item.id === itemId);

    if (!inventoryItem) {
      return Promise.resolve();
    }

    return inventoryMutation.mutateAsync({
      action: 'update',
      itemId,
      payload: {
        title: inventoryItem.raw.title,
        description: inventoryItem.raw.description,
        category: inventoryItem.raw.category,
        quotedPrice: inventoryItem.raw.quotedPrice,
        imageUrl: inventoryItem.raw.imageUrl || '',
        condition: inventoryItem.raw.condition,
        availableStock: Number(newStock),
      },
    });
  };

  const removeInventoryItem = (itemId) =>
    inventoryMutation.mutateAsync({
      action: 'remove',
      itemId,
    });

  const getOrdersByStatus = (status) => {
    if (status === 'All') {
      return orders;
    }

    return orders.filter((order) => order.orderStatus === status);
  };

  const getInventoryAlerts = () =>
    inventory.filter((item) => item.status === 'Low Stock' || item.status === 'Out of Stock');

  const getLowStockCount = () => getInventoryAlerts().length;

  const getRevenueData = () => {
    const deliveredSales = orders.filter(
      (order) =>
        (order.supplierId === (currentUser?.id || currentUser?._id)) &&
        order.orderStatus === 'Delivered',
    );

    const days = [];
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(endDate);
      day.setDate(endDate.getDate() - offset);
      const dayKey = day.toISOString().slice(0, 10);
      const revenue = deliveredSales
        .filter((order) => order.updatedAt.slice(0, 10) === dayKey)
        .reduce((sum, order) => sum + order.totalAmount, 0);

      days.push({
        date: dayKey,
        label: day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        revenue,
      });
    }

    const totalRevenue = deliveredSales.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = deliveredSales.length > 0 ? totalRevenue / deliveredSales.length : 0;
    const bestDay = days.reduce(
      (best, day) => (day.revenue > best.revenue ? day : best),
      days[0] || { label: 'N/A', revenue: 0 },
    );

    return {
      days,
      totalRevenue,
      averageOrderValue,
      bestDay,
    };
  };

  const orderStats = {
    totalOrders: orders.length,
    placed: orders.filter((order) => order.orderStatus === 'Placed').length,
    confirmed: orders.filter((order) => order.orderStatus === 'Confirmed').length,
    shipped: orders.filter((order) => order.orderStatus === 'Shipped').length,
    delivered: orders.filter((order) => order.orderStatus === 'Delivered').length,
    cancelled: orders.filter((order) => order.orderStatus === 'Cancelled').length,
    totalRevenue: orders
      .filter((order) => order.orderStatus === 'Delivered' && order.supplierId === currentUser?.id)
      .reduce((sum, order) => sum + order.totalAmount, 0),
    pendingRevenue: orders
      .filter((order) => order.paymentStatus === 'Pending')
      .reduce((sum, order) => sum + order.totalAmount, 0),
    averageOrderValue:
      orders.filter((order) => order.orderStatus === 'Delivered').length > 0
        ? orders
            .filter((order) => order.orderStatus === 'Delivered')
            .reduce((sum, order) => sum + order.totalAmount, 0) /
          orders.filter((order) => order.orderStatus === 'Delivered').length
        : 0,
  };

  const value = useMemo(
    () => ({
      orders,
      inventory,
      bookings: Array.isArray(bookings.buyerBookings) ? bookings.buyerBookings : [],
      serviceBookings: Array.isArray(bookings.supplierBookings) ? bookings.supplierBookings : [],
      selectedOrder,
      setSelectedOrder,
      filterStatus,
      setFilterStatus,
      searchQuery,
      setSearchQuery,
      orderStats,
      updateOrderStatus,
      cancelOrder,
      updateInventoryStock,
      addInventoryItem,
      removeInventoryItem,
      getOrdersByStatus,
      getInventoryAlerts,
      getLowStockCount,
      getRevenueData,
      loading:
        purchasesQuery.isLoading ||
        salesQuery.isLoading ||
        supplierInventoryQuery.isLoading ||
        buyerBookingsQuery.isLoading ||
        supplierBookingsQuery.isLoading,
    }),
    [
      orders,
      inventory,
      bookings,
      selectedOrder,
      filterStatus,
      searchQuery,
      orderStats,
      purchasesQuery.isLoading,
      salesQuery.isLoading,
      supplierInventoryQuery.isLoading,
      buyerBookingsQuery.isLoading,
      supplierBookingsQuery.isLoading,
    ],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export const useOrderContext = () => useContext(OrderContext);

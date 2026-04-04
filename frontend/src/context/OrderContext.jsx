import { createContext, useContext, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from './AppContext';
import { api } from '../lib/api';
import { formatBooking, formatOrder, imageWithFallback } from '../lib/formatters';

const OrderContext = createContext(null);

const statusDescriptions = {
  Placed: 'Order placed successfully and awaiting seller confirmation.',
  Confirmed: 'Seller confirmed the order and started preparing the item.',
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
    orderMap.set(order._id, formatOrder(order));
  });

  return [...orderMap.values()].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function buildInventory(rawInventory = [], orders = []) {
  const soldCountMap = new Map();

  orders.forEach((order) => {
    if (order.orderStatus === 'Cancelled') {
      return;
    }

    order.items.forEach((item) => {
      const current = soldCountMap.get(item.productId) || 0;
      soldCountMap.set(item.productId, current + item.quantity);
    });
  });

  return rawInventory.map((product) => {
    const soldCount = soldCountMap.get(product._id) || 0;
    const availableStock = product.stock;

    return {
      id: product._id,
      sellerId: product.sellerId,
      productId: product._id,
      title: product.title,
      category: product.category,
      condition: capitalizeCondition(product.condition),
      totalStock: product.stock + soldCount,
      soldCount,
      availableStock,
      price: product.price,
      image: imageWithFallback(product.imageUrl),
      listedAt: product.createdAt,
      lastUpdated: product.updatedAt,
      status: getInventoryStatus(availableStock),
      raw: product,
    };
  });
}

function buildBookings(buyerBookingsResponse, sellerBookingsResponse) {
  const bookings = buyerBookingsResponse?.data?.bookings || [];
  const sellerBookings = sellerBookingsResponse?.data?.bookings || [];

  return {
    buyerBookings: bookings.map(formatBooking),
    sellerBookings: sellerBookings.map(formatBooking),
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
    queryFn: () => api.orders.myPurchases({ limit: 100 }),
    enabled: Boolean(currentUser && currentUser.role !== 'admin'),
  });

  const salesQuery = useQuery({
    queryKey: ['orders', 'sales'],
    queryFn: () => api.orders.mySales({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'seller' && currentUser?.sellerStatus === 'approved'),
    retry: false,
  });

  const sellerInventoryQuery = useQuery({
    queryKey: ['seller', 'inventory'],
    queryFn: api.seller.inventory,
    enabled: Boolean(currentUser?.role === 'seller' && currentUser?.sellerStatus === 'approved'),
    retry: false,
  });

  const buyerBookingsQuery = useQuery({
    queryKey: ['bookings', 'buyer'],
    queryFn: () => api.bookings.mine({ limit: 100 }),
    enabled: Boolean(currentUser && currentUser.role !== 'admin'),
  });

  const sellerBookingsQuery = useQuery({
    queryKey: ['bookings', 'seller'],
    queryFn: () => api.bookings.sellerMine({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'seller' && currentUser?.sellerStatus === 'approved'),
    retry: false,
  });

  const orders = useMemo(
    () => buildOrders(purchasesQuery.data, salesQuery.data),
    [purchasesQuery.data, salesQuery.data],
  );

  const inventory = useMemo(
    () => buildInventory(sellerInventoryQuery.data?.data?.inventory || [], orders),
    [sellerInventoryQuery.data, orders],
  );

  const bookings = useMemo(
    () => buildBookings(buyerBookingsQuery.data, sellerBookingsQuery.data),
    [buyerBookingsQuery.data, sellerBookingsQuery.data],
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
      queryClient.invalidateQueries({ queryKey: ['seller'] });
    },
  });

  const inventoryMutation = useMutation({
    mutationFn: async ({ action, itemId, payload }) => {
      if (action === 'add') {
        return api.products.create(payload);
      }

      if (action === 'remove') {
        return api.products.remove(itemId);
      }

      return api.products.update(itemId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'mine'] });
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
        description: item.description || `${item.title} added by seller`,
        price: Number(item.price),
        imageUrl: item.image || item.imageUrl || '',
        condition: (item.condition || 'New').toLowerCase(),
        stock: Number(item.totalStock || item.stock || 0),
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
        price: inventoryItem.raw.price,
        imageUrl: inventoryItem.raw.imageUrl || '',
        condition: inventoryItem.raw.condition,
        stock: Number(newStock),
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
        order.sellerId === currentUser?.id &&
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
      .filter((order) => order.orderStatus === 'Delivered' && order.sellerId === currentUser?.id)
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
      bookings: bookings.buyerBookings,
      serviceBookings: bookings.sellerBookings,
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
        sellerInventoryQuery.isLoading ||
        buyerBookingsQuery.isLoading ||
        sellerBookingsQuery.isLoading,
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
      sellerInventoryQuery.isLoading,
      buyerBookingsQuery.isLoading,
      sellerBookingsQuery.isLoading,
    ],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export const useOrderContext = () => useContext(OrderContext);

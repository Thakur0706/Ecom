import { createContext, useContext, useEffect, useState } from 'react';
import { getInventoryStatus, inventory as defaultInventory, orders as defaultOrders } from '../data/orderData';

const ORDER_STORAGE_KEY = 'cc_orders';
const INVENTORY_STORAGE_KEY = 'cc_inventory';

const OrderContext = createContext(null);

const readStorage = (key, fallback) => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallback;
  } catch (error) {
    return fallback;
  }
};

const formatTimestamp = () => new Date().toISOString();

const timelineDescriptions = {
  Placed: 'Order placed successfully and awaiting seller confirmation.',
  Confirmed: 'Seller confirmed the order and started preparing the item.',
  Shipped: 'Order has been shipped and is on the way to the buyer.',
  Delivered: 'Order marked as delivered successfully.',
  Cancelled: 'Order has been cancelled.',
};

const buildInventoryItem = (item) => {
  const totalStock = Math.max(Number(item.totalStock) || 0, 0);
  const soldCount = Math.max(Number(item.soldCount) || 0, 0);
  const availableStock = Math.max(totalStock - soldCount, 0);

  return {
    ...item,
    totalStock,
    soldCount,
    availableStock,
    status: getInventoryStatus(availableStock),
  };
};

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(() => readStorage(ORDER_STORAGE_KEY, defaultOrders));
  const [inventory, setInventory] = useState(() => readStorage(INVENTORY_STORAGE_KEY, defaultInventory));
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    if (!selectedOrder) {
      return;
    }

    const nextSelectedOrder = orders.find((order) => order.id === selectedOrder.id) || null;
    setSelectedOrder(nextSelectedOrder);
  }, [orders, selectedOrder]);

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((previousOrders) =>
      previousOrders.map((order) => {
        if (order.id !== orderId || order.orderStatus === newStatus) {
          return order;
        }

        return {
          ...order,
          orderStatus: newStatus,
          updatedAt: formatTimestamp(),
          timeline: [
            ...order.timeline,
            {
              status: newStatus,
              timestamp: formatTimestamp(),
              description: timelineDescriptions[newStatus],
            },
          ],
        };
      }),
    );
  };

  const cancelOrder = (orderId) => {
    setOrders((previousOrders) =>
      previousOrders.map((order) => {
        if (order.id !== orderId || order.orderStatus === 'Cancelled') {
          return order;
        }

        return {
          ...order,
          orderStatus: 'Cancelled',
          updatedAt: formatTimestamp(),
          timeline: [
            ...order.timeline,
            {
              status: 'Cancelled',
              timestamp: formatTimestamp(),
              description: timelineDescriptions.Cancelled,
            },
          ],
        };
      }),
    );
  };

  const updateInventoryStock = (itemId, newStock) => {
    setInventory((previousInventory) =>
      previousInventory.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return buildInventoryItem({
          ...item,
          totalStock: Number(newStock),
          lastUpdated: formatTimestamp(),
        });
      }),
    );
  };

  const addInventoryItem = (item) => {
    setInventory((previousInventory) => {
      const nextIdNumber =
        previousInventory.reduce((highest, currentItem) => {
          const numericId = Number(currentItem.id.replace('INV-', ''));
          return numericId > highest ? numericId : highest;
        }, 0) + 1;

      return [
        buildInventoryItem({
          id: `INV-${String(nextIdNumber).padStart(3, '0')}`,
          sellerId: item.sellerId || 'user_2',
          productId: `custom-${Date.now()}`,
          title: item.title,
          category: item.category,
          condition: item.condition,
          totalStock: Number(item.totalStock),
          soldCount: 0,
          price: Number(item.price),
          image: item.image || `https://picsum.photos/seed/${Date.now()}/100/100`,
          listedAt: formatTimestamp(),
          lastUpdated: formatTimestamp(),
        }),
        ...previousInventory,
      ];
    });
  };

  const removeInventoryItem = (itemId) => {
    setInventory((previousInventory) => previousInventory.filter((item) => item.id !== itemId));
  };

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
    const deliveredOnly = orders.filter((order) => order.orderStatus === 'Delivered');
    const latestDeliveredDate = deliveredOnly.length
      ? deliveredOnly.reduce((latest, order) => {
          const nextTime = new Date(order.updatedAt).getTime();
          return nextTime > latest ? nextTime : latest;
        }, 0)
      : new Date('2026-03-21T00:00:00+05:30').getTime();

    const endDate = new Date(latestDeliveredDate);
    endDate.setHours(0, 0, 0, 0);

    const dailyRevenue = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(endDate);
      day.setDate(endDate.getDate() - offset);
      const dayKey = day.toISOString().slice(0, 10);
      const revenue = deliveredOnly
        .filter((order) => order.updatedAt.slice(0, 10) === dayKey)
        .reduce((sum, order) => sum + order.totalAmount, 0);

      dailyRevenue.push({
        date: dayKey,
        label: day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        revenue,
      });
    }

    const totalRevenue = deliveredOnly.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = deliveredOnly.length > 0 ? totalRevenue / deliveredOnly.length : 0;
    const bestDay = dailyRevenue.reduce(
      (best, day) => (day.revenue > best.revenue ? day : best),
      dailyRevenue[0] || { label: 'N/A', revenue: 0 },
    );

    return {
      days: dailyRevenue,
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
      .filter((order) => order.orderStatus === 'Delivered')
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

  return (
    <OrderContext.Provider
      value={{
        orders,
        inventory,
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
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export const useOrderContext = () => useContext(OrderContext);

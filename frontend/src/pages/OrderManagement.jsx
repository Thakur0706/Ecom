import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import OrderCard from '../components/OrderCard';
import { useOrderContext } from '../context/OrderContext';
import { useAppContext } from '../context/AppContext';

const statusTabs = ['All', 'Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
const sortOptions = ['Newest First', 'Oldest First', 'Amount High-Low', 'Amount Low-High'];

const statCardStyles = [
  'from-blue-500 to-blue-600 text-white',
  'from-emerald-500 to-emerald-600 text-white',
  'from-amber-400 to-amber-500 text-white',
  'from-rose-500 to-rose-600 text-white',
];

const statIcons = [
  <path key="orders" strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10M7 17h6M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />,
  <path key="delivered" strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />,
  <path key="pending" strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0Z" />,
  <path key="cancelled" strokeLinecap="round" strokeLinejoin="round" d="m15 9-6 6m0-6 6 6" />,
];

function OrderManagement() {
  const { currentUser } = useAppContext();
  const { orders, filterStatus, setFilterStatus, searchQuery, setSearchQuery, getRevenueData } = useOrderContext();
  const [viewMode, setViewMode] = useState('purchases');
  const [sortOption, setSortOption] = useState(sortOptions[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.role === 'seller') {
      setViewMode('sales');
    }
  }, [currentUser]);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const salesSource = orders.filter((order) => order.sellerId === currentUser.id);

  const purchaseSource = orders.filter((order) => order.buyerId === currentUser.id);
  const sourceOrders = viewMode === 'sales' ? salesSource : purchaseSource;

  const filteredOrders = [...sourceOrders]
    .filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.product.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'All' || order.orderStatus === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((left, right) => {
      if (sortOption === 'Newest First') {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }

      if (sortOption === 'Oldest First') {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      }

      if (sortOption === 'Amount High-Low') {
        return right.totalAmount - left.totalAmount;
      }

      return left.totalAmount - right.totalAmount;
    });

  const viewStats = {
    totalOrders: sourceOrders.length,
    delivered: sourceOrders.filter((order) => order.orderStatus === 'Delivered').length,
    pendingActive: sourceOrders.filter((order) =>
      ['Placed', 'Confirmed', 'Shipped'].includes(order.orderStatus),
    ).length,
    cancelled: sourceOrders.filter((order) => order.orderStatus === 'Cancelled').length,
  };

  const statCards = [
    { label: 'Total Orders', value: viewStats.totalOrders },
    { label: 'Delivered', value: viewStats.delivered },
    { label: 'Pending / Active', value: viewStats.pendingActive },
    { label: 'Cancelled', value: viewStats.cancelled },
  ];

  const revenueData = getRevenueData();

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="mt-8 h-24 animate-pulse rounded-2xl bg-slate-200" />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Orders</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Order Management</h1>
            <p className="mt-2 text-sm text-slate-500">Track and manage all your orders</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setViewMode('purchases')}
              className={`rounded-lg px-4 py-2 font-semibold transition-all duration-200 ${
                viewMode === 'purchases'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              My Purchases
            </button>
            {currentUser.role === 'seller' && (
              <button
                type="button"
                onClick={() => setViewMode('sales')}
                className={`rounded-lg px-4 py-2 font-semibold transition-all duration-200 ${
                  viewMode === 'sales'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                My Sales
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => (
          <div
            key={card.label}
            className={`rounded-2xl bg-gradient-to-br p-6 shadow-md ${statCardStyles[index]}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">{card.label}</p>
                <p className="mt-3 text-3xl font-bold">{card.value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.8]">
                  {statIcons[index]}
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-md">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by order ID or product title"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          />
          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {statusTabs.map((status) => {
            const count =
              status === 'All'
                ? sourceOrders.length
                : sourceOrders.filter((order) => order.orderStatus === status).length;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  filterStatus === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    filterStatus === status ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Orders ({filteredOrders.length})</h2>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="mt-6 space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} viewMode={viewMode} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-white px-6 py-16 text-center shadow-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current stroke-[1.8]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10M7 17h6M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
            </svg>
          </div>
          <h3 className="mt-5 text-2xl font-bold text-slate-900">No orders found</h3>
          <p className="mt-2 text-sm text-slate-500">
            Try another search term, switch the status filter, or toggle between purchases and sales.
          </p>
        </div>
      )}

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Revenue Overview</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Revenue Overview - March 2026</h2>
          </div>
          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
            <p>Total Revenue: <span className="font-semibold text-slate-900">₹{revenueData.totalRevenue}</span></p>
            <p>Average Order Value: <span className="font-semibold text-slate-900">₹{Math.round(revenueData.averageOrderValue)}</span></p>
            <p>Best Day: <span className="font-semibold text-slate-900">{revenueData.bestDay.label}</span></p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-7 gap-3">
          {revenueData.days.map((day) => {
            const maxRevenue = Math.max(...revenueData.days.map((item) => item.revenue), 1);
            const height = day.revenue === 0 ? 12 : Math.max((day.revenue / maxRevenue) * 180, 24);

            return (
              <div key={day.date} className="flex flex-col items-center gap-3">
                <div className="flex h-52 w-full items-end justify-center rounded-2xl bg-slate-50 px-3 py-4">
                  <div
                    title={`₹${day.revenue}`}
                    className="w-full rounded-t-2xl bg-gradient-to-t from-blue-500 to-indigo-500 transition-all duration-200 hover:opacity-90"
                    style={{ height: `${height}px` }}
                  />
                </div>
                <p className="text-xs font-semibold text-slate-500">{day.label}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default OrderManagement;

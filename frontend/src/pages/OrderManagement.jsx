import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import OrderCard from '../components/OrderCard';
import BookingCard from '../components/BookingCard';
import { useOrderContext } from '../context/OrderContext';
import { useAppContext } from '../context/AppContext';

const statusTabs = ['All', 'Placed', 'Delivered'];
const bookingStatusTabs = ['All', 'Confirmed', 'Completed'];

function OrderManagement() {
  const { currentUser } = useAppContext();
  const { orders, bookings, filterStatus, setFilterStatus, searchQuery, setSearchQuery, loading } = useOrderContext();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'services'
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const buyerId = String(currentUser.id || currentUser._id);
  const myPurchases = orders.filter((order) => 
    String(order.buyerId) === buyerId
  );
  const myBookings = bookings || [];

  const filteredOrders = myPurchases.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.product?.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Simplification: 'Placed' includes in-progress states (confirmed, shipped)
    const normalizedStatus = (order.orderStatus || '').toLowerCase();
    const matchesStatus = filterStatus === 'All' || 
      (filterStatus === 'Placed' ? ['placed', 'confirmed', 'shipped'].includes(normalizedStatus) : order.orderStatus === filterStatus);
    
    return matchesSearch && matchesStatus;
  });

  const filteredBookings = myBookings.filter((booking) => {
    const matchesSearch =
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase());
    // Use a separate filter state or reuse filterStatus if status names align.
    // For simplicity, let's reuse filterStatus but adjust for 'Pending' vs 'Placed' etc.
    const matchesStatus = filterStatus === 'All' || booking.bookingStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
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
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">History</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Your Campus Activity</h1>
            <p className="mt-2 text-sm text-slate-500">View and track your orders and service bookings.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab('orders');
                setFilterStatus('All');
              }}
              className={`rounded-lg px-4 py-2 font-semibold transition-all duration-200 ${
                activeTab === 'orders'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Order History
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('services');
                setFilterStatus('All');
              }}
              className={`rounded-lg px-4 py-2 font-semibold transition-all duration-200 ${
                activeTab === 'services'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Booking History
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-md">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={`Search by ID or ${activeTab === 'orders' ? 'product' : 'service'} title`}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          />

          <div className="flex flex-wrap gap-2">
            {(activeTab === 'orders' ? statusTabs : bookingStatusTabs).map((status) => {
              const count = activeTab === 'orders'
                ? (status === 'All' 
                    ? myPurchases.length 
                    : myPurchases.filter(o => {
                        const s = (o.orderStatus || '').toLowerCase();
                        return status === 'Placed' ? ['placed', 'confirmed', 'shipped'].includes(s) : o.orderStatus === status;
                      }).length)
                : (status === 'All' ? myBookings.length : myBookings.filter(b => b.bookingStatus === status).length);

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
                      filterStatus === status ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-900">
          {activeTab === 'orders' ? 'Orders' : 'Bookings'} ({activeTab === 'orders' ? filteredOrders.length : filteredBookings.length})
        </h2>
      </div>

      <div className="mt-6 space-y-4">
        {activeTab === 'orders' ? (
          filteredOrders.length > 0 ? (
            filteredOrders.map((order) => <OrderCard key={order.id} order={order} viewMode="purchases" />)
          ) : (
            <EmptyState tab="orders" />
          )
        ) : (
          filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
          ) : (
            <EmptyState tab="services" />
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }) {
  return (
    <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-md">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current stroke-[1.8]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10M7 17h6M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
        </svg>
      </div>
      <h3 className="mt-5 text-2xl font-bold text-slate-900">No {tab} found</h3>
      <p className="mt-2 text-sm text-slate-500">
        Track your campus {tab === 'orders' ? 'purchases' : 'service bookings'} here. Start exploring to see activity.
      </p>
    </div>
  );
}

export default OrderManagement;

import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useOrderContext } from '../context/OrderContext';
import { useERPCRMContext } from '../context/ERPCRMContext';

const bookingRows = [
  { id: 1, service: 'Math Tutoring for First Year', provider: 'Riya Singh', date: 'Mar 24, 2026', status: 'Confirmed' },
  { id: 2, service: 'React Project Debugging Help', provider: 'Dev Malhotra', date: 'Mar 26, 2026', status: 'Upcoming' },
];

function Dashboard() {
  const { currentUser } = useAppContext();
  const { orders, inventory, getLowStockCount, removeInventoryItem } = useOrderContext();
  const { customers } = useERPCRMContext();
  const [activeTab, setActiveTab] = useState('My Listings');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const listingRows =
    currentUser.role === 'seller' || currentUser.role === 'both'
      ? inventory.filter((item) => currentUser.role === 'both' || item.sellerId === currentUser.id)
      : [];

  const orderRows = orders.filter((order) => order.buyerId === currentUser.id);
  const totalSpent = orderRows.reduce((sum, order) => sum + order.totalAmount + order.platformFee, 0);
  const lowStockCount = getLowStockCount();
  const sellerOrders =
    currentUser.role === 'seller' || currentUser.role === 'both'
      ? orders.filter((order) => (currentUser.role === 'both' ? order.sellerId === 'user_2' : order.sellerId === currentUser.id))
      : [];
  const myRevenue = sellerOrders
    .filter((order) => order.orderStatus === 'Delivered')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const myCustomers = [...new Set(sellerOrders.map((order) => order.buyerName))].length;
  const myListingsPerformance =
    listingRows.length > 0
      ? `${Math.round((listingRows.filter((item) => item.status === 'Active').length / listingRows.length) * 100)}% active`
      : 'No listings';

  const stats = [
    { label: 'My Listings', value: listingRows.length },
    { label: 'Orders Placed', value: orderRows.length },
    { label: 'Services Booked', value: bookingRows.length },
    { label: 'Total Spent', value: `₹${totalSpent}` },
  ];

  const handleDeleteListing = (itemId, title) => {
    if (window.confirm(`Delete ${title} from your listings?`)) {
      removeInventoryItem(itemId);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="mt-8 h-96 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-[2rem] bg-white p-8 shadow-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome back, {currentUser.name}</h1>
            <p className="mt-2 text-sm text-slate-500">
              Track your listings, purchases, bookings, and inventory health from one place.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/list-product"
              className="rounded-lg bg-blue-500 px-4 py-3 text-center font-semibold text-white transition hover:bg-indigo-500"
            >
              List Product
            </Link>
            <Link
              to="/list-service"
              className="rounded-lg border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
            >
              List Service
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white px-6 py-6 shadow-md">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
        {lowStockCount > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-6 shadow-md">
            <p className="text-sm font-medium text-amber-700">Low Stock Alert</p>
            <p className="mt-3 text-3xl font-bold text-amber-900">{lowStockCount}</p>
            <p className="mt-2 text-sm text-amber-800">Items need restocking soon.</p>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-[2rem] bg-white p-8 shadow-md">
        <div className="flex flex-wrap gap-3">
          {['My Listings', 'My Orders', 'My Bookings'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'My Listings' && (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-4 pr-4 font-semibold">Title</th>
                  <th className="pb-4 pr-4 font-semibold">Category</th>
                  <th className="pb-4 pr-4 font-semibold">Price</th>
                  <th className="pb-4 pr-4 font-semibold">Available</th>
                  <th className="pb-4 pr-4 font-semibold">Status</th>
                  <th className="pb-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listingRows.slice(0, 5).map((row) => (
                  <tr key={row.id}>
                    <td className="py-4 pr-4 font-medium text-slate-900">{row.title}</td>
                    <td className="py-4 pr-4 text-slate-600">{row.category}</td>
                    <td className="py-4 pr-4 text-slate-600">₹{row.price}</td>
                    <td className="py-4 pr-4 text-slate-600">{row.availableStock}</td>
                    <td className="py-4 pr-4 text-slate-600">{row.status}</td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <Link
                          to="/inventory"
                          className="rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(row.id, row.title)}
                          className="rounded-lg bg-rose-50 px-3 py-2 font-semibold text-rose-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {listingRows.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-500">
                      No listings available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'My Orders' && (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-4 pr-4 font-semibold">Order ID</th>
                  <th className="pb-4 pr-4 font-semibold">Product Name</th>
                  <th className="pb-4 pr-4 font-semibold">Seller</th>
                  <th className="pb-4 pr-4 font-semibold">Amount</th>
                  <th className="pb-4 pr-4 font-semibold">Status</th>
                  <th className="pb-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orderRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-4 pr-4 font-medium text-slate-900">{row.id}</td>
                    <td className="py-4 pr-4 text-slate-600">{row.product.title}</td>
                    <td className="py-4 pr-4 text-slate-600">{row.sellerName}</td>
                    <td className="py-4 pr-4 text-slate-600">₹{row.totalAmount}</td>
                    <td className="py-4 pr-4 text-slate-600">{row.orderStatus}</td>
                    <td className="py-4">
                      <Link to={`/orders/${row.id}`} className="font-semibold text-blue-600">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {orderRows.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-500">
                      No orders placed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'My Bookings' && (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-4 pr-4 font-semibold">Service</th>
                  <th className="pb-4 pr-4 font-semibold">Provider</th>
                  <th className="pb-4 pr-4 font-semibold">Date</th>
                  <th className="pb-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookingRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-4 pr-4 font-medium text-slate-900">{row.service}</td>
                    <td className="py-4 pr-4 text-slate-600">{row.provider}</td>
                    <td className="py-4 pr-4 text-slate-600">{row.date}</td>
                    <td className="py-4 text-slate-600">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-md">
        <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/orders"
            className="rounded-lg bg-blue-500 px-4 py-3 text-center font-semibold text-white transition hover:bg-indigo-500"
          >
            View All Orders
          </Link>
          {(currentUser.role === 'seller' || currentUser.role === 'both') && (
            <Link
              to="/inventory"
              className="rounded-lg border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
            >
              Manage Inventory
            </Link>
          )}
          <Link
            to="/list-product"
            className="rounded-lg border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
          >
            List New Product
          </Link>
        </div>
      </section>

      {(currentUser.role === 'seller' || currentUser.role === 'both') && (
        <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-md">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Business Overview</h2>
              <p className="mt-2 text-sm text-slate-500">
                Keep an eye on seller performance and jump into ERP and CRM tools quickly.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/crm"
                className="rounded-lg bg-indigo-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-purple-600"
              >
                Open CRM
              </Link>
              <Link
                to="/erp"
                className="rounded-lg border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
              >
                Open ERP
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-blue-50 p-5">
              <p className="text-sm font-medium text-blue-700">My Revenue</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">₹{myRevenue}</p>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-5">
              <p className="text-sm font-medium text-indigo-700">My Customers</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{myCustomers}</p>
              <p className="mt-2 text-sm text-slate-500">
                {customers.filter((customer) => customer.role !== 'Seller').length} CRM profiles available
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-sm font-medium text-emerald-700">My Listings Performance</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{myListingsPerformance}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Dashboard;

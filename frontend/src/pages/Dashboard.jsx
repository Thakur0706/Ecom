import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useOrderContext } from '../context/OrderContext';
import { api } from '../lib/api';

const sellerFormInitialState = {
  fullName: '',
  studentId: '',
  collegeName: '',
  department: '',
  contactNumber: '',
  upiOrBankDetails: '',
  govIdUrl: '',
  studentIdUrl: '',
};

function Dashboard() {
  const { currentUser } = useAppContext();
  const { orders, bookings, serviceBookings, inventory, getLowStockCount } = useOrderContext();
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [sellerForm, setSellerForm] = useState(sellerFormInitialState);
  const [message, setMessage] = useState('');

  const sellerStatusQuery = useQuery({
    queryKey: ['seller', 'status'],
    queryFn: api.seller.status,
    enabled: Boolean(currentUser && currentUser.role !== 'admin'),
  });
  const sellerOverviewQuery = useQuery({
    queryKey: ['seller', 'dashboard-overview'],
    queryFn: api.seller.overview,
    enabled: Boolean(currentUser?.role === 'seller'),
  });
  const sellerApplyMutation = useMutation({
    mutationFn: api.seller.apply,
    onSuccess: () => {
      setMessage('Seller application submitted successfully.');
      setShowSellerForm(false);
      setSellerForm(sellerFormInitialState);
      sellerStatusQuery.refetch();
    },
    onError: (error) => {
      setMessage(error.response?.data?.message || 'Unable to submit seller application.');
    },
  });

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const sellerStatus = currentUser.role === 'seller' ? 'approved' : sellerStatusQuery.data?.data?.status || 'not-applied';
  const purchaseOrders = orders.filter((order) => order.buyerId === currentUser.id);
  const salesOrders = orders.filter((order) => order.sellerId === currentUser.id);
  const totalSpent = purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const sellerOverview = sellerOverviewQuery.data?.data?.overview;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSellerForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSellerSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    await sellerApplyMutation.mutateAsync(sellerForm);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-[2rem] bg-white p-8 shadow-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
              {currentUser.role === 'seller' ? 'Seller Dashboard' : 'Buyer Dashboard'}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome back, {currentUser.name}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {currentUser.role === 'seller'
                ? 'Track sales, listings, bookings, and customer performance from one place.'
                : 'Review your recent orders, service bookings, and upgrade to seller access when you are ready.'}
            </p>
          </div>
          {currentUser.role === 'seller' ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/list-product"
                className="rounded-lg bg-blue-500 px-4 py-3 text-center font-semibold text-white transition hover:bg-indigo-500"
              >
                My Products
              </Link>
              <Link
                to="/list-service"
                className="rounded-lg border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
              >
                My Services
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/products"
                className="rounded-lg bg-blue-500 px-4 py-3 text-center font-semibold text-white transition hover:bg-indigo-500"
              >
                Browse Products
              </Link>
              <Link
                to="/bookings"
                className="rounded-lg border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
              >
                View Bookings
              </Link>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      {currentUser.role === 'seller' ? (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white px-6 py-6 shadow-md">
              <p className="text-sm font-medium text-slate-500">Revenue</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">Rs {sellerOverview?.totalRevenue || 0}</p>
            </div>
            <div className="rounded-2xl bg-white px-6 py-6 shadow-md">
              <p className="text-sm font-medium text-slate-500">Orders Received</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{sellerOverview?.totalOrdersReceived || salesOrders.length}</p>
            </div>
            <div className="rounded-2xl bg-white px-6 py-6 shadow-md">
              <p className="text-sm font-medium text-slate-500">Active Listings</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{sellerOverview?.activeListings || inventory.length}</p>
            </div>
            <div className="rounded-2xl bg-white px-6 py-6 shadow-md">
              <p className="text-sm font-medium text-slate-500">Average Rating</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{sellerOverview?.averageRating || 0}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-[2rem] bg-white p-8 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900">Recent Orders</h2>
              <div className="mt-6 space-y-4">
                {salesOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{order.id}</p>
                        <p className="text-sm text-slate-600">
                          {order.product.title} by {order.buyerName}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{order.orderStatus}</span>
                    </div>
                  </div>
                ))}
                {salesOrders.length === 0 && (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No sales yet.</p>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-8 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900">Seller Shortcuts</h2>
              <div className="mt-6 grid gap-3">
                <Link to="/seller/erp" className="rounded-xl bg-blue-50 px-4 py-4 font-semibold text-blue-700">
                  ERP and inventory
                </Link>
                <Link to="/seller/crm" className="rounded-xl bg-indigo-50 px-4 py-4 font-semibold text-indigo-700">
                  CRM and customers
                </Link>
                <Link to="/seller/analytics" className="rounded-xl bg-emerald-50 px-4 py-4 font-semibold text-emerald-700">
                  Analytics and trends
                </Link>
                <Link to="/seller/reports" className="rounded-xl bg-amber-50 px-4 py-4 font-semibold text-amber-700">
                  Export reports
                </Link>
                <div className="rounded-xl bg-rose-50 px-4 py-4 font-semibold text-rose-700">
                  Low stock alerts: {getLowStockCount()}
                </div>
              </div>
            </section>
          </div>

          <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900">Service Bookings</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-4 font-semibold">Booking</th>
                    <th className="pb-4 font-semibold">Service</th>
                    <th className="pb-4 font-semibold">Buyer</th>
                    <th className="pb-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {serviceBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="py-4 font-medium text-slate-900">{booking.id}</td>
                      <td className="py-4 text-slate-600">{booking.serviceTitle}</td>
                      <td className="py-4 text-slate-600">{booking.buyerName}</td>
                      <td className="py-4 text-slate-600">{booking.bookingStatus}</td>
                    </tr>
                  ))}
                  {serviceBookings.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500">
                        No service bookings yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white px-6 py-6 shadow-md">
              <p className="text-sm font-medium text-slate-500">Orders Placed</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{purchaseOrders.length}</p>
            </div>
            <div className="rounded-2xl bg-white px-6 py-6 shadow-md">
              <p className="text-sm font-medium text-slate-500">Bookings</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{bookings.length}</p>
            </div>
            <div className="rounded-2xl bg-white px-6 py-6 shadow-md">
              <p className="text-sm font-medium text-slate-500">Total Spent</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">Rs {totalSpent}</p>
            </div>
            <div className="rounded-2xl bg-white px-6 py-6 shadow-md">
              <p className="text-sm font-medium text-slate-500">Seller Status</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{sellerStatus}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-[2rem] bg-white p-8 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900">Recent Purchases</h2>
              <div className="mt-6 space-y-4">
                {purchaseOrders.slice(0, 5).map((order) => (
                  <Link key={order.id} to={`/orders/${order.id}`} className="block rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{order.product.title}</p>
                        <p className="text-sm text-slate-600">{order.sellerName}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{order.orderStatus}</span>
                    </div>
                  </Link>
                ))}
                {purchaseOrders.length === 0 && (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    No purchases yet. Start browsing the marketplace.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-8 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900">Seller Onboarding</h2>
              {sellerStatus === 'pending' && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                  Your seller application is pending review.
                </div>
              )}
              {sellerStatus === 'rejected' && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                  Your previous seller application was rejected. You can submit updated details below.
                </div>
              )}
              {sellerStatus !== 'approved' && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowSellerForm((previous) => !previous)}
                    className="mt-6 rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500"
                  >
                    {showSellerForm ? 'Hide form' : 'Apply for seller role'}
                  </button>

                  {showSellerForm && (
                    <form onSubmit={handleSellerSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                      <input
                        name="fullName"
                        value={sellerForm.fullName}
                        onChange={handleChange}
                        required
                        placeholder="Full name"
                        className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 md:col-span-2"
                      />
                      <input
                        name="studentId"
                        value={sellerForm.studentId}
                        onChange={handleChange}
                        required
                        placeholder="Student ID number"
                        className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                      />
                      <input
                        name="collegeName"
                        value={sellerForm.collegeName}
                        onChange={handleChange}
                        required
                        placeholder="College name"
                        className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                      />
                      <input
                        name="department"
                        value={sellerForm.department}
                        onChange={handleChange}
                        required
                        placeholder="Department"
                        className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                      />
                      <input
                        name="contactNumber"
                        value={sellerForm.contactNumber}
                        onChange={handleChange}
                        required
                        placeholder="Contact number"
                        className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                      />
                      <input
                        name="upiOrBankDetails"
                        value={sellerForm.upiOrBankDetails}
                        onChange={handleChange}
                        required
                        placeholder="UPI ID or bank details"
                        className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 md:col-span-2"
                      />
                      <input
                        name="govIdUrl"
                        value={sellerForm.govIdUrl}
                        onChange={handleChange}
                        required
                        placeholder="Government ID URL"
                        className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 md:col-span-2"
                      />
                      <input
                        name="studentIdUrl"
                        value={sellerForm.studentIdUrl}
                        onChange={handleChange}
                        required
                        placeholder="Student ID card URL"
                        className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 md:col-span-2"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 md:col-span-2"
                      >
                        {sellerApplyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                      </button>
                    </form>
                  )}
                </>
              )}
              {sellerStatus === 'approved' && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                  You are already approved as a seller.
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import KPICard from '../components/KPICard';
import { useAppContext } from '../context/AppContext';
import { api } from '../lib/api';

const sectionTitleMap = {
  dashboard: 'Platform overview',
  sellers: 'Seller verification queue',
  users: 'User management',
  products: 'Product moderation',
  services: 'Service moderation',
  orders: 'Order management',
};

function AdminPanel() {
  const { currentUser } = useAppContext();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');

  const section = location.pathname.split('/')[2] || 'dashboard';

  const overviewQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: api.admin.overview,
    enabled: Boolean(currentUser?.role === 'admin'),
  });
  const sellersQuery = useQuery({
    queryKey: ['admin', 'pending-sellers'],
    queryFn: () => api.admin.sellersPending({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'admin' && section === 'sellers'),
  });
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.admin.users({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'admin' && section === 'users'),
  });
  const productsQuery = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => api.admin.products({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'admin' && section === 'products'),
  });
  const servicesQuery = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => api.admin.services({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'admin' && section === 'services'),
  });
  const ordersQuery = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => api.admin.orders({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'admin' && section === 'orders'),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ type, id }) => {
      if (type === 'approve-seller') {
        return api.admin.approveSeller(id);
      }
      if (type === 'reject-seller') {
        return api.admin.rejectSeller(id, { rejectionReason });
      }
      if (type === 'approve-product') {
        return api.admin.approveProduct(id);
      }
      if (type === 'remove-product') {
        return api.admin.removeProduct(id);
      }
      if (type === 'approve-service') {
        return api.admin.approveService(id);
      }
      if (type === 'remove-service') {
        return api.admin.removeService(id);
      }
      return api.admin.toggleUser(id, { isActive: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  if (currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const overview = overviewQuery.data?.data?.overview;
  const adminStats = overview
    ? [
        { title: 'Total Users', value: overview.totalUsers, icon: 'U', color: 'bg-blue-100 text-blue-600' },
        { title: 'Total Sellers', value: overview.totalSellers, icon: 'S', color: 'bg-indigo-100 text-indigo-600' },
        { title: 'Total Orders', value: overview.totalOrders, icon: 'O', color: 'bg-emerald-100 text-emerald-600' },
        { title: 'Revenue', value: `Rs ${overview.totalPlatformRevenue}`, icon: 'R', color: 'bg-amber-100 text-amber-600' },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 text-white">
      <div className="rounded-[2rem] border border-white/10 bg-slate-900 p-8 shadow-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">Admin Console</p>
            <h1 className="mt-2 text-3xl font-bold">{sectionTitleMap[section] || 'Admin Dashboard'}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/dashboard" className="rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold">
              Dashboard
            </Link>
            <Link to="/admin/reports" className="rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold">
              Reports
            </Link>
          </div>
        </div>
      </div>

      {section === 'dashboard' && (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {adminStats.map((stat) => (
              <KPICard key={stat.title} {...stat} />
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-[2rem] border border-white/10 bg-slate-900 p-8 shadow-md">
              <h2 className="text-2xl font-bold">Seller queue</h2>
              <p className="mt-3 text-sm text-slate-300">
                {overview?.pendingApprovals || 0} seller applications are waiting for review.
              </p>
              <Link to="/admin/sellers" className="mt-6 inline-flex rounded-lg bg-blue-500 px-4 py-3 font-semibold">
                Open seller approvals
              </Link>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-900 p-8 shadow-md">
              <h2 className="text-2xl font-bold">Marketplace moderation</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>Products: {overview?.totalProducts || 0}</p>
                <p>Services: {overview?.totalServices || 0}</p>
              </div>
              <div className="mt-6 flex gap-3">
                <Link to="/admin/products" className="rounded-lg bg-white/10 px-4 py-3 font-semibold">
                  Products
                </Link>
                <Link to="/admin/services" className="rounded-lg bg-white/10 px-4 py-3 font-semibold">
                  Services
                </Link>
              </div>
            </section>
          </div>
        </>
      )}

      {section === 'sellers' && (
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900 p-8 shadow-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Pending seller applications</h2>
          </div>
          <div className="space-y-4">
            {(sellersQuery.data?.data?.sellers || []).map((seller) => (
              <div key={seller._id} className="rounded-2xl bg-white/5 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold">{seller.userId?.name || seller.fullName}</p>
                    <p className="text-sm text-slate-300">
                      {seller.collegeName} • {seller.department} • {seller.contactNumber}
                    </p>
                    <div className="mt-3 text-xs text-slate-400">
                      <p>Gov ID: {seller.govIdUrl}</p>
                      <p>Student ID: {seller.studentIdUrl}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 lg:w-80">
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="Optional rejection reason"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => actionMutation.mutate({ type: 'approve-seller', id: seller._id })}
                        className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => actionMutation.mutate({ type: 'reject-seller', id: seller._id })}
                        className="flex-1 rounded-lg bg-rose-500 px-4 py-3 font-semibold text-white"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {section === 'users' && (
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900 p-8 shadow-md">
          <h2 className="text-2xl font-bold">All users</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-4 font-semibold">Name</th>
                  <th className="pb-4 font-semibold">Email</th>
                  <th className="pb-4 font-semibold">Role</th>
                  <th className="pb-4 font-semibold">Status</th>
                  <th className="pb-4 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(usersQuery.data?.data?.users || []).map((user) => (
                  <tr key={user.id}>
                    <td className="py-4 font-medium">{user.name}</td>
                    <td className="py-4 text-slate-300">{user.email}</td>
                    <td className="py-4 text-slate-300">{user.role}</td>
                    <td className="py-4 text-slate-300">{user.isActive ? 'active' : 'inactive'}</td>
                    <td className="py-4 text-slate-300">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === 'products' && (
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900 p-8 shadow-md">
          <h2 className="text-2xl font-bold">Product moderation</h2>
          <div className="mt-6 space-y-4">
            {(productsQuery.data?.data?.products || []).map((product) => (
              <div key={product._id} className="flex flex-col gap-4 rounded-2xl bg-white/5 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold">{product.title}</p>
                  <p className="text-sm text-slate-300">
                    {product.category} • {product.sellerId?.name || 'Seller'} • {product.status}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => actionMutation.mutate({ type: 'approve-product', id: product._id })}
                    className="rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => actionMutation.mutate({ type: 'remove-product', id: product._id })}
                    className="rounded-lg bg-rose-500 px-4 py-3 font-semibold text-white"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {section === 'services' && (
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900 p-8 shadow-md">
          <h2 className="text-2xl font-bold">Service moderation</h2>
          <div className="mt-6 space-y-4">
            {(servicesQuery.data?.data?.services || []).map((service) => (
              <div key={service._id} className="flex flex-col gap-4 rounded-2xl bg-white/5 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold">{service.title}</p>
                  <p className="text-sm text-slate-300">
                    {service.category} • {service.sellerId?.name || 'Seller'} • {service.status}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => actionMutation.mutate({ type: 'approve-service', id: service._id })}
                    className="rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => actionMutation.mutate({ type: 'remove-service', id: service._id })}
                    className="rounded-lg bg-rose-500 px-4 py-3 font-semibold text-white"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {section === 'orders' && (
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900 p-8 shadow-md">
          <h2 className="text-2xl font-bold">Platform orders</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-4 font-semibold">Order ID</th>
                  <th className="pb-4 font-semibold">Buyer</th>
                  <th className="pb-4 font-semibold">Seller</th>
                  <th className="pb-4 font-semibold">Amount</th>
                  <th className="pb-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(ordersQuery.data?.data?.orders || []).map((order) => (
                  <tr key={order._id}>
                    <td className="py-4 font-medium">{order._id}</td>
                    <td className="py-4 text-slate-300">{order.buyerId?.name || 'Buyer'}</td>
                    <td className="py-4 text-slate-300">{order.sellerId?.name || 'Seller'}</td>
                    <td className="py-4 text-slate-300">Rs {order.totalAmount}</td>
                    <td className="py-4 text-slate-300">{order.orderStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default AdminPanel;

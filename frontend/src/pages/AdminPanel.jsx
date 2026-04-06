import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";
import KPICard from "../components/KPICard";
import { useAppContext } from "../context/AppContext";
import { api } from "../lib/api";

const sectionTitleMap = {
  dashboard: "Platform overview",
  sellers: "Seller verification queue",
  users: "User management",
  products: "Product moderation",
  services: "Service moderation",
  orders: "Order management",
  commissions: "Seller commissions & payouts",
  analytics: "Analytics & Reports",
  payments: "Seller Reimbursements",
};

function AdminPanel() {
  const { currentUser } = useAppContext();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState("");
  const [paymentForm, setPaymentForm] = useState({ sellerId: "", amount: "" });

  const section = location.pathname.split("/")[2] || "dashboard";

  const overviewQuery = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: api.admin.overview,
    enabled: Boolean(currentUser?.role === "admin"),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
  const sellersQuery = useQuery({
    queryKey: ["admin", "pending-sellers"],
    queryFn: () => api.admin.sellersPending({ limit: 100 }),
    enabled: Boolean(currentUser?.role === "admin" && section === "sellers"),
  });
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.admin.users({ limit: 100 }),
    enabled: Boolean(currentUser?.role === "admin" && section === "users"),
  });
  const productsQuery = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => api.admin.products({ limit: 100 }),
    enabled: Boolean(currentUser?.role === "admin" && section === "products"),
  });
  const servicesQuery = useQuery({
    queryKey: ["admin", "services"],
    queryFn: () => api.admin.services({ limit: 100 }),
    enabled: Boolean(currentUser?.role === "admin" && section === "services"),
  });
  const ordersQuery = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => api.admin.orders({ limit: 100 }),
    enabled: Boolean(currentUser?.role === "admin" && section === "orders"),
  });
  const commissionsQuery = useQuery({
    queryKey: ["admin", "commissions"],
    queryFn: () => api.admin.commissions({ limit: 100 }),
    enabled: Boolean(
      currentUser?.role === "admin" && section === "commissions",
    ),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
  const analyticsQuery = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => api.admin.analytics(),
    enabled: Boolean(currentUser?.role === "admin" && section === "analytics"),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
  const paymentsQuery = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: () => api.admin.sellerPayments({ limit: 100 }),
    enabled: Boolean(currentUser?.role === "admin" && section === "payments"),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const actionMutation = useMutation({
    mutationFn: async ({ type, id }) => {
      if (type === "approve-seller") {
        return api.admin.approveSeller(id);
      }
      if (type === "reject-seller") {
        return api.admin.rejectSeller(id, { rejectionReason });
      }
      if (type === "approve-product") {
        return api.admin.approveProduct(id);
      }
      if (type === "remove-product") {
        return api.admin.removeProduct(id);
      }
      if (type === "approve-service") {
        return api.admin.approveService(id);
      }
      if (type === "remove-service") {
        return api.admin.removeService(id);
      }
      if (type === "pay-commission") {
        return api.admin.payCommission(id, { notes: "Payment processed" });
      }
      return api.admin.toggleUser(id, { isActive: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (payload) => api.admin.createSellerPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      setPaymentForm({ sellerId: "", amount: "" });
    },
  });

  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  if (currentUser.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const overview = overviewQuery.data?.data?.overview;
  const adminStats = overview
    ? [
        {
          title: "Total Users",
          value: overview.totalUsers,
          icon: "U",
          color: "bg-blue-100 text-blue-600",
        },
        {
          title: "Total Sellers",
          value: overview.totalSellers,
          icon: "S",
          color: "bg-indigo-100 text-indigo-600",
        },
        {
          title: "Total Orders",
          value: overview.totalOrders,
          icon: "O",
          color: "bg-emerald-100 text-emerald-600",
        },
        {
          title: "Revenue",
          value: `Rs ${overview.totalPlatformRevenue}`,
          icon: "R",
          color: "bg-amber-100 text-amber-600",
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 bg-slate-50 min-h-screen">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
              Admin Console
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {sectionTitleMap[section] || "Admin Dashboard"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/dashboard"
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${section === 'dashboard' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Dashboard
            </Link>
            <Link
              to="/admin/erp"
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${section === 'erp' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              ERP
            </Link>
            <Link
              to="/admin/crm"
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${section === 'crm' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              CRM
            </Link>
            <Link
              to="/admin/reports"
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${section === 'reports' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Reports
            </Link>
            <Link
              to="/admin/analytics"
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${section === 'analytics' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Analytics
            </Link>
          </div>
        </div>
      </div>

      {section === "dashboard" && (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {adminStats.map((stat) => (
              <KPICard key={stat.title} {...stat} />
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900">
                Seller queue
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                {overview?.pendingApprovals || 0} seller applications are
                waiting for review.
              </p>
              <Link
                to="/admin/sellers"
                className="mt-6 inline-flex rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-600"
              >
                Open seller approvals
              </Link>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900">
                Marketplace moderation
              </h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Products: {overview?.totalProducts || 0}</p>
                <p>Services: {overview?.totalServices || 0}</p>
              </div>
              <div className="mt-6 flex gap-3">
                <Link
                  to="/admin/products"
                  className="rounded-lg bg-slate-100 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Products
                </Link>
                <Link
                  to="/admin/services"
                  className="rounded-lg bg-slate-100 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Services
                </Link>
              </div>
            </section>
          </div>
        </>
      )}

      {section === "sellers" && (
        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Pending seller applications
            </h2>
          </div>
          <div className="space-y-4">
            {(sellersQuery.data?.data?.sellers || []).map((seller) => (
              <div
                key={seller._id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {seller.userId?.name || seller.fullName}
                    </p>
                    <p className="text-sm text-slate-600">
                      {seller.collegeName} • {seller.department} •{" "}
                      {seller.contactNumber}
                    </p>
                    <div className="mt-3 text-xs text-slate-500">
                      <p>Gov ID: {seller.govIdUrl}</p>
                      <p>Student ID: {seller.studentIdUrl}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 lg:w-80">
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(event) =>
                        setRejectionReason(event.target.value)
                      }
                      placeholder="Optional rejection reason"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          actionMutation.mutate({
                            type: "approve-seller",
                            id: seller._id,
                          })
                        }
                        className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          actionMutation.mutate({
                            type: "reject-seller",
                            id: seller._id,
                          })
                        }
                        className="flex-1 rounded-lg bg-rose-500 px-4 py-3 font-semibold text-white transition hover:bg-rose-600"
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

      {section === "users" && (
        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900">All users</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="pb-4 font-semibold text-slate-900">Name</th>
                  <th className="pb-4 font-semibold text-slate-900">Email</th>
                  <th className="pb-4 font-semibold text-slate-900">Role</th>
                  <th className="pb-4 font-semibold text-slate-900">Status</th>
                  <th className="pb-4 font-semibold text-slate-900">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(usersQuery.data?.data?.users || []).map((user) => (
                  <tr key={user.id}>
                    <td className="py-4 font-medium text-slate-900">
                      {user.name}
                    </td>
                    <td className="py-4 text-slate-600">{user.email}</td>
                    <td className="py-4 text-slate-600">{user.role}</td>
                    <td className="py-4 text-slate-600">
                      {user.isActive ? "active" : "inactive"}
                    </td>
                    <td className="py-4 text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === "products" && (
        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900">
            Product moderation
          </h2>
          <div className="mt-6 space-y-4">
            {(productsQuery.data?.data?.products || []).map((product) => (
              <div
                key={product._id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {product.title}
                  </p>
                  <p className="text-sm text-slate-600">
                    {product.category} • {product.sellerId?.name || "Seller"} •{" "}
                    {product.status}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      actionMutation.mutate({
                        type: "approve-product",
                        id: product._id,
                      })
                    }
                    className="rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      actionMutation.mutate({
                        type: "remove-product",
                        id: product._id,
                      })
                    }
                    className="rounded-lg bg-rose-500 px-4 py-3 font-semibold text-white transition hover:bg-rose-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {section === "services" && (
        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900">
            Service moderation
          </h2>
          <div className="mt-6 space-y-4">
            {(servicesQuery.data?.data?.services || []).map((service) => (
              <div
                key={service._id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {service.title}
                  </p>
                  <p className="text-sm text-slate-600">
                    {service.category} • {service.sellerId?.name || "Seller"} •{" "}
                    {service.status}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      actionMutation.mutate({
                        type: "approve-service",
                        id: service._id,
                      })
                    }
                    className="rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      actionMutation.mutate({
                        type: "remove-service",
                        id: service._id,
                      })
                    }
                    className="rounded-lg bg-rose-500 px-4 py-3 font-semibold text-white transition hover:bg-rose-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {section === "orders" && (
        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900">Platform orders</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="pb-4 font-semibold text-slate-900">
                    Order ID
                  </th>
                  <th className="pb-4 font-semibold text-slate-900">Buyer</th>
                  <th className="pb-4 font-semibold text-slate-900">Seller</th>
                  <th className="pb-4 font-semibold text-slate-900">Amount</th>
                  <th className="pb-4 font-semibold text-slate-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(ordersQuery.data?.data?.orders || []).map((order) => (
                  <tr key={order._id}>
                    <td className="py-4 font-medium text-slate-900">
                      {order._id}
                    </td>
                    <td className="py-4 text-slate-600">
                      {order.buyerId?.name || "Buyer"}
                    </td>
                    <td className="py-4 text-slate-600">
                      {order.sellerId?.name || "Seller"}
                    </td>
                    <td className="py-4 text-slate-600">
                      Rs {order.totalAmount}
                    </td>
                    <td className="py-4 text-slate-600">{order.orderStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === "commissions" && (
        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Seller commissions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage platform fees and seller payouts
              </p>
            </div>
          </div>

          {/* Commission Summary */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-600">
                Total commissions earned
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                Rs{" "}
                {(commissionsQuery.data?.data?.commissions || [])
                  .reduce((sum, c) => sum + (c.platformFee || 0), 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-700">
                Commissions paid
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                Rs{" "}
                {(commissionsQuery.data?.data?.commissions || [])
                  .filter((c) => c.paymentStatus === "paid")
                  .reduce((sum, c) => sum + (c.sellerPayableAmount || 0), 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase text-amber-700">
                Pending payouts
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-600">
                Rs{" "}
                {(commissionsQuery.data?.data?.commissions || [])
                  .filter((c) => c.paymentStatus === "pending")
                  .reduce((sum, c) => sum + (c.sellerPayableAmount || 0), 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>

          {/* Commission Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="pb-4 font-semibold text-slate-900">Seller</th>
                  <th className="pb-4 font-semibold text-slate-900">Type</th>
                  <th className="pb-4 font-semibold text-slate-900">
                    Order Amount
                  </th>
                  <th className="pb-4 font-semibold text-slate-900">
                    Platform Fee
                  </th>
                  <th className="pb-4 font-semibold text-slate-900">Payable</th>
                  <th className="pb-4 font-semibold text-slate-900">Status</th>
                  <th className="pb-4 font-semibold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(commissionsQuery.data?.data?.commissions || []).map(
                  (commission) => (
                    <tr key={commission._id}>
                      <td className="py-4 font-medium text-slate-900">
                        {commission.sellerId?.name || "Unknown"}
                      </td>
                      <td className="py-4 text-slate-600 capitalize">
                        {commission.type}
                      </td>
                      <td className="py-4 text-slate-600">
                        Rs {commission.orderAmount}
                      </td>
                      <td className="py-4 font-semibold text-slate-900">
                        Rs {commission.platformFee}
                      </td>
                      <td className="py-4 font-semibold text-slate-900">
                        Rs {commission.sellerPayableAmount}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            commission.paymentStatus === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {commission.paymentStatus}
                        </span>
                      </td>
                      <td className="py-4">
                        {commission.paymentStatus === "pending" && (
                          <button
                            type="button"
                            onClick={() =>
                              actionMutation.mutate({
                                type: "pay-commission",
                                id: commission._id,
                              })
                            }
                            disabled={actionMutation.isPending}
                            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
                          >
                            Pay Now
                          </button>
                        )}
                        {commission.paymentStatus === "paid" && (
                          <span className="text-xs text-slate-500">
                            Paid:{" "}
                            {commission.paidAt
                              ? new Date(commission.paidAt).toLocaleDateString(
                                  "en-IN",
                                )
                              : "-"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === "analytics" && (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Total Commission Earned
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                Rs{" "}
                {(analyticsQuery.data?.data?.commission?.total || 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Commission Paid
              </p>
              <p className="mt-3 text-3xl font-bold text-emerald-600">
                Rs{" "}
                {(analyticsQuery.data?.data?.commission?.paid || 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Total Sales
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                Rs{" "}
                {(analyticsQuery.data?.data?.salesByType || [])
                  .reduce((sum, s) => sum + s.totalSales, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Total Transactions
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {(analyticsQuery.data?.data?.salesByType || []).reduce(
                  (sum, s) => sum + s.count,
                  0,
                )}
              </p>
            </div>
          </div>

          {/* Sales by Type */}
          <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900">
              Sales Breakdown
            </h2>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="pb-4 font-semibold text-slate-900">Type</th>
                    <th className="pb-4 font-semibold text-slate-900">
                      Total Sales
                    </th>
                    <th className="pb-4 font-semibold text-slate-900">
                      Platform Fee
                    </th>
                    <th className="pb-4 font-semibold text-slate-900">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(analyticsQuery.data?.data?.salesByType || []).map(
                    (sale) => (
                      <tr key={sale._id}>
                        <td className="py-4 font-medium text-slate-900 capitalize">
                          {sale._id}
                        </td>
                        <td className="py-4 text-slate-600">
                          Rs {sale.totalSales.toFixed(2)}
                        </td>
                        <td className="py-4 text-slate-600">
                          Rs {sale.totalFees.toFixed(2)}
                        </td>
                        <td className="py-4 text-slate-700 font-semibold">
                          {sale.count}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Top Sellers */}
          <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900">
              Top Sellers by Earnings
            </h2>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="pb-4 font-semibold text-slate-900">Rank</th>
                    <th className="pb-4 font-semibold text-slate-900">Seller</th>
                    <th className="pb-4 font-semibold text-slate-900">Email</th>
                    <th className="pb-4 font-semibold text-slate-900">Total Earnings</th>
                    <th className="pb-4 font-semibold text-slate-900">Total Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(analyticsQuery.data?.data?.topSellers || []).map(
                    (seller, index) => (
                      <tr key={seller.sellerId}>
                        <td className="py-4 font-bold text-slate-900">#{index + 1}</td>
                        <td className="py-4 font-medium text-slate-900">
                          {seller.sellerName}
                        </td>
                        <td className="py-4 text-slate-600">
                          {seller.sellerEmail}
                        </td>
                        <td className="py-4 text-emerald-600 font-semibold">
                          Rs {seller.totalEarnings.toFixed(2)}
                        </td>
                        <td className="py-4 text-slate-700 font-semibold">
                          {seller.totalSales}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {section === "erp" && (
        <div className="mt-8">
          <Navigate to="/admin/erp" replace />
        </div>
      )}

      {section === "crm" && (
        <div className="mt-8">
          <Navigate to="/admin/crm" replace />
        </div>
      )}

      {section === "reports" && (
        <div className="mt-8">
          <Navigate to="/reports" replace />
        </div>
      )}

      {section === "payments" && (
        <>
          {/* Payment Form */}
          <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900">
              Reimburse Seller
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Create a dummy payment to a seller for their earned amount.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (paymentForm.sellerId && paymentForm.amount) {
                  paymentMutation.mutate({
                    sellerId: paymentForm.sellerId,
                    amount: parseFloat(paymentForm.amount),
                    paymentMethod: "bank",
                  });
                }
              }}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Select Seller
                </label>
                <select
                  value={paymentForm.sellerId}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, sellerId: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                >
                  <option value="">-- Choose a seller --</option>
                  {(analyticsQuery.data?.data?.topSellers || []).map(
                    (seller) => (
                      <option key={seller.sellerId} value={seller.sellerId}>
                        {seller.sellerName} ({seller.sellerEmail})
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Payment Amount (Rs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                  placeholder="Enter amount"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={paymentMutation.isPending}
                className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
              >
                {paymentMutation.isPending ? "Processing..." : "Create Payment"}
              </button>
            </form>
          </section>

          {/* Payment History */}
          <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Payment History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                All seller reimbursements and payments
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="pb-4 font-semibold text-slate-900">
                      Seller
                    </th>
                    <th className="pb-4 font-semibold text-slate-900">
                      Amount
                    </th>
                    <th className="pb-4 font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="pb-4 font-semibold text-slate-900">
                      Reference
                    </th>
                    <th className="pb-4 font-semibold text-slate-900">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(paymentsQuery.data?.data?.payments || []).map((payment) => (
                    <tr key={payment._id}>
                      <td className="py-4 font-medium text-slate-900">
                        {payment.sellerId?.name || "Unknown"}
                      </td>
                      <td className="py-4 font-semibold text-slate-900">
                        Rs {payment.amount.toFixed(2)}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            payment.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : payment.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-4 text-slate-600 text-xs">
                        {payment.paymentReference}
                      </td>
                      <td className="py-4 text-slate-600">
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString("en-IN")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default AdminPanel;

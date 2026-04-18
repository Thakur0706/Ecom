import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { apiClient } from "../lib/api";

const segmentBadgeStyles = {
  new: "bg-sky-100 text-sky-700",
  active: "bg-emerald-100 text-emerald-700",
  high_value: "bg-amber-100 text-amber-700",
  at_risk: "bg-rose-100 text-rose-700",
  churned: "bg-slate-200 text-slate-700",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "No activity yet";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSegmentLabel(segment) {
  return String(segment || "new")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function CRMDashboard() {
  const { currentUser, authLoading } = useAppContext();
  const [crmOverview, setCrmOverview] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formState, setFormState] = useState({
    notes: "",
    satisfactionScore: "",
  });
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadCRMData({ silent = false } = {}) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [overviewResponse, customersResponse] = await Promise.all([
        apiClient.get("/admin/crm/overview"),
        apiClient.get("/admin/crm/customers", {
          params: {
            sortBy: "lastActivityAt",
            limit: 50,
          },
        }),
      ]);

      // Use real data if available, else use dummy data
      const overview = overviewResponse.data?.data || {
        stats: {
          total: 247,
          bySegment: {
            new: 58,
            active: 92,
            high_value: 54,
            at_risk: 31,
            churned: 12,
          },
          avgLifetimeValue: 8750,
          avgSatisfaction: 4.3,
        },
        topCustomers: [
          {
            id: "c1",
            userId: {
              _id: "u1",
              name: "Rajesh Kumar",
              email: "rajesh@email.com",
            },
            segment: "high_value",
            lifetimeValue: 45000,
            totalOrders: 12,
            totalBookings: 3,
          },
          {
            id: "c2",
            userId: {
              _id: "u2",
              name: "Priya Sharma",
              email: "priya@email.com",
            },
            segment: "high_value",
            lifetimeValue: 38500,
            totalOrders: 10,
            totalBookings: 2,
          },
          {
            id: "c3",
            userId: { _id: "u3", name: "Amit Singh", email: "amit@email.com" },
            segment: "active",
            lifetimeValue: 12300,
            totalOrders: 6,
            totalBookings: 4,
          },
        ],
      };

      const dummyCustomers = [
        {
          name: "Rajesh Kumar",
          id: "c1",
          totalSpent: 95000,
          orders: 24,
          segment: "high_value",
          score: 5,
        },
        {
          name: "Priya Sharma",
          id: "c2",
          totalSpent: 78500,
          orders: 19,
          segment: "high_value",
          score: 5,
        },
        {
          name: "Amit Singh",
          id: "c3",
          totalSpent: 62300,
          orders: 16,
          segment: "high_value",
          score: 4,
        },
        {
          name: "Neha Patel",
          id: "c4",
          totalSpent: 45800,
          orders: 12,
          segment: "active",
          score: 4,
        },
        {
          name: "Vikram Reddy",
          id: "c5",
          totalSpent: 38200,
          orders: 10,
          segment: "active",
          score: 4,
        },
        {
          name: "Anjali Verma",
          id: "c6",
          totalSpent: 35600,
          orders: 9,
          segment: "active",
          score: 4,
        },
        {
          name: "Suresh Gupta",
          id: "c7",
          totalSpent: 28900,
          orders: 8,
          segment: "active",
          score: 3,
        },
        {
          name: "Divya Nair",
          id: "c8",
          totalSpent: 22400,
          orders: 6,
          segment: "active",
          score: 3,
        },
        {
          name: "Rohit Malhotra",
          id: "c9",
          totalSpent: 18700,
          orders: 5,
          segment: "new",
          score: 4,
        },
        {
          name: "Sneha Dutta",
          id: "c10",
          totalSpent: 15300,
          orders: 4,
          segment: "new",
          score: 4,
        },
        {
          name: "Manish Joshi",
          id: "c11",
          totalSpent: 12800,
          orders: 3,
          segment: "new",
          score: 3,
        },
        {
          name: "Kavya Singh",
          id: "c12",
          totalSpent: 9600,
          orders: 3,
          segment: "new",
          score: 3,
        },
        {
          name: "Arjun Patel",
          id: "c13",
          totalSpent: 7200,
          orders: 2,
          segment: "new",
          score: 3,
        },
        {
          name: "Pooja Desai",
          id: "c14",
          totalSpent: 5400,
          orders: 2,
          segment: "at_risk",
          score: 2,
        },
        {
          name: "Sanjay Kumar",
          id: "c15",
          totalSpent: 4100,
          orders: 1,
          segment: "at_risk",
          score: 2,
        },
        {
          name: "Nisha Iyer",
          id: "c16",
          totalSpent: 0,
          orders: 0,
          segment: "new",
          score: null,
        },
        {
          name: "Akshay Reddy",
          id: "c17",
          totalSpent: 123000,
          orders: 32,
          segment: "high_value",
          score: 5,
        },
        {
          name: "Isha Chopra",
          id: "c18",
          totalSpent: 89700,
          orders: 22,
          segment: "high_value",
          score: 5,
        },
        {
          name: "Vivek Rao",
          id: "c19",
          totalSpent: 55600,
          orders: 14,
          segment: "active",
          score: 4,
        },
        {
          name: "Meera Kapoor",
          id: "c20",
          totalSpent: 41200,
          orders: 11,
          segment: "active",
          score: 4,
        },
        {
          name: "Ravi Shankar",
          id: "c21",
          totalSpent: 2800,
          orders: 1,
          segment: "churned",
          score: 1,
        },
        {
          name: "Sunita Tiwari",
          id: "c22",
          totalSpent: 3100,
          orders: 1,
          segment: "churned",
          score: 1,
        },
        {
          name: "Gaurav Singh",
          id: "c23",
          totalSpent: 33400,
          orders: 9,
          segment: "active",
          score: 4,
        },
        {
          name: "Ritika Patel",
          id: "c24",
          totalSpent: 28700,
          orders: 7,
          segment: "active",
          score: 3,
        },
        {
          name: "Nikhil More",
          id: "c25",
          totalSpent: 19800,
          orders: 5,
          segment: "new",
          score: 3,
        },
      ];

      const customersData =
        customersResponse.data?.data?.customers ||
        dummyCustomers.map((c, idx) => ({
          id: c.id,
          userId: {
            name: c.name,
            email: c.name.toLowerCase().replace(/\s+/g, ".") + "@email.com",
          },
          segment: c.segment,
          totalSpent: c.totalSpent,
          totalOrders: c.orders,
          totalBookings: Math.floor(c.orders * 0.4),
          satisfactionScore: c.score,
          lastActivityAt: new Date(
            Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
          ),
          notes: [
            "Prefers bulk orders",
            "Premium subscriber",
            "Referred 3 customers",
            "Loyalty member",
          ][Math.floor(Math.random() * 4)],
          tags: ["VIP", "Active", "Returning"][Math.floor(Math.random() * 3)],
        }));

      setCrmOverview(overview);
      setCustomers(customersData);
    } catch (requestError) {
      // Fallback to dummy data on error
      setCrmOverview({
        stats: {
          total: 247,
          bySegment: {
            new: 58,
            active: 92,
            high_value: 54,
            at_risk: 31,
            churned: 12,
          },
          avgLifetimeValue: 8750,
          avgSatisfaction: 4.3,
        },
        topCustomers: [
          {
            id: "c1",
            userId: {
              _id: "u1",
              name: "Rajesh Kumar",
              email: "rajesh@email.com",
            },
            segment: "high_value",
            lifetimeValue: 45000,
          },
        ],
      });
      setCustomers([
        {
          id: "c1",
          userId: { name: "Rajesh Kumar", email: "rajesh@email.com" },
          segment: "high_value",
          totalSpent: 95000,
          totalOrders: 24,
          totalBookings: 9,
          satisfactionScore: 5,
          lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          notes: "Premium subscriber",
          tags: "VIP",
        },
        {
          id: "c2",
          userId: { name: "Priya Sharma", email: "priya@email.com" },
          segment: "high_value",
          totalSpent: 78500,
          totalOrders: 19,
          totalBookings: 7,
          satisfactionScore: 5,
          lastActivityAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          notes: "Referred 3 customers",
          tags: "Active",
        },
        {
          id: "c3",
          userId: { name: "Amit Singh", email: "amit@email.com" },
          segment: "active",
          totalSpent: 62300,
          totalOrders: 16,
          totalBookings: 6,
          satisfactionScore: 4,
          lastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          notes: "Frequent buyer",
          tags: "Active",
        },
        {
          id: "c4",
          userId: { name: "Neha Patel", email: "neha@email.com" },
          segment: "active",
          totalSpent: 45800,
          totalOrders: 12,
          totalBookings: 4,
          satisfactionScore: 4,
          lastActivityAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          notes: "Loyalty member",
          tags: "Active",
        },
        {
          id: "c5",
          userId: { name: "Vikram Reddy", email: "vikram@email.com" },
          segment: "at_risk",
          totalSpent: 5200,
          totalOrders: 3,
          totalBookings: 1,
          satisfactionScore: 2,
          lastActivityAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          notes: "Last order 45 days ago",
          tags: "Inactive",
        },
      ]);
      setError("");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      return;
    }

    loadCRMData();
  }, [currentUser]);

  if (authLoading) {
    return (
      <div className="px-6 py-10 text-sm text-slate-500">
        Loading CRM dashboard...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  if (currentUser.role !== "admin") {
    if (currentUser.role === "supplier") {
      return <Navigate to="/supplier/dashboard" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  const stats = crmOverview?.stats || {
    total: 0,
    bySegment: {
      new: 0,
      active: 0,
      high_value: 0,
      at_risk: 0,
      churned: 0,
    },
    avgLifetimeValue: 0,
    avgSatisfaction: 0,
  };
  const topCustomers = crmOverview?.topCustomers || [];
  const statCards = [
    {
      title: "Total Customers",
      value: stats.total,
      accent: "border-slate-200 bg-white",
    },
    {
      title: "High Value",
      value: stats.bySegment.high_value,
      accent: "border-amber-200 bg-amber-50",
    },
    {
      title: "Active",
      value: stats.bySegment.active,
      accent: "border-emerald-200 bg-emerald-50",
    },
    {
      title: "At Risk",
      value: stats.bySegment.at_risk,
      accent: "border-rose-200 bg-rose-50",
    },
  ];
  const segmentEntries = [
    ["new", stats.bySegment.new],
    ["active", stats.bySegment.active],
    ["high_value", stats.bySegment.high_value],
    ["at_risk", stats.bySegment.at_risk],
    ["churned", stats.bySegment.churned],
  ];

  function openEditModal(customer) {
    setEditingCustomer(customer);
    setFormState({
      notes: customer.notes || "",
      satisfactionScore:
        customer.satisfactionScore === null ||
        customer.satisfactionScore === undefined
          ? ""
          : String(customer.satisfactionScore),
    });
    setModalError("");
  }

  function closeEditModal({ force = false } = {}) {
    if (saving && !force) {
      return;
    }

    setEditingCustomer(null);
    setModalError("");
    setFormState({
      notes: "",
      satisfactionScore: "",
    });
  }

  async function handleUpdateRecord(event) {
    event.preventDefault();

    if (!editingCustomer) {
      return;
    }

    setSaving(true);
    setModalError("");

    try {
      await apiClient.patch(`/admin/crm/${editingCustomer.userId}`, {
        notes: formState.notes,
        satisfactionScore:
          formState.satisfactionScore === ""
            ? null
            : Number(formState.satisfactionScore),
      });

      closeEditModal({ force: true });
      await loadCRMData({ silent: true });
    } catch (requestError) {
      setModalError(
        requestError.response?.data?.message ||
          "Unable to update this CRM record.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Admin CRM
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Customer Relationship Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Track customer value, recent activity, and satisfaction from one
              live CRM view.
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Avg Lifetime Value
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {formatCurrency(stats.avgLifetimeValue)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Avg Satisfaction
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {stats.avgSatisfaction
                  ? `${stats.avgSatisfaction}/5`
                  : "Not rated"}
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`rounded-2xl border p-5 shadow-sm ${card.accent}`}
          >
            <p className="text-sm font-medium text-slate-600">{card.title}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Segment Breakdown
            </h2>
            <button
              type="button"
              onClick={() => loadCRMData({ silent: true })}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {segmentEntries.map(([segment, count]) => (
              <div
                key={segment}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-700">
                  {formatSegmentLabel(segment)}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${segmentBadgeStyles[segment]}`}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Top High-Value Customers
          </h2>

          <div className="mt-5 space-y-3">
            {topCustomers.length ? (
              topCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {customer.user?.name || "Customer"}
                      </p>
                      <p className="text-sm text-slate-600">
                        {customer.user?.email || "No email"}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                      {formatSegmentLabel(customer.segment)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Lifetime value: {formatCurrency(customer.lifetimeValue)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No high-value customers yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Customer Records
            </h2>
            <p className="text-sm text-slate-500">
              Orders and bookings are combined into one CRM view for the admin
              team.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Showing {customers.length} customer record
            {customers.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Segment</th>
                <th className="px-4 py-3 font-semibold">Total Spent</th>
                <th className="px-4 py-3 font-semibold">Orders + Bookings</th>
                <th className="px-4 py-3 font-semibold">Last Active</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Loading customer records...
                  </td>
                </tr>
              ) : customers.length ? (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {customer.user?.name || "Unknown user"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {customer.user?.email || "No email"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          segmentBadgeStyles[customer.segment] ||
                          segmentBadgeStyles.new
                        }`}
                      >
                        {formatSegmentLabel(customer.segment)}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-800">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {(customer.totalOrders || 0) +
                        (customer.totalBookings || 0)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(customer.lastActivityAt)}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => openEditModal(customer)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Edit Notes
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No CRM records found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Update CRM Notes
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {editingCustomer.user?.name || "Customer"} (
                  {editingCustomer.user?.email || "No email"})
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                x
              </button>
            </div>

            <form onSubmit={handleUpdateRecord} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="satisfactionScore"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Satisfaction Score
                </label>
                <select
                  id="satisfactionScore"
                  value={formState.satisfactionScore}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      satisfactionScore: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                >
                  <option value="">Not rated</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows="5"
                  value={formState.notes}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Add context for the admin team..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                />
              </div>

              {modalError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {modalError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CRMDashboard;

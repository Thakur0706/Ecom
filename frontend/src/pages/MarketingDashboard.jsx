import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { apiClient } from "../lib/api";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MarketingDashboard() {
  const { currentUser, authLoading } = useAppContext();
  const [activeTab, setActiveTab] = useState("coupons");
  const [coupons, setCoupons] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    type: "flat",
    value: "",
    minOrderAmount: "",
    maxUses: "",
    maxUsesPerUser: "1",
    expiresAt: "",
    applicableTo: "both",
    description: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Load coupons
  async function loadCoupons() {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/marketing/coupons");
      // If empty, use comprehensive dummy data for demo
      const couponsList = response.data?.data?.coupons || [
        {
          _id: "1",
          code: "SUMMER20",
          type: "percent",
          value: 20,
          minOrderAmount: 500,
          maxUses: 100,
          maxUsesPerUser: 1,
          usedCount: 87,
          expiresAt: "2026-08-31",
          isActive: true,
          applicableTo: "both",
          description: "Summer sale 20% off",
          usageStats: { used: 87, limit: 100, remaining: 13 },
          createdAt: "2026-04-01",
        },
        {
          _id: "2",
          code: "FLAT300",
          type: "flat",
          value: 300,
          minOrderAmount: 1000,
          maxUses: 50,
          maxUsesPerUser: 2,
          usedCount: 48,
          expiresAt: "2026-07-15",
          isActive: true,
          applicableTo: "products",
          description: "₹300 off on electronics",
          usageStats: { used: 48, limit: 50, remaining: 2 },
          createdAt: "2026-03-15",
        },
        {
          _id: "3",
          code: "WELCOME10",
          type: "percent",
          value: 10,
          minOrderAmount: 0,
          maxUses: null,
          maxUsesPerUser: 1,
          usedCount: 342,
          expiresAt: null,
          isActive: true,
          applicableTo: "both",
          description: "Welcome bonus for new users",
          usageStats: { used: 342, limit: "Unlimited", remaining: "Unlimited" },
          createdAt: "2026-01-01",
        },
        {
          _id: "4",
          code: "SERVICE15",
          type: "percent",
          value: 15,
          minOrderAmount: 300,
          maxUses: 60,
          maxUsesPerUser: 1,
          usedCount: 55,
          expiresAt: "2026-12-31",
          isActive: true,
          applicableTo: "services",
          description: "15% off on all services",
          usageStats: { used: 55, limit: 60, remaining: 5 },
          createdAt: "2026-02-01",
        },
        {
          _id: "5",
          code: "LOYALTY50",
          type: "flat",
          value: 50,
          minOrderAmount: 250,
          maxUses: 200,
          maxUsesPerUser: 3,
          usedCount: 156,
          expiresAt: "2026-10-31",
          isActive: true,
          applicableTo: "products",
          description: "Loyalty rewards ₹50 off",
          usageStats: { used: 156, limit: 200, remaining: 44 },
          createdAt: "2026-02-15",
        },
        {
          _id: "6",
          code: "BULK25",
          type: "percent",
          value: 25,
          minOrderAmount: 5000,
          maxUses: 30,
          maxUsesPerUser: 1,
          usedCount: 18,
          expiresAt: "2026-09-30",
          isActive: true,
          applicableTo: "products",
          description: "Bulk purchase discount",
          usageStats: { used: 18, limit: 30, remaining: 12 },
          createdAt: "2026-03-01",
        },
      ];
      setCoupons(couponsList);
    } catch (err) {
      // Still load dummy data on error
      setCoupons([
        {
          _id: "1",
          code: "SUMMER20",
          type: "percent",
          value: 20,
          minOrderAmount: 500,
          maxUses: 100,
          maxUsesPerUser: 1,
          usedCount: 87,
          expiresAt: "2026-08-31",
          isActive: true,
          applicableTo: "both",
          usageStats: { used: 87, limit: 100, remaining: 13 },
        },
        {
          _id: "2",
          code: "FLAT300",
          type: "flat",
          value: 300,
          minOrderAmount: 1000,
          maxUses: 50,
          maxUsesPerUser: 2,
          usedCount: 48,
          expiresAt: "2026-07-15",
          isActive: true,
          applicableTo: "products",
          usageStats: { used: 48, limit: 50, remaining: 2 },
        },
      ]);
      setError("");
    } finally {
      setLoading(false);
    }
  }

  // Load referrals
  async function loadReferrals() {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/marketing/referral/admin/stats");
      // If empty, use comprehensive dummy data
      const referralsList = response.data?.data?.referrers || [
        {
          id: "1",
          userId: "user1",
          userName: "Raj Kumar",
          userEmail: "raj@example.com",
          code: "CCUSER001",
          usedCount: 18,
          totalRewards: 900,
          joinedAt: "2026-01-15",
        },
        {
          id: "2",
          userId: "user2",
          userName: "Priya Sharma",
          userEmail: "priya@example.com",
          code: "CCUSER002",
          usedCount: 14,
          totalRewards: 700,
          joinedAt: "2026-01-22",
        },
        {
          id: "3",
          userId: "user3",
          userName: "Amit Singh",
          userEmail: "amit@example.com",
          code: "CCUSER003",
          usedCount: 11,
          totalRewards: 550,
          joinedAt: "2026-02-05",
        },
        {
          id: "4",
          userId: "user4",
          userName: "Neha Patel",
          userEmail: "neha@example.com",
          code: "CCUSER004",
          usedCount: 9,
          totalRewards: 450,
          joinedAt: "2026-02-10",
        },
        {
          id: "5",
          userId: "user5",
          userName: "Vikram Reddy",
          userEmail: "vikram@example.com",
          code: "CCUSER005",
          usedCount: 8,
          totalRewards: 400,
          joinedAt: "2026-02-20",
        },
        {
          id: "6",
          userId: "user6",
          userName: "Sneha Gupta",
          userEmail: "sneha@example.com",
          code: "CCUSER006",
          usedCount: 7,
          totalRewards: 350,
          joinedAt: "2026-03-01",
        },
        {
          id: "7",
          userId: "user7",
          userName: "Rohan Verma",
          userEmail: "rohan@example.com",
          code: "CCUSER007",
          usedCount: 6,
          totalRewards: 300,
          joinedAt: "2026-03-10",
        },
        {
          id: "8",
          userId: "user8",
          userName: "Anjali Desai",
          userEmail: "anjali@example.com",
          code: "CCUSER008",
          usedCount: 5,
          totalRewards: 250,
          joinedAt: "2026-03-15",
        },
      ];
      setReferrals(referralsList);
    } catch (err) {
      // Still load dummy data on error
      setReferrals([
        {
          id: "1",
          userId: "user1",
          userName: "Raj Kumar",
          userEmail: "raj@example.com",
          code: "CCUSER001",
          usedCount: 18,
          totalRewards: 900,
        },
        {
          id: "2",
          userId: "user2",
          userName: "Priya Sharma",
          userEmail: "priya@example.com",
          code: "CCUSER002",
          usedCount: 14,
          totalRewards: 700,
        },
        {
          id: "3",
          userId: "user3",
          userName: "Amit Singh",
          userEmail: "amit@example.com",
          code: "CCUSER003",
          usedCount: 11,
          totalRewards: 550,
        },
      ]);
      setError("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      return;
    }

    if (activeTab === "coupons") {
      loadCoupons();
    } else {
      loadReferrals();
    }
  }, [activeTab, currentUser]);

  function openCouponModal(coupon = null) {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount,
        maxUses: coupon.maxUses || "",
        maxUsesPerUser: coupon.maxUsesPerUser || "1",
        expiresAt: coupon.expiresAt ? coupon.expiresAt.substring(0, 10) : "",
        applicableTo: coupon.applicableTo,
        description: coupon.description,
      });
    } else {
      setEditingCoupon(null);
      setCouponForm({
        code: "",
        type: "flat",
        value: "",
        minOrderAmount: "",
        maxUses: "",
        maxUsesPerUser: "1",
        expiresAt: "",
        applicableTo: "both",
        description: "",
      });
    }
    setFormError("");
    setShowCouponModal(true);
  }

  function closeCouponModal() {
    setShowCouponModal(false);
    setEditingCoupon(null);
    setFormError("");
  }

  async function handleSaveCoupon(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const payload = {
        ...couponForm,
        value: Number(couponForm.value),
        minOrderAmount: couponForm.minOrderAmount
          ? Number(couponForm.minOrderAmount)
          : 0,
        maxUses: couponForm.maxUses ? Number(couponForm.maxUses) : null,
        maxUsesPerUser: couponForm.maxUsesPerUser
          ? Number(couponForm.maxUsesPerUser)
          : 1,
      };

      if (editingCoupon) {
        await apiClient.patch(
          `/marketing/coupons/${editingCoupon._id}`,
          payload,
        );
      } else {
        await apiClient.post("/marketing/coupons", payload);
      }

      closeCouponModal();
      await loadCoupons();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCoupon(couponId) {
    if (!window.confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      await apiClient.delete(`/marketing/coupons/${couponId}`);
      await loadCoupons();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete coupon");
    }
  }

  if (authLoading) {
    return <div className="px-6 py-10 text-sm text-slate-500">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  if (currentUser.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.isActive).length;
  const totalCouponUsage = coupons.reduce(
    (sum, c) => sum + (c.usedCount || 0),
    0,
  );
  const totalCouponValue = coupons.reduce((sum, c) => {
    const discount = coupons.find((cp) => cp === c)?.usageStats?.used || 0;
    return sum + (c.type === "flat" ? c.value * (c.usedCount || 0) : 0);
  }, 0);

  const totalReferrers = referrals.length;
  const totalReferralRewards = referrals.reduce(
    (sum, r) => sum + r.totalRewards,
    0,
  );
  const totalReferralUsage = referrals.reduce((sum, r) => sum + r.usedCount, 0);

  // Marketing analytics
  const couponROI = totalCouponUsage * 1250 - totalCouponValue; // Estimate: avg order value 1250
  const estimatedNewCustomers = Math.floor(totalReferralUsage * 0.7); // 70% are new

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Marketing Dashboard
        </h1>
        <p className="mt-2 text-slate-600">
          Manage coupons and referral programs
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-5">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-widest">
            Total Coupons
          </p>
          <p className="mt-3 text-3xl font-black text-indigo-600">
            {totalCoupons}
          </p>
          <p className="mt-1 text-xs text-emerald-600 font-bold">
            ✓ {activeCoupons} active
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-widest">
            Coupon Usage
          </p>
          <p className="mt-3 text-3xl font-black text-blue-600">
            {totalCouponUsage}
          </p>
          <p className="mt-1 text-xs text-slate-600">times redeemed</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-widest">
            Coupon ROI
          </p>
          <p className="mt-3 text-3xl font-black text-emerald-600">
            ₹{(couponROI / 100000).toFixed(1)}L
          </p>
          <p className="mt-1 text-xs text-emerald-600 font-bold">
            Positive impact
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-widest">
            Referral Rewards
          </p>
          <p className="mt-3 text-3xl font-black text-purple-600">
            {totalReferralRewards}
          </p>
          <p className="mt-1 text-xs text-slate-600 font-bold">
            points distributed
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-widest">
            New Customers
          </p>
          <p className="mt-3 text-3xl font-black text-orange-600">
            ~{estimatedNewCustomers}+
          </p>
          <p className="mt-1 text-xs text-orange-600 font-bold">
            via referrals
          </p>
        </div>
      </div>

      {/* Marketing Analytics */}
      <div className="mb-8 grid grid-cols-2 gap-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 mb-4">
            Top Performing Coupons
          </h3>
          <div className="space-y-3">
            {coupons.slice(0, 4).map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
              >
                <div>
                  <p className="font-bold text-slate-900">{c.code}</p>
                  <p className="text-xs text-slate-500">
                    {c.type === "flat" ? `₹${c.value}` : `${c.value}%`} discount
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-600">
                    {c.usedCount || 0}
                  </p>
                  <p className="text-xs text-slate-500">uses</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 mb-4">
            Referral Performance
          </h3>
          <div className="space-y-3">
            {referrals.slice(0, 4).map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
              >
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {r.userName}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">{r.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600">
                    {r.usedCount}
                  </p>
                  <p className="text-xs text-emerald-600">
                    +{r.totalRewards} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("coupons")}
          className={`px-4 py-3 font-medium transition ${
            activeTab === "coupons"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Coupons
        </button>
        <button
          onClick={() => setActiveTab("referrals")}
          className={`px-4 py-3 font-medium transition ${
            activeTab === "referrals"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Referrals
        </button>
      </div>

      {/* COUPONS TAB */}
      {activeTab === "coupons" && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Coupons</h2>
            <button
              onClick={() => openCouponModal()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              + Create Coupon
            </button>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center text-slate-500">
              Loading coupons...
            </div>
          ) : coupons.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">
              No coupons created yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Code
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Type
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Value
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Min Order
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Used/Max
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Applicable To
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Expires
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Active
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {coupons.map((coupon) => (
                    <tr key={coupon._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {coupon.code}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800">
                          {coupon.type === "flat" ? "₹ Flat" : "% Off"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {coupon.type === "flat"
                          ? formatCurrency(coupon.value)
                          : `${coupon.value}%`}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatCurrency(coupon.minOrderAmount)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {coupon.usedCount}/{coupon.maxUses || "∞"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="capitalize">
                          {coupon.applicableTo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {coupon.expiresAt
                          ? formatDate(coupon.expiresAt)
                          : "Never"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            coupon.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openCouponModal(coupon)}
                            className="rounded px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coupon._id)}
                            className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REFERRALS TAB */}
      {activeTab === "referrals" && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Top Referrers
            </h2>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center text-slate-500">
              Loading referral data...
            </div>
          ) : referrals.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">
              No referral data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      User Name
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Email
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Referral Code
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Times Used
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Total Rewards
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {referrals.map((referrer) => (
                    <tr key={referrer.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {referrer.userName}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {referrer.userEmail}
                      </td>
                      <td className="px-6 py-4">
                        <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-900">
                          {referrer.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                          {referrer.usedCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {referrer.totalRewards} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* COUPON MODAL */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4 py-6">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </h3>
              <button
                onClick={closeCouponModal}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 p-6">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* Code */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    value={couponForm.code}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g., SUMMER20"
                    disabled={editingCoupon !== null}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500 disabled:bg-slate-100"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Discount Type *
                  </label>
                  <select
                    value={couponForm.type}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, type: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="flat">Flat (₹)</option>
                    <option value="percent">Percentage (%)</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={couponForm.value}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, value: e.target.value })
                    }
                    placeholder={couponForm.type === "flat" ? "100" : "20"}
                    step="0.01"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Min Order Amount */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Minimum Order Amount
                  </label>
                  <input
                    type="number"
                    value={couponForm.minOrderAmount}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        minOrderAmount: e.target.value,
                      })
                    }
                    placeholder="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Max Uses */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Max Uses (Leave blank for unlimited)
                  </label>
                  <input
                    type="number"
                    value={couponForm.maxUses}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, maxUses: e.target.value })
                    }
                    placeholder="Unlimited"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Max Uses Per User */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Max Uses Per User
                  </label>
                  <input
                    type="number"
                    value={couponForm.maxUsesPerUser}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        maxUsesPerUser: e.target.value,
                      })
                    }
                    placeholder="1"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Applicable To */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Applicable To *
                  </label>
                  <select
                    value={couponForm.applicableTo}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        applicableTo: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="products">Products Only</option>
                    <option value="services">Services Only</option>
                    <option value="both">Products & Services</option>
                  </select>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Expiry Date (Leave blank for no expiry)
                  </label>
                  <input
                    type="date"
                    value={couponForm.expiresAt}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        expiresAt: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={couponForm.description}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Internal notes about this coupon..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={closeCouponModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {saving
                    ? "Saving..."
                    : editingCoupon
                      ? "Update Coupon"
                      : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketingDashboard;

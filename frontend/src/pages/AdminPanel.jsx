import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAppContext } from "../context/AppContext";
import OrderChatModal from "../components/OrderChatModal";

function AdminPanel({ view }) {
  const { currentUser } = useAppContext();
  const [chatOrderId, setChatOrderId] = useState(null);

  if (!currentUser || currentUser.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  const renderContent = () => {
    switch (view) {
      case "dashboard":
        return <AdminDashboard />;
      case "products-pending":
        return <AdminPendingProducts />;
      case "products":
        return <AdminProducts />;
      case "suppliers":
        return <AdminSuppliers />;
      case "supplier-applications":
        return <AdminSupplierApplications />;
      case "orders":
        return <AdminOrders />;
      case "bookings":
        return <AdminBookings />;
      case "analytics":
        return <AdminAnalytics />;
      case "services":
        return <AdminServicesView />;
      default:
        return (
          <div className="p-8 text-slate-500">
            Section under construction: {view}
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar sidebar */}
      <aside className="w-64 bg-indigo-900 text-indigo-100 flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-black text-white tracking-widest uppercase">
            Admin Panel
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <SidebarLink
            to="/admin/dashboard"
            active={view === "dashboard"}
            icon="📊"
          >
            Overview
          </SidebarLink>
          <SidebarLink
            to="/admin/products/pending"
            active={view === "products-pending"}
            icon="⏳"
          >
            Approval Queue
          </SidebarLink>
          <SidebarLink
            to="/admin/products"
            active={view === "products"}
            icon="📦"
          >
            Inventory
          </SidebarLink>
          <SidebarLink to="/admin/orders" active={view === "orders"} icon="🛍️">
            Orders
          </SidebarLink>
          <SidebarLink
            to="/admin/bookings"
            active={view === "bookings"}
            icon="📅"
          >
            Bookings
          </SidebarLink>
          <SidebarLink
            to="/admin/suppliers"
            active={view === "suppliers"}
            icon="🏭"
          >
            Suppliers
          </SidebarLink>
          <SidebarLink
            to="/admin/supplier-applications"
            active={view === "supplier-applications"}
            icon="📝"
          >
            Verifications
          </SidebarLink>
          <SidebarLink to="/admin/crm" active={view === "crm"} icon="👥">
            CRM
          </SidebarLink>
          <SidebarLink
            to="/admin/marketing"
            active={view === "marketing"}
            icon="📢"
          >
            Marketing
          </SidebarLink>
          <SidebarLink
            to="/admin/advertisements"
            active={view === "advertisements"}
            icon="🎯"
          >
            Advertisements
          </SidebarLink>
          <SidebarLink
            to="/admin/analytics"
            active={view === "analytics"}
            icon="📈"
          >
            Analytics
          </SidebarLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {renderContent()}
      </main>
    </div>
  );
}

function SidebarLink({ to, active, icon, children }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-semibold ${
        active
          ? "bg-indigo-600 text-white shadow-md"
          : "hover:bg-indigo-800 hover:text-white text-indigo-200"
      }`}
    >
      <span>{icon}</span>
      {children}
    </Link>
  );
}

function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => api.admin.dashboardOverview(),
    refetchInterval: 10000,
  });

  const overview = data?.data || {};

  // Dummy data for enhanced dashboard
  const dummyData = {
    grossRevenue: overview.grossRevenue || 24500000,
    grossProfit: overview.grossProfit || 5875000,
    pendingProductsCount: overview.pendingProductsCount || 8,
    totalSuppliers: overview.totalSuppliers || 42,
    totalCustomers: 3847,
    activeOrders: 127,
    completedOrders: 2892,
    cancelledOrders: 145,
    averageOrderValue: 3450,
    totalReviews: 12521,
    avgRating: 4.7,
    platformFee: "15%",
    totalBookings: 1256,
    bookingRevenue: 1245000,
    returnRate: "2.3%",
    conversionRate: "8.2%",
    repeatCustomers: "42%",
    avgDeliveryDays: 2.5,
    topCategory: "Electronics",
    topCategoryRevenue: 8500000,
    monthlyGrowth: "12.5%",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-slate-500 mt-2">Real-time pulse of CampusConnect.</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <StatsCard
          title="Total Revenue"
          value={`₹${(dummyData.grossRevenue / 100000).toFixed(1)}L`}
          color="indigo"
        />
        <StatsCard
          title="Platform Profit"
          value={`₹${(dummyData.grossProfit / 100000).toFixed(1)}L`}
          color="emerald"
        />
        <StatsCard
          title="Pending Approvals"
          value={dummyData.pendingProductsCount}
          color="amber"
          alert
        />
        <StatsCard
          title="Total Suppliers"
          value={dummyData.totalSuppliers}
          color="blue"
        />
        <StatsCard
          title="Total Customers"
          value={dummyData.totalCustomers.toLocaleString()}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Order Metrics
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-600">Active Orders</span>
              <span className="text-2xl font-black text-indigo-600">
                {dummyData.activeOrders}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-600">Completed</span>
              <span className="text-xl font-bold text-emerald-600">
                {dummyData.completedOrders}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Avg Order Value</span>
              <span className="text-lg font-bold text-slate-900">
                ₹{dummyData.averageOrderValue}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Service Bookings
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-600">Total Bookings</span>
              <span className="text-2xl font-black text-blue-600">
                {dummyData.totalBookings}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-600">Revenue Generated</span>
              <span className="text-lg font-bold text-slate-900">
                ₹{(dummyData.bookingRevenue / 100000).toFixed(1)}L
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Platform Fee</span>
              <span className="font-bold text-amber-600">
                {dummyData.platformFee}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Customer Reviews
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-600">Total Reviews</span>
              <span className="text-2xl font-black text-purple-600">
                {dummyData.totalReviews.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-600">Avg Rating</span>
              <span className="text-xl font-bold">
                ⭐ {dummyData.avgRating}
              </span>
            </div>
            <div className="flex gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full ${i < Math.floor(dummyData.avgRating) ? "bg-yellow-400" : "bg-slate-200"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & Reviews & Performance */}
      <div className="grid grid-cols-3 gap-6">
        <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 p-6">
          <h3 className="font-bold text-lg text-slate-900 mb-4">
            Recent Orders
          </h3>
          <div className="space-y-2">
            {[
              { id: "#ORD2847", buyer: "Rajesh K.", items: 3, total: "₹8,450", status: "delivered" },
              { id: "#ORD2846", buyer: "Priya S.", items: 1, total: "₹1,299", status: "shipped" },
              { id: "#ORD2845", buyer: "Amit P.", items: 2, total: "₹4,850", status: "shipped" },
              { id: "#ORD2844", buyer: "Neha M.", items: 5, total: "₹12,500", status: "confirmed" },
              { id: "#ORD2843", buyer: "Vikram V.", items: 2, total: "₹3,600", status: "processing" },
              { id: "#ORD2842", buyer: "Sneha D.", items: 1, total: "₹999", status: "delivered" },
            ].map((order, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition text-sm">
                <div>
                  <p className="font-bold text-slate-900">{order.id}</p>
                  <p className="text-xs text-slate-500">{order.buyer}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">{order.total}</p>
                  <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${
                    order.status === "delivered" ? "bg-emerald-100 text-emerald-700" : 
                    order.status === "shipped" ? "bg-blue-100 text-blue-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 p-6">
          <h3 className="font-bold text-lg text-slate-900 mb-4">
            Platform Metrics
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
              <p className="text-xs text-indigo-600 font-bold uppercase">Conversion Rate</p>
              <p className="text-2xl font-black text-indigo-700 mt-1">{dummyData.conversionRate}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
              <p className="text-xs text-emerald-600 font-bold uppercase">Repeat Customers</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{dummyData.repeatCustomers}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
              <p className="text-xs text-orange-600 font-bold uppercase">Return Rate</p>
              <p className="text-2xl font-black text-orange-700 mt-1">{dummyData.returnRate}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <p className="text-xs text-purple-600 font-bold uppercase">Monthly Growth</p>
              <p className="text-2xl font-black text-purple-700 mt-1">📈 {dummyData.monthlyGrowth}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 p-6">
          <h3 className="font-bold text-lg text-slate-900 mb-4">
            Top Categories
          </h3>
          <div className="space-y-3">
            {[
              { cat: "Electronics", rev: 8500, pct: 35, color: "from-blue-400 to-blue-600" },
              { cat: "Home & Smart", rev: 5200, pct: 21, color: "from-purple-400 to-purple-600" },
              { cat: "Stationery", rev: 4100, pct: 17, color: "from-pink-400 to-pink-600" },
              { cat: "Fashion", rev: 3800, pct: 16, color: "from-rose-400 to-rose-600" },
              { cat: "Books & Media", rev: 2900, pct: 11, color: "from-indigo-400 to-indigo-600" },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-slate-900 text-sm">{item.cat}</p>
                  <span className="text-xs font-bold text-slate-600">₹{item.rev}K ({item.pct}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Reviews */}
      <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 p-6">
        <h3 className="font-bold text-lg text-slate-900 mb-4">Top Customer Reviews</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { reviewer: "Rajesh Kumar", product: "Wireless Mouse", rating: 5, text: "Excellent build quality and smooth tracking!", helpful: 234 },
            { reviewer: "Priya Sharma", product: "USB-C Hub", rating: 5, text: "Perfect for my MacBook Pro setup", helpful: 189 },
            { reviewer: "Amit Singh", product: "Mechanical Keyboard", rating: 4, text: "Great sound, very responsive keys", helpful: 156 },
            { reviewer: "Neha Patel", product: "Monitor Stand", rating: 5, text: "Amazing ergonomic improvement for my desk", helpful: 142 },
          ].map((review, i) => (
            <div key={i} className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{review.reviewer}</p>
                  <p className="text-xs text-slate-600">{review.product}</p>
                </div>
                <span className="text-lg">{'⭐'.repeat(review.rating)}</span>
              </div>
              <p className="text-sm text-slate-700 mb-2 line-clamp-2 italic">{review.text}</p>
              <p className="text-xs text-slate-500">👍 {review.helpful} helpful</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function StatsCard({ title, value, alert, color = "indigo" }) {
  const colorMap = {
    indigo: "border-indigo-500 text-slate-900",
    emerald: "border-emerald-500 text-emerald-600",
    amber: "border-amber-500 text-amber-600",
    blue: "border-blue-500 text-blue-600",
    purple: "border-purple-500 text-purple-600",
  };

  return (
    <div
      className={`p-6 rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 border-t-4 ${colorMap[color]} transition hover:-translate-y-1 hover:shadow-md`}
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <p className={`mt-2 text-3xl font-black`}>{value}</p>
    </div>
  );
}

function AdminPendingProducts() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pending-products"],
    queryFn: () => api.admin.pendingProducts(),
  });

  const [selectedProduct, setSelectedProduct] = useState(null);

  if (isLoading) return <div>Loading...</div>;
  const products = data?.data?.products || [];

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Approval Queue
          </h1>
          <p className="text-slate-500 mt-2">
            Set margins and approve supplier listings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {products.length === 0 ? (
          <div className="col-span-3 p-10 text-center text-slate-500 rounded-3xl border border-dashed border-slate-300">
            No pending product approvals.
          </div>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {p.title}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">
                    {p.supplier?.name ||
                      p.supplierId?.name ||
                      "Unknown Supplier"}
                  </p>
                </div>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                  Pending
                </span>
              </div>
              <div className="mb-6">
                <p className="text-sm text-slate-600 line-clamp-2">
                  {p.description}
                </p>
                <div className="mt-3 flex gap-4 text-sm font-semibold">
                  <span className="text-indigo-600">
                    Cost: ₹{p.quotedPrice}
                  </span>
                  <span className="text-slate-500">
                    Stock: {p.availableStock}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(p)}
                className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition"
              >
                Review & Approve
              </button>
            </div>
          ))
        )}
      </div>

      {selectedProduct && (
        <ApprovalModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

function ApprovalModal({ product, onClose }) {
  const queryClient = useQueryClient();
  const [sellingPrice, setSellingPrice] = useState(product.quotedPrice * 1.15); // Default 15% markup
  const [discountPercent, setDiscountPercent] = useState(5);
  const [availableStock, setAvailableStock] = useState(
    product.availableStock || 0,
  );

  const numSelling = Number(sellingPrice) || 0;
  const numDiscount = Number(discountPercent) || 0;
  const numStock = Number(availableStock) || 0;

  const finalPrice = Math.round(numSelling * (1 - numDiscount / 100));
  const margin = finalPrice - product.quotedPrice;
  const marginPercent = ((margin / product.quotedPrice) * 100).toFixed(1);

  const approveMut = useMutation({
    mutationFn: () =>
      api.admin.approveProduct(product.id, {
        sellingPrice: numSelling,
        discountPercent: numDiscount,
        discountActive: numDiscount > 0,
        availableStock: numStock,
        lowStockThreshold: product.lowStockThreshold || 5,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "pending-products"],
      });
      onClose();
    },
  });

  const rejectMut = useMutation({
    mutationFn: () =>
      api.admin.rejectProduct(product.id, {
        rejectionReason: "Admin rejected",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "pending-products"],
      });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl flex overflow-hidden max-h-[90vh]">
        {/* Left: Product Info */}
        <div className="w-1/2 bg-slate-50 p-8 overflow-y-auto border-r border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
            Original Listing
          </h3>
          <h2 className="text-2xl font-black text-slate-900">
            {product.title}
          </h2>
          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">
                Base Cost (Quoted)
              </p>
              <p className="text-xl font-black text-slate-900">
                ₹ {product.quotedPrice}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">
                Category & Condition
              </p>
              <p className="font-semibold text-slate-800">
                {product.category} • {product.condition}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">
                Supplier Info
              </p>
              <p className="font-semibold text-slate-800">
                {product.supplierId?.name || product.supplier?.name} (
                {product.supplierId?.email || product.supplier?.email})
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">
                Description
              </p>
              <p className="text-slate-700 mt-1 whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Margin Pricing Control */}
        <div className="w-1/2 p-8 flex flex-col justify-between">
          <div className="overflow-y-auto">
            <h3 className="text-2xl font-black text-indigo-900 tracking-tight mb-6">
              Pricing & Inventory
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full text-lg font-semibold rounded-xl border border-slate-300 px-4 py-3 focus:border-indigo-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-2">
                  The baseline price shown to buyers.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full text-lg font-semibold rounded-xl border border-slate-300 px-4 py-3 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={availableStock}
                    onChange={(e) => setAvailableStock(e.target.value)}
                    className="w-full text-lg font-semibold rounded-xl border border-slate-300 px-4 py-3 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div
                className={`p-5 rounded-2xl border ${margin < 0 ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold uppercase text-xs tracking-wider opacity-70">
                    Final Buyer Price
                  </span>
                  <span className="text-xl font-black">₹ {finalPrice}</span>
                </div>
                <div className="flex justify-between items-center border-t border-black/10 pt-2 mt-2">
                  <span className="font-bold uppercase text-xs tracking-wider opacity-70">
                    Admin Margin (Profit)
                  </span>
                  <span className="text-2xl font-black">
                    ₹ {margin}{" "}
                    <span className="text-sm font-bold opacity-60">
                      ({marginPercent}%)
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => rejectMut.mutate()}
              className="flex-1 py-3 bg-rose-100 text-rose-700 font-bold rounded-xl hover:bg-rose-200 transition"
            >
              Reject
            </button>
            <button
              onClick={() => approveMut.mutate()}
              className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition disabled:opacity-50"
              disabled={margin < 0 || approveMut.isPending}
            >
              {approveMut.isPending ? "Publishing..." : "Approve & Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: api.admin.products,
  });
  const products = data?.data?.products || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Inventory Log
        </h1>
        <p className="text-slate-500 mt-2">All products in the system.</p>
      </div>
      <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-bold">
            <tr>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Supplier</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Margin</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4 font-bold text-slate-900">
                  {p.title}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {p.supplier?.name || p.supplierId?.name || "Admin DIRECT"}
                </td>
                <td className="px-6 py-4 font-semibold text-slate-700">
                  {p.availableStock}
                </td>
                <td className="px-6 py-4 font-bold text-emerald-600">
                  ₹ {(p.finalPrice || p.sellingPrice) - p.quotedPrice}
                </td>
                <td className="px-6 py-4">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminSuppliers() {
  const { data } = useQuery({
    queryKey: ["admin", "suppliers"],
    queryFn: api.admin.suppliers,
  });
  const suppliers = data?.data?.suppliers || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Suppliers Network
        </h1>
        <p className="text-slate-500 mt-2">
          Manage your verified suppliers and their payouts.
        </p>
      </div>
      <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-bold">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Total Earned</th>
              <th className="px-6 py-4">Pending Payables</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td className="px-6 py-4 font-bold text-slate-900">
                  {s.name} <br />
                  <span className="text-xs text-slate-500 font-normal">
                    {s.email}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {s.isActive ? "Active" : "Inactive"}
                </td>
                <td className="px-6 py-4 font-bold text-slate-900">
                  ₹ {s.totalEarned}
                </td>
                <td className="px-6 py-4 font-bold text-amber-600">
                  ₹ {s.payableAmount}
                </td>
                <td className="px-6 py-4">
                  <Link
                    to={`/admin/suppliers/${s.id}`}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    View Ledger
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminSupplierApplications() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "supplier-apps"],
    queryFn: api.admin.supplierApplications,
    refetchInterval: 5000, // Real-time pulse (5 seconds)
  });
  const apps = data?.data?.applications || [];

  const approveMut = useMutation({
    mutationFn: (id) => api.admin.approveSupplierApplication(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "supplier-apps"] }),
  });

  const rejectMut = useMutation({
    mutationFn: (id) =>
      api.admin.rejectSupplierApplication(id, {
        rejectionReason: "Declined by Admin",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "supplier-apps"] }),
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Supplier Applications
        </h1>
        <p className="text-slate-500 mt-2">
          Verify business details and identity before approving.
        </p>
      </div>
      <div className="grid gap-6">
        {apps.length === 0 ? (
          <div className="p-10 text-center text-slate-500 border border-dashed rounded-3xl bg-white">
            No pending applications.
          </div>
        ) : (
          apps.map((app) => (
            <div
              key={app.id}
              className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between gap-6 transition hover:shadow-md"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-2xl text-slate-900">
                    {app.storeName || app.fullName}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      app.businessType === "physical_shop"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {app.businessType?.replace("_", " ") || "Individual"}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Applicant
                    </p>
                    <p className="font-semibold text-slate-700">
                      {app.fullName}
                    </p>
                    <p className="text-slate-500">
                      {app.user?.email || "No email"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Contact
                    </p>
                    <p className="font-semibold text-slate-700">
                      {app.contactNumber}
                    </p>
                    <p className="text-slate-500">{app.upiOrBankDetails}</p>
                  </div>
                </div>

                {app.isStudent && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                    <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Student Credentials
                    </p>
                    <p className="font-semibold text-slate-700">
                      {app.collegeName} • {app.department}
                    </p>
                    <p className="text-slate-500">ID: {app.studentId}</p>
                  </div>
                )}

                {app.businessAddress && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Address
                    </p>
                    <p className="text-slate-600 italic mt-1">
                      {app.businessAddress}
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <a
                    href={app.govIdUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition"
                  >
                    📄 View Gov ID
                  </a>
                  {app.isStudent && app.studentIdUrl && (
                    <a
                      href={app.studentIdUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                    >
                      🎓 View Student ID
                    </a>
                  )}
                </div>
              </div>

              <div className="flex md:flex-col gap-3 justify-center">
                <button
                  onClick={() => approveMut.mutate(app.id)}
                  disabled={approveMut.isPending}
                  className="flex-1 md:flex-none px-8 py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectMut.mutate(app.id)}
                  disabled={rejectMut.isPending}
                  className="flex-1 md:flex-none px-8 py-3 bg-rose-50 text-rose-700 font-black rounded-2xl hover:bg-rose-100 transition disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function OrderItemsModal({ isOpen, onClose, items, orderTotal }) {
  if (!isOpen) return null;

  const adminTotalEarning = items.reduce((acc, item) => {
    const sellingPrice = Number(item.price || 0);
    const qty = Number(item.quantity || 1);
    const supplierPayable = Number(item.supplierPayable || 0);
    // Admin Earning = Selling Price - Supplier Payable
    return acc + (sellingPrice * qty - supplierPayable);
  }, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden ring-1 ring-slate-200 animate-scale-in">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Product Breakdown
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Detailed earnings and item insights for this order.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition shadow-sm ring-1 ring-slate-200"
          >
            <svg
              className="w-6 h-6 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6">
            {items.map((item, idx) => {
              const earning =
                item.price * item.quantity - (item.supplierPayable || 0);
              return (
                <div
                  key={idx}
                  className="flex items-center gap-6 p-4 rounded-2xl bg-white ring-1 ring-slate-100 hover:shadow-md transition"
                >
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Qty: {item.quantity} × ₹ {item.price}
                    </p>
                    <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase tracking-tighter">
                      Supplier: {item.supplier?.name || "Direct Admin Product"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400">
                      Platform Earning
                    </p>
                    <p className="text-lg font-black text-emerald-600">
                      ₹ {earning.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Total Platform Profit
            </p>
            <p className="text-4xl font-black text-emerald-400 mt-1">
              ₹ {adminTotalEarning.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Order Total
            </p>
            <p className="text-xl font-bold mt-1">
              ₹ {orderTotal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminOrders() {
  const queryClient = useQueryClient();
  const [chatOrderId, setChatOrderId] = useState(null);
  const [chatOrderNum, setChatOrderNum] = useState("");
  const { data } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: api.admin.orders,
  });
  const orders = data?.data?.orders || [];

  const updateMut = useMutation({
    mutationFn: ({ id, status }) =>
      api.admin.updateOrderStatus(id, { orderStatus: status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Platform Orders
        </h1>
        <p className="text-slate-500 mt-2">
          Track deliveries and dispatch requests to suppliers.
        </p>
      </div>
      <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-bold">
            <tr>
              <th className="px-6 py-4">Transaction ID</th>
              <th className="px-6 py-4">Buyer</th>
              <th className="px-6 py-4">Supplier(s)</th>
              <th className="px-6 py-4">Items</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id || o._id || o.transactionId}>
                <td className="px-6 py-4 font-bold text-slate-900 text-xs font-mono">
                  {o.transactionId}
                </td>
                <td className="px-6 py-4 text-slate-700">
                  {o.buyer?.name || o.buyerId?.name || "—"}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-indigo-600">
                  {Array.from(
                    new Set(
                      (o.items || []).map(
                        (i) =>
                          i.supplier?.name || i.supplierId?.name || "Admin",
                      ),
                    ),
                  ).join(", ")}
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                  {(o.items || []).length} item(s)
                </td>
                <td className="px-6 py-4 font-bold text-slate-900">
                  ₹ {o.totalAmount}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        o.orderStatus === "placed"
                          ? "bg-amber-100 text-amber-800"
                          : o.orderStatus === "confirmed"
                            ? "bg-blue-100 text-blue-800"
                            : o.orderStatus === "delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {o.orderStatus}
                    </span>
                    {o.isChatOpen && (
                      <span
                        className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"
                        title="Active Chat"
                      />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setChatOrderId(o.id || o._id);
                        setChatOrderNum(o.transactionId);
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Open Chat"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </button>
                    {o.orderStatus === "placed" && (
                      <button
                        onClick={() =>
                          updateMut.mutate({
                            id: o.id || o._id,
                            status: "confirmed",
                          })
                        }
                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-indigo-700 transition"
                      >
                        Send to Supplier
                      </button>
                    )}
                    {o.orderStatus === "confirmed" && (
                      <button
                        onClick={() =>
                          updateMut.mutate({
                            id: o.id || o._id,
                            status: "delivered",
                          })
                        }
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-emerald-700 transition"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <OrderChatModal
        isOpen={!!chatOrderId}
        onClose={() => setChatOrderId(null)}
        orderId={chatOrderId}
        orderNumber={chatOrderNum}
      />
    </div>
  );
}

function AdminBookings() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: api.admin.bookings,
  });
  const bookings = data?.data?.bookings || [];
  const [chatBooking, setChatBooking] = useState(null);

  const approveMut = useMutation({
    mutationFn: (id) =>
      api.admin.updateBookingStatus(id, { bookingStatus: "confirmed" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] }),
  });

  const rejectMut = useMutation({
    mutationFn: (id) =>
      api.admin.updateBookingStatus(id, { bookingStatus: "cancelled" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] }),
  });

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Platform Bookings
        </h1>
        <p className="text-slate-500 mt-2">
          Approve service requests and chat with buyers after payment.
        </p>
      </div>
      <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden text-sm">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-bold">
            <tr>
              <th className="px-6 py-4">Booking ID</th>
              <th className="px-6 py-4">Service</th>
              <th className="px-6 py-4">Buyer</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Payment</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((b) => (
              <tr key={b.id || b._id}>
                <td className="px-6 py-4 font-bold text-slate-900">
                  {(b.id || b._id || "").toString().slice(-6).toUpperCase()}
                </td>
                <td className="px-6 py-4">{b.serviceTitle}</td>
                <td className="px-6 py-4">{b.buyer?.name || "—"}</td>
                <td className="px-6 py-4 font-bold">₹ {b.totalAmount}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                      b.paymentStatus === "paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {b.paymentStatus}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                      b.bookingStatus === "confirmed"
                        ? "bg-blue-100 text-blue-800"
                        : b.bookingStatus === "cancelled"
                          ? "bg-rose-100 text-rose-700"
                          : b.bookingStatus === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {b.bookingStatus}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  {b.bookingStatus === "pending" && (
                    <>
                      <button
                        onClick={() => approveMut.mutate(b.id || b._id)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-xl font-bold text-xs shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectMut.mutate(b.id || b._id)}
                        className="px-3 py-2 bg-rose-100 hover:bg-rose-200 transition text-rose-700 rounded-xl font-bold text-xs"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {b.paymentStatus === "paid" && (
                    <button
                      onClick={() => setChatBooking(b)}
                      className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 transition text-emerald-800 rounded-xl font-bold text-xs shadow-sm"
                    >
                      💬 Chat
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">
                  No bookings available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {chatBooking && (
        <AdminChatModal
          booking={chatBooking}
          onClose={() => setChatBooking(null)}
        />
      )}
    </div>
  );
}

function AdminChatModal({ booking, onClose }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data } = useQuery({
    queryKey: ["booking", booking.id, "messages"],
    queryFn: () => api.bookings.messages(booking.id),
    refetchInterval: 5000,
  });

  const sendMut = useMutation({
    mutationFn: (msg) => api.bookings.sendMessage(booking.id, { message: msg }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["booking", booking.id, "messages"],
      });
      setDraft("");
    },
  });

  const messages = data?.data?.messages || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden h-[80vh]">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Chat: {booking.serviceTitle}
            </h3>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              Buyer:{" "}
              <span className="text-slate-800">{booking.buyer?.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold transition"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-100/50 flex flex-col">
          {messages.map((m) => {
            const isAdmin = m.senderId?.role === "admin";
            return (
              <div
                key={m._id}
                className={`p-4 rounded-2xl max-w-[80%] shadow-sm ${isAdmin ? "bg-indigo-600 text-white self-end rounded-tr-sm" : "bg-white border border-slate-200 rounded-tl-sm self-start"}`}
              >
                <p
                  className={`font-bold text-xs uppercase tracking-wider mb-1 ${isAdmin ? "text-indigo-200" : "text-slate-500"}`}
                >
                  {m.senderId?.name}
                </p>
                <p className="text-sm leading-relaxed">{m.message}</p>
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="m-auto text-slate-400 font-semibold text-sm">
              No messages yet. Send a greeting!
            </div>
          )}
        </div>
        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && draft && sendMut.mutate(draft)
            }
            className="flex-1 rounded-xl bg-slate-50 border border-slate-300 px-4 py-3 focus:outline-none focus:border-indigo-500 transition"
            placeholder="Type a message..."
          />
          <button
            onClick={() => {
              if (draft) sendMut.mutate(draft);
            }}
            disabled={!draft || sendMut.isPending}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminServicesView() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: api.admin.services,
  });
  const services = data?.data?.services || [];

  const deleteMut = useMutation({
    mutationFn: (id) => api.admin.deleteService(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] }),
  });

  if (isLoading)
    return <div className="p-8 text-slate-500">Loading services...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Services
          </h1>
          <p className="text-slate-500 mt-2">Manage all platform services.</p>
        </div>
      </div>
      <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden text-sm">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-bold">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((s) => (
              <tr key={s._id || s.id}>
                <td className="px-6 py-4 font-bold text-slate-900">
                  {s.title}
                </td>
                <td className="px-6 py-4 text-slate-600">{s.category}</td>
                <td className="px-6 py-4 font-semibold">₹ {s.price}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                      s.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => deleteMut.mutate(s._id || s.id)}
                    className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-200 transition"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">
                  No services yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminAnalytics() {
  // Dummy analytics data
  const analyticsData = {
    chartData: [
      { month: "Jan", revenue: 125000, profit: 30000, orders: 45 },
      { month: "Feb", revenue: 145000, profit: 35000, orders: 52 },
      { month: "Mar", revenue: 165000, profit: 42000, orders: 61 },
      { month: "Apr", revenue: 210000, profit: 52000, orders: 78 },
      { month: "May", revenue: 245000, profit: 58000, orders: 89 },
      { month: "Jun", revenue: 310000, profit: 74000, orders: 112 },
    ],
    topProducts: [
      { name: "Wireless Mouse", orders: 342, revenue: 648000, rating: 4.8 },
      { name: "USB-C Hub", orders: 287, revenue: 516000, rating: 4.7 },
      {
        name: "Mechanical Keyboard",
        orders: 256,
        revenue: 768000,
        rating: 4.9,
      },
      { name: "Monitor Stand", orders: 198, revenue: 297000, rating: 4.6 },
      { name: "Laptop Cooling Pad", orders: 165, revenue: 330000, rating: 4.5 },
    ],
    topSuppliers: [
      {
        name: "TechPro Supplies",
        totalOrders: 156,
        commission: 78000,
        status: "active",
      },
      {
        name: "ElectroHub",
        totalOrders: 142,
        commission: 71000,
        status: "active",
      },
      {
        name: "Office Direct",
        totalOrders: 127,
        commission: 63500,
        status: "active",
      },
      {
        name: "Campus Merchant",
        totalOrders: 98,
        commission: 49000,
        status: "active",
      },
    ],
    conversionMetrics: {
      totalVisitors: 12453,
      totalOrders: 892,
      conversionRate: "7.16%",
      avgOrderValue: 2750,
      repeatCustomers: "34%",
      cartAbandonmentRate: "28%",
    },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Analytics & Insights
        </h1>
        <p className="text-slate-500 mt-2">
          Deep dive into performance metrics and trends.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Conversion Rate
          </p>
          <p className="mt-2 text-3xl font-black text-indigo-600">
            {analyticsData.conversionMetrics.conversionRate}
          </p>
          <p className="mt-1 text-sm text-slate-600">📈 +2.3% vs last month</p>
        </div>
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Avg Order Value
          </p>
          <p className="mt-2 text-3xl font-black text-emerald-600">
            ₹{analyticsData.conversionMetrics.avgOrderValue}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            📊 {analyticsData.conversionMetrics.totalVisitors.toLocaleString()}{" "}
            visitors
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Repeat Customers
          </p>
          <p className="mt-2 text-3xl font-black text-blue-600">
            {analyticsData.conversionMetrics.repeatCustomers}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            🎯 Customer loyalty index
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Cart Abandonment
          </p>
          <p className="mt-2 text-3xl font-black text-amber-600">
            {analyticsData.conversionMetrics.cartAbandonmentRate}
          </p>
          <p className="mt-1 text-sm text-slate-600">⚠️ Needs optimization</p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="rounded-[2rem] bg-white p-8 border border-slate-200 shadow-sm">
        <h3 className="font-bold text-xl text-slate-900 mb-6">
          Revenue Trend (6 Months)
        </h3>
        <div className="h-64 flex items-end justify-between gap-4">
          {analyticsData.chartData.map((item, i) => {
            const maxRevenue = Math.max(
              ...analyticsData.chartData.map((d) => d.revenue),
            );
            const height = (item.revenue / maxRevenue) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-indigo-500 to-indigo-300 rounded-t-lg"
                  style={{ height: `${height}%` }}
                  title={`₹${(item.revenue / 100000).toFixed(1)}L`}
                />
                <p className="mt-4 text-xs font-bold text-slate-600">
                  {item.month}
                </p>
                <p className="text-[10px] text-slate-500">
                  ₹{(item.revenue / 100000).toFixed(1)}L
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Products & Suppliers */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-[2rem] bg-white p-8 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-xl text-slate-900 mb-4">
            Top Selling Products
          </h3>
          <div className="space-y-3">
            {analyticsData.topProducts.map((product, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {i + 1}. {product.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    ₹{(product.revenue / 100000).toFixed(2)}L revenue
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600">
                    {product.orders} orders
                  </p>
                  <p className="text-sm text-yellow-500">⭐ {product.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-8 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-xl text-slate-900 mb-4">
            Top Suppliers
          </h3>
          <div className="space-y-3">
            {analyticsData.topSuppliers.map((supplier, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {i + 1}. {supplier.name}
                  </p>
                  <span
                    className={`text-xs font-bold uppercase px-2 py-1 rounded-lg ${supplier.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                  >
                    {supplier.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    {supplier.totalOrders} orders
                  </p>
                  <p className="text-sm text-emerald-600">
                    +₹{(supplier.commission / 100000).toFixed(1)}L comm.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;

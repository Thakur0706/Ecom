import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import OrderStatusBadge from "../components/OrderStatusBadge";
import OrderChatModal from "../components/OrderChatModal";

function SupplierProfile() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile"); // 'profile', 'orders', 'ledger'
  const [chatOrderId, setChatOrderId] = useState(null);
  const [chatOrderNum, setChatOrderNum] = useState("");

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["supplier", "status"],
    queryFn: () => api.supplier.status(),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["supplier", "orders"],
    queryFn: () => api.supplier.orders(),
    enabled: activeTab === "orders",
  });

  const { data: ledgerData, isLoading: ledgerLoading } = useQuery({
    queryKey: ["supplier", "ledger-summary"],
    queryFn: () => api.supplier.ledgerSummary(),
    enabled: activeTab === "ledger",
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }) =>
      api.supplier.updateOrderStatus(id, { orderStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier", "orders"] });
      queryClient.invalidateQueries({
        queryKey: ["supplier", "ledger-summary"],
      });
    },
  });

  const profile = statusData?.data?.supplierProfile || {};
  const orders = ordersData?.data?.orders || [];
  const ledger = ledgerData?.data || { balance: 0, pendingPayouts: 0 };

  if (statusLoading)
    return <div className="text-center p-10 text-slate-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Supplier Dashboard
          </h1>
          <p className="text-slate-500 mt-2">
            Manage your campus business operations from one place.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <TabButton
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          >
            Verification
          </TabButton>
          <TabButton
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
          >
            My Orders
          </TabButton>
          <TabButton
            active={activeTab === "ledger"}
            onClick={() => setActiveTab("ledger")}
          >
            Ledger & Payouts
          </TabButton>
        </div>
      </div>

      {activeTab === "profile" && <VerificationTab profile={profile} />}
      {activeTab === "orders" && (
        <OrdersTab
          orders={orders}
          loading={ordersLoading}
          onUpdateStatus={(id, status) =>
            updateStatusMut.mutate({ id, status })
          }
          onOpenChat={(id, num) => {
            setChatOrderId(id);
            setChatOrderNum(num);
          }}
        />
      )}
      {activeTab === "ledger" && (
        <LedgerTab ledger={ledger} loading={ledgerLoading} />
      )}

      <OrderChatModal
        isOpen={!!chatOrderId}
        onClose={() => setChatOrderId(null)}
        orderId={chatOrderId}
        orderNumber={chatOrderNum}
      />
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
        active
          ? "bg-white text-indigo-600 shadow-sm"
          : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function VerificationTab({ profile }) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100 border border-slate-200 animate-fade-in">
      <div className="space-y-8">
        <div className="flex justify-between items-start border-b border-slate-100 pb-6">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Store Entity
            </p>
            <h2 className="mt-1 text-3xl font-black text-slate-900 leading-tight">
              {profile.storeName || profile.fullName}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest leading-none">
                {profile.businessType?.replace("_", " ") ||
                  "Registered Supplier"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Verification Status
            </p>
            <p
              className={`mt-1 font-black uppercase text-sm px-4 py-1.5 rounded-full inline-block ${
                profile.status === "approved"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {profile.status}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Legal Representative
            </p>
            <p className="font-bold text-slate-900 text-lg">
              {profile.fullName}
            </p>
            <p className="text-slate-500 text-sm">{profile.contactNumber}</p>
          </div>

          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Payout Details
            </p>
            <p className="font-bold text-slate-900 text-lg">
              {profile.upiOrBankDetails}
            </p>
            <p className="text-slate-500 text-xs mt-1 italic">
              Verified for weekly settlements.
            </p>
          </div>

          {profile.isStudent && (
            <div className="md:col-span-2 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                🎓 Student Credentials
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <DetailItem label="College" value={profile.collegeName} />
                <DetailItem label="Department" value={profile.department} />
              </div>
            </div>
          )}

          {profile.businessAddress && (
            <DetailItem
              className="md:col-span-2"
              label="Business Address"
              value={profile.businessAddress}
            />
          )}
          {profile.businessDescription && (
            <DetailItem
              className="md:col-span-2"
              label="Business Summary"
              value={profile.businessDescription}
              italic
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OrdersTab({ orders, loading, onUpdateStatus, onOpenChat }) {
  if (loading)
    return (
      <div className="p-10 text-center text-slate-500">Loading orders...</div>
    );

  return (
    <div className="space-y-6 animate-fade-in">
      {orders.length === 0 ? (
        <div className="p-20 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500">
          No orders found for your products yet.
        </div>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-[2rem] p-8 shadow-sm ring-1 ring-slate-100 border border-slate-200 flex flex-col lg:flex-row justify-between gap-8 transition hover:shadow-md"
          >
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 bg-slate-100 rounded-2xl overflow-hidden">
                  <img
                    src={order.items?.[0]?.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {order.transactionId}
                  </p>
                  <h3 className="text-xl font-black text-slate-900">
                    {order.items?.[0]?.title}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {order.items?.[0]?.quantity} unit(s) • ₹
                    {order.items?.[0]?.price} each
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                    Customer
                  </p>
                  <p className="font-bold text-slate-800">
                    {order.buyer?.name || "Customer"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                    Status
                  </p>
                  <OrderStatusBadge status={order.orderStatus} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                    Placed On
                  </p>
                  <p className="font-bold text-slate-800">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex md:flex-row lg:flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8 min-w-[200px]">
              <button
                onClick={() => onOpenChat(order.id || order._id, order.transactionId)}
                className="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:border-indigo-200 hover:text-indigo-600 transition flex items-center justify-center gap-2"
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
                Chat with Admin
              </button>
              {order.orderStatus === "confirmed" && (
                <button
                  onClick={() => onUpdateStatus(order.id || order._id, "shipped")}
                  className="w-full py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                >
                  Mark as Shipped
                </button>
              )}
              {order.orderStatus === "shipped" && (
                <button
                  onClick={() => onUpdateStatus(order.id || order._id, "delivered")}
                  className="w-full py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                >
                  Mark as Delivered
                </button>
              )}
              {order.orderStatus === "delivered" && (
                <div className="text-center py-2 px-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs uppercase tracking-widest">
                  ✅ Completed
                </div>
              )}
              {["placed", "cancelled"].includes(order.orderStatus) && (
                <p className="text-xs text-center text-slate-400 italic">
                  Waiting for admin confirmation or cancelled.
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function LedgerTab({ ledger, loading }) {
  if (loading)
    return (
      <div className="p-10 text-center text-slate-500">Loading ledger...</div>
    );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-100">
          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">
            Total Earnings (Withdrawable)
          </p>
          <h3 className="text-5xl font-black mt-4">₹ {ledger.balance || 0}</h3>
          <button className="mt-8 px-8 py-3 bg-white text-indigo-900 font-black rounded-2xl hover:bg-indigo-50 transition">
            Request Payout
          </button>
        </div>
        <div className="bg-white rounded-[2.5rem] p-10 ring-1 ring-slate-100 shadow-sm border border-slate-200">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
            Pending Settlement
          </p>
          <h3 className="text-5xl font-black mt-4 text-slate-900">
            ₹ {ledger.pendingPayouts || 0}
          </h3>
          <p className="mt-4 text-slate-500 text-sm leading-relaxed">
            Settlements transition to withdrawable balance after orders are
            marked as{" "}
            <span className="font-bold text-emerald-600">Delivered</span>.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 ring-1 ring-slate-100 shadow-sm border border-slate-200">
        <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-widest text-sm">
          Recent Transactions
        </h3>
        <p className="text-slate-400 italic text-center py-10">
          Detailed transaction log coming soon.
        </p>
      </div>
    </div>
  );
}

function DetailItem({ label, value, italic, className }) {
  return (
    <div className={className}>
      <p className="text-xs text-slate-500 font-bold uppercase mb-1">{label}</p>
      <p className={`font-semibold text-slate-800 ${italic ? "italic" : ""}`}>
        {value}
      </p>
    </div>
  );
}

export default SupplierProfile;

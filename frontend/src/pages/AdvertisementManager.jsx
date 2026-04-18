import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const DUMMY_ADS = [
  {
    id: "ad001",
    title: "Summer Sale — Flat 30% Off Electronics",
    status: "active",
    type: "Banner",
    placement: "Homepage Hero",
    budget: 25000,
    spent: 18420,
    impressions: 142300,
    clicks: 5890,
    conversions: 312,
    startDate: "2026-04-01",
    endDate: "2026-06-30",
    product: "Electronics",
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&q=80",
  },
  {
    id: "ad002",
    title: "New Arrivals — Stationery Bonanza",
    status: "active",
    type: "Sidebar",
    placement: "Product Listing",
    budget: 8000,
    spent: 4300,
    impressions: 63200,
    clicks: 2140,
    conversions: 98,
    startDate: "2026-04-10",
    endDate: "2026-05-31",
    product: "Stationery",
    image: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400&q=80",
  },
  {
    id: "ad003",
    title: "Service Spotlight — Top Tutors Available",
    status: "active",
    type: "Popup",
    placement: "Dashboard",
    budget: 12000,
    spent: 9870,
    impressions: 88400,
    clicks: 3920,
    conversions: 210,
    startDate: "2026-03-15",
    endDate: "2026-05-15",
    product: "Services",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80",
  },
  {
    id: "ad004",
    title: "Festival Special — Books & Media",
    status: "paused",
    type: "Banner",
    placement: "Category Page",
    budget: 6000,
    spent: 2100,
    impressions: 21500,
    clicks: 780,
    conversions: 34,
    startDate: "2026-04-14",
    endDate: "2026-04-20",
    product: "Books",
    image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&q=80",
  },
  {
    id: "ad005",
    title: "Flash Deal — Hostel Essentials",
    status: "completed",
    type: "Notification",
    placement: "All Pages",
    budget: 5000,
    spent: 5000,
    impressions: 97100,
    clicks: 4250,
    conversions: 389,
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    product: "Home & Living",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
  },
  {
    id: "ad006",
    title: "Referral Booster — Earn ₹50 per Friend",
    status: "active",
    type: "Banner",
    placement: "Checkout Page",
    budget: 15000,
    spent: 6800,
    impressions: 52000,
    clicks: 3100,
    conversions: 145,
    startDate: "2026-04-01",
    endDate: "2026-07-31",
    product: "All",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
  },
];

const DUMMY_CHANNELS = [
  { channel: "Homepage Banner", impressions: 142300, clicks: 5890, ctr: "4.1%", spend: 18420, revenue: 78400, roas: "4.3x" },
  { channel: "Product Sidebar", impressions: 63200, clicks: 2140, ctr: "3.4%", spend: 4300, revenue: 14700, roas: "3.4x" },
  { channel: "Dashboard Popup", impressions: 88400, clicks: 3920, ctr: "4.4%", spend: 9870, revenue: 52100, roas: "5.3x" },
  { channel: "Notification Bar", impressions: 97100, clicks: 4250, ctr: "4.4%", spend: 5000, revenue: 38900, roas: "7.8x" },
  { channel: "Checkout Banner", impressions: 52000, clicks: 3100, ctr: "6.0%", spend: 6800, revenue: 21750, roas: "3.2x" },
];

const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  paused: "bg-amber-100 text-amber-700 border border-amber-200",
  completed: "bg-slate-100 text-slate-600 border border-slate-200",
  draft: "bg-blue-100 text-blue-700 border border-blue-200",
};

function ctr(clicks, impressions) {
  if (!impressions) return "0%";
  return ((clicks / impressions) * 100).toFixed(1) + "%";
}

function formatINR(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

export default function AdvertisementManager() {
  const { currentUser, authLoading } = useAppContext();
  const [ads, setAds] = useState(DUMMY_ADS);
  const [activeTab, setActiveTab] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [newAd, setNewAd] = useState({
    title: "",
    type: "Banner",
    placement: "Homepage Hero",
    budget: "",
    startDate: "",
    endDate: "",
    product: "",
  });

  if (authLoading) return <div className="p-10 text-slate-400">Loading...</div>;
  if (!currentUser) return <Navigate to="/admin/login" replace />;
  if (currentUser.role !== "admin") return <Navigate to="/dashboard" replace />;

  const filteredAds = filter === "all" ? ads : ads.filter((a) => a.status === filter);

  const totalBudget = ads.reduce((s, a) => s + a.budget, 0);
  const totalSpent = ads.reduce((s, a) => s + a.spent, 0);
  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const totalConversions = ads.reduce((s, a) => s + a.conversions, 0);
  const activeAds = ads.filter((a) => a.status === "active").length;

  function handleCreateAd(e) {
    e.preventDefault();
    const created = {
      ...newAd,
      id: "ad" + (ads.length + 1).toString().padStart(3, "0"),
      status: "active",
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      budget: Number(newAd.budget),
      image: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&q=80",
    };
    setAds([created, ...ads]);
    setShowModal(false);
    setNewAd({ title: "", type: "Banner", placement: "Homepage Hero", budget: "", startDate: "", endDate: "", product: "" });
  }

  function toggleStatus(id) {
    setAds(ads.map((a) =>
      a.id === id
        ? { ...a, status: a.status === "active" ? "paused" : "active" }
        : a
    ));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Advertisement Manager</h1>
            <p className="mt-1 text-slate-500">Plan, launch, and track all your ad campaigns in one place.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition"
          >
            <span className="text-lg">+</span> Launch Campaign
          </button>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-6 gap-4">
          {[
            { label: "Active Campaigns", value: activeAds, color: "text-indigo-600", sub: `of ${ads.length} total` },
            { label: "Total Budget", value: formatINR(totalBudget), color: "text-slate-900", sub: "allocated" },
            { label: "Total Spent", value: formatINR(totalSpent), color: "text-rose-600", sub: `${((totalSpent / totalBudget) * 100).toFixed(0)}% burned` },
            { label: "Impressions", value: (totalImpressions / 1000).toFixed(0) + "K", color: "text-blue-600", sub: "total views" },
            { label: "Clicks", value: totalClicks.toLocaleString(), color: "text-emerald-600", sub: ctr(totalClicks, totalImpressions) + " CTR" },
            { label: "Conversions", value: totalConversions, color: "text-purple-600", sub: ctr(totalConversions, totalClicks) + " of clicks" },
          ].map((kpi, i) => (
            <div key={i} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-100 border border-slate-200 hover:shadow-md transition">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{kpi.label}</p>
              <p className={`mt-3 text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
              <p className="mt-1 text-xs text-slate-500">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-100 w-fit">
          {["overview", "campaigns", "channels"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-5 py-2 text-sm font-bold capitalize transition ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Performance Charts (bar style) */}
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <h3 className="font-black text-slate-900 mb-4">Budget vs Spend</h3>
                <div className="space-y-4">
                  {ads.filter((a) => a.status !== "completed").map((ad) => {
                    const pct = Math.min(100, ((ad.spent / ad.budget) * 100)).toFixed(0);
                    return (
                      <div key={ad.id}>
                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                          <span className="truncate max-w-[55%]">{ad.title.split("—")[0].trim()}</span>
                          <span>{formatINR(ad.spent)} / {formatINR(ad.budget)}</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${Number(pct) > 80 ? "bg-rose-400" : "bg-indigo-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <h3 className="font-black text-slate-900 mb-4">Conversion by Campaign</h3>
                <div className="space-y-4">
                  {[...ads].sort((a, b) => b.conversions - a.conversions).map((ad) => {
                    const max = Math.max(...ads.map((a) => a.conversions));
                    const pct = ((ad.conversions / max) * 100).toFixed(0);
                    return (
                      <div key={ad.id}>
                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                          <span className="truncate max-w-[55%]">{ad.title.split("—")[0].trim()}</span>
                          <span className="text-emerald-600">{ad.conversions} cvs</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ad Cards Preview */}
            <div>
              <h3 className="font-black text-slate-900 mb-4">Active Campaign Previews</h3>
              <div className="grid grid-cols-3 gap-5">
                {ads.filter((a) => a.status === "active").map((ad) => (
                  <div key={ad.id} className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden hover:shadow-lg transition group">
                    <div className="relative h-36 overflow-hidden">
                      <img src={ad.image} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                      <span className={`absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_STYLES[ad.status]}`}>
                        {ad.status}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="font-black text-slate-900 text-sm leading-snug line-clamp-1">{ad.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ad.type} · {ad.placement}</p>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs font-black text-blue-600">{(ad.impressions / 1000).toFixed(0)}K</p>
                          <p className="text-[10px] text-slate-400">Views</p>
                        </div>
                        <div>
                          <p className="text-xs font-black text-indigo-600">{ctr(ad.clicks, ad.impressions)}</p>
                          <p className="text-[10px] text-slate-400">CTR</p>
                        </div>
                        <div>
                          <p className="text-xs font-black text-emerald-600">{ad.conversions}</p>
                          <p className="text-[10px] text-slate-400">Cvs</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2">
              {["all", "active", "paused", "completed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wide transition ${
                    filter === f ? "bg-indigo-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-indigo-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Campaign", "Type", "Status", "Budget", "Spent", "Impressions", "CTR", "Conversions", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAds.map((ad) => (
                    <tr key={ad.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img src={ad.image} alt="" className="h-8 w-8 rounded-xl object-cover" />
                          <div>
                            <p className="font-bold text-slate-900 leading-tight max-w-[200px] truncate">{ad.title}</p>
                            <p className="text-xs text-slate-400">{ad.placement}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{ad.type}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${STATUS_STYLES[ad.status]}`}>
                          {ad.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">{formatINR(ad.budget)}</td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold text-rose-600">{formatINR(ad.spent)}</p>
                          <div className="mt-1 h-1 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-400 rounded-full" style={{ width: `${Math.min(100, (ad.spent / ad.budget) * 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-blue-600">{ad.impressions.toLocaleString()}</td>
                      <td className="px-5 py-4 font-bold text-indigo-600">{ctr(ad.clicks, ad.impressions)}</td>
                      <td className="px-5 py-4 font-bold text-emerald-600">{ad.conversions}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleStatus(ad.id)}
                          className={`rounded-xl px-3 py-1 text-xs font-black transition ${
                            ad.status === "active"
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : ad.status === "paused"
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                          disabled={ad.status === "completed"}
                        >
                          {ad.status === "active" ? "Pause" : ad.status === "paused" ? "Resume" : "Done"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Channels Tab */}
        {activeTab === "channels" && (
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-4">
              {DUMMY_CHANNELS.map((ch, i) => (
                <div key={i} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-100 border border-slate-200">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{ch.channel}</p>
                  <p className="mt-3 text-2xl font-black text-indigo-600">{ch.roas}</p>
                  <p className="text-xs text-slate-500">ROAS</p>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Impressions</span><span className="font-bold">{(ch.impressions / 1000).toFixed(0)}K</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">CTR</span><span className="font-bold text-blue-600">{ch.ctr}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Spend</span><span className="font-bold text-rose-600">{formatINR(ch.spend)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Revenue</span><span className="font-bold text-emerald-600">{formatINR(ch.revenue)}</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h3 className="font-black text-slate-900 mb-5">Channel Performance Comparison</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Channel", "Impressions", "Clicks", "CTR", "Spend", "Revenue", "ROAS"].map((h) => (
                        <th key={h} className="pb-3 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 pr-8">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {DUMMY_CHANNELS.map((ch, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition">
                        <td className="py-3 pr-8 font-bold text-slate-900">{ch.channel}</td>
                        <td className="py-3 pr-8 text-blue-600 font-bold">{ch.impressions.toLocaleString()}</td>
                        <td className="py-3 pr-8 text-slate-700 font-bold">{ch.clicks.toLocaleString()}</td>
                        <td className="py-3 pr-8 text-indigo-600 font-bold">{ch.ctr}</td>
                        <td className="py-3 pr-8 text-rose-600 font-bold">{formatINR(ch.spend)}</td>
                        <td className="py-3 pr-8 text-emerald-600 font-bold">{formatINR(ch.revenue)}</td>
                        <td className="py-3 pr-8">
                          <span className="rounded-full bg-indigo-100 text-indigo-700 px-2.5 py-0.5 text-xs font-black">{ch.roas}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Create Campaign Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-[2.5rem] bg-white shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-900">Launch New Campaign</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateAd} className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Campaign Title</label>
                  <input required value={newAd.title} onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 outline-none" placeholder="e.g. Summer Sale — Electronics" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Ad Type</label>
                    <select value={newAd.type} onChange={(e) => setNewAd({ ...newAd, type: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 outline-none bg-white">
                      {["Banner", "Sidebar", "Popup", "Notification"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Placement</label>
                    <select value={newAd.placement} onChange={(e) => setNewAd({ ...newAd, placement: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 outline-none bg-white">
                      {["Homepage Hero", "Product Listing", "Dashboard", "Category Page", "Checkout Page", "All Pages"].map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Budget (₹)</label>
                    <input required type="number" value={newAd.budget} onChange={(e) => setNewAd({ ...newAd, budget: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 outline-none" placeholder="10000" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Product Category</label>
                    <input value={newAd.product} onChange={(e) => setNewAd({ ...newAd, product: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 outline-none" placeholder="Electronics" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Start Date</label>
                    <input required type="date" value={newAd.startDate} onChange={(e) => setNewAd({ ...newAd, startDate: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">End Date</label>
                    <input required type="date" value={newAd.endDate} onChange={(e) => setNewAd({ ...newAd, endDate: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 outline-none" />
                  </div>
                </div>
                <button type="submit"
                  className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 mt-2">
                  Launch Campaign
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import ActivityFeed from '../components/ActivityFeed';
import KPICard from '../components/KPICard';
import ResourceUtilizationBar from '../components/ResourceUtilizationBar';
import SalesChart from '../components/SalesChart';
import { useERPCRMContext } from '../context/ERPCRMContext';
import { useAppContext } from '../context/AppContext';

const ticketStyles = {
  Open: 'bg-rose-100 text-rose-700',
  Pending: 'bg-amber-100 text-amber-700',
  Resolved: 'bg-emerald-100 text-emerald-700',
};

function ERPDashboard() {
  const { currentUser } = useAppContext();
  const { salesData, erpResources, activities, updateSupportTicket, setActiveModule } = useERPCRMContext();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString('en-IN'));

  useEffect(() => {
    setActiveModule('erp');
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, [setActiveModule]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'buyer') {
    return <Navigate to="/dashboard" replace />;
  }

  const totalRevenue = salesData.monthlySales.reduce((sum, month) => sum + month.revenue, 0);
  const kpis = [
    { title: 'Total Users', value: erpResources.platformUsage.totalUsers, icon: '👥', color: 'bg-blue-100 text-blue-600' },
    { title: 'Active Listings', value: erpResources.listingMetrics.totalActive, icon: '📦', color: 'bg-indigo-100 text-indigo-600' },
    { title: 'Orders Processed', value: erpResources.transactionMetrics.totalProcessed, icon: '🛒', color: 'bg-emerald-100 text-emerald-600' },
    { title: 'Total Revenue', value: `₹${totalRevenue}`, icon: '💰', color: 'bg-emerald-100 text-emerald-700' },
    { title: 'Success Rate', value: `${erpResources.transactionMetrics.successRate}%`, icon: '✅', color: 'bg-teal-100 text-teal-600' },
    { title: 'Pending Approvals', value: erpResources.listingMetrics.pendingApproval, icon: '⏳', color: 'bg-amber-100 text-amber-600' },
  ];

  const listingMetrics = [
    { icon: '📦', label: 'Total Active', value: erpResources.listingMetrics.totalActive },
    { icon: '⏳', label: 'Pending Approval', value: erpResources.listingMetrics.pendingApproval },
    { icon: '🗑', label: 'Removed This Month', value: erpResources.listingMetrics.removedThisMonth },
    { icon: '🕒', label: 'Avg Listing Age', value: erpResources.listingMetrics.averageListingAge },
  ];

  const transactionMetrics = [
    { icon: '🧾', label: 'Total Processed', value: erpResources.transactionMetrics.totalProcessed },
    { icon: '✅', label: 'Success Rate', value: `${erpResources.transactionMetrics.successRate}%` },
    { icon: '₹', label: 'Average Value', value: `₹${erpResources.transactionMetrics.averageValue}` },
    { icon: '⏰', label: 'Peak Hour', value: erpResources.transactionMetrics.peakHour },
  ];

  const handleRefresh = () => {
    setLoading(true);
    window.setTimeout(() => {
      setLastUpdated(new Date().toLocaleString('en-IN'));
      setLoading(false);
    }, 700);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ERP Dashboard - Enterprise Overview</h1>
            <p className="mt-2 text-sm text-slate-500">CampusConnect Resource & Operations Planning</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              Last updated: {lastUpdated}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">Monthly Revenue Trend</h2>
            <div className="mt-6">
              <SalesChart data={salesData.monthlySales} captionKey="orders" />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">Resource Utilization</h2>
            <div className="mt-6 space-y-4">
              <ResourceUtilizationBar label="User Capacity" current={erpResources.platformUsage.totalUsers} max={100} />
              <ResourceUtilizationBar label="Listing Capacity" current={erpResources.listingMetrics.totalActive} max={500} />
              <ResourceUtilizationBar label="Transaction Load" current={erpResources.transactionMetrics.totalProcessed} max={200} />
              <ResourceUtilizationBar label="Server Load" current={erpResources.platformUsage.serverLoad} max={100} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
              <Link to="/reports" className="text-sm font-semibold text-blue-600 transition hover:text-indigo-600">
                View All Activity
              </Link>
            </div>
            <ActivityFeed activities={activities} limit={8} />
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-gray-100 text-slate-600">
                  <tr>
                    {['ID', 'Issue', 'Raised By', 'Status', 'Date', 'Action'].map((heading) => (
                      <th key={heading} className="px-4 py-4 font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {erpResources.supportTickets.map((ticket, index) => (
                    <tr key={ticket.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-4 font-semibold text-gray-900">{ticket.id}</td>
                      <td className="px-4 py-4 text-slate-600">{ticket.issue}</td>
                      <td className="px-4 py-4 text-slate-600">{ticket.raisedBy}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ticketStyles[ticket.status]}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{ticket.date}</td>
                      <td className="px-4 py-4">
                        {ticket.status === 'Open' ? (
                          <button
                            type="button"
                            onClick={() => updateSupportTicket(ticket.id, 'Resolved')}
                            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-emerald-600"
                          >
                            Resolve
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900">Listing Metrics</h2>
          <div className="mt-6 space-y-4">
            {listingMetrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-600">
                  <span className="mr-2">{metric.icon}</span>
                  {metric.label}
                </p>
                <p className="text-lg font-bold text-gray-900">{metric.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900">Transaction Metrics</h2>
          <div className="mt-6 space-y-4">
            {transactionMetrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-600">
                  <span className="mr-2">{metric.icon}</span>
                  {metric.label}
                </p>
                <p className={`text-lg font-bold ${metric.label === 'Success Rate' ? 'text-emerald-600' : 'text-gray-900'}`}>
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900">Top Products</h2>
          <div className="mt-6 space-y-4">
            {salesData.topProducts.map((product, index) => (
              <div key={product.title} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    #{index + 1} {product.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {product.soldCount} sold · ₹{product.revenue}
                  </p>
                </div>
                <span className={`text-lg font-bold ${product.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {product.trend === 'up' ? '↑' : '↓'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ERPDashboard;

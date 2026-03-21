import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import CustomerProfileCard from '../components/CustomerProfileCard';
import KPICard from '../components/KPICard';
import LeadPipeline from '../components/LeadPipeline';
import { useERPCRMContext } from '../context/ERPCRMContext';
import { useAppContext } from '../context/AppContext';

const interactionStyles = {
  Purchase: 'bg-emerald-100 text-emerald-700',
  Listing: 'bg-blue-100 text-blue-700',
  Review: 'bg-purple-100 text-purple-700',
  Support: 'bg-orange-100 text-orange-700',
};

function CRMDashboard() {
  const { currentUser } = useAppContext();
  const { customers, crmKPIs, getCustomerSegments, setActiveModule } = useERPCRMContext();

  useEffect(() => {
    setActiveModule('crm');
  }, [setActiveModule]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'buyer') {
    return <Navigate to="/dashboard" replace />;
  }

  const segments = getCustomerSegments();
  const topCustomers = [...customers]
    .sort((left, right) => right.lifetimeValue - left.lifetimeValue)
    .slice(0, 5);

  const recentInteractions = [...customers]
    .flatMap((customer) =>
      customer.interactions.map((interaction) => ({
        ...interaction,
        customerName: customer.name,
      })),
    )
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 6);

  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => {
    const count = customers.filter((customer) => customer.satisfactionScore === rating).length;
    return {
      rating,
      count,
      percentage: customers.length === 0 ? 0 : Math.round((count / customers.length) * 100),
    };
  });

  const segmentCards = [
    { title: 'High Value Customers', value: segments.highValue.length, query: 'highValue', accent: 'text-blue-700 bg-blue-50' },
    { title: 'Active Users', value: segments.active.length, query: 'active', accent: 'text-emerald-700 bg-emerald-50' },
    { title: 'New Users', value: segments.new.length, query: 'new', accent: 'text-indigo-700 bg-indigo-50' },
    { title: 'At Risk', value: segments.atRisk.length, query: 'atRisk', accent: 'text-rose-700 bg-rose-50' },
  ];

  const kpis = [
    { title: 'Customer Satisfaction', value: `${crmKPIs.customerSatisfaction}/5`, icon: '⭐', color: 'bg-amber-100 text-amber-600' },
    { title: 'Net Promoter Score', value: crmKPIs.netPromoterScore, icon: '📣', color: 'bg-indigo-100 text-indigo-600' },
    { title: 'Retention Rate', value: `${crmKPIs.customerRetentionRate}%`, icon: '🔁', color: 'bg-emerald-100 text-emerald-600' },
    { title: 'Avg Response Time', value: crmKPIs.averageResponseTime, icon: '⏱', color: 'bg-sky-100 text-sky-600' },
    { title: 'Support Tickets', value: crmKPIs.totalSupportTickets, icon: '🛟', color: 'bg-rose-100 text-rose-600' },
    { title: 'Resolved', value: crmKPIs.resolvedTickets, icon: '✅', color: 'bg-teal-100 text-teal-600' },
    { title: 'Churn Rate', value: `${crmKPIs.churnRate}%`, icon: '📉', color: 'bg-orange-100 text-orange-600' },
    { title: 'New This Month', value: crmKPIs.newCustomersThisMonth, icon: '🆕', color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard - Customer Relations</h1>
        <p className="mt-2 text-sm text-slate-500">Manage customer relationships and track engagement</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Customer Segments</h2>
          <Link to="/customers" className="text-sm font-semibold text-indigo-600 transition hover:text-purple-600">
            View customer management
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {segmentCards.map((segment) => (
            <div key={segment.title} className={`rounded-2xl p-5 ${segment.accent}`}>
              <p className="text-sm font-semibold">{segment.title}</p>
              <p className="mt-3 text-3xl font-bold">{segment.value}</p>
              <Link
                to={`/customers?segment=${segment.query}`}
                className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:text-indigo-600"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <LeadPipeline />
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">Customer Satisfaction Breakdown</h2>
            <div className="mt-6 space-y-4">
              {ratingCounts.map((ratingRow) => (
                <div key={ratingRow.rating} className="grid grid-cols-[64px_1fr_auto] items-center gap-4">
                  <p className="text-sm font-semibold text-slate-700">{ratingRow.rating}★</p>
                  <div className="h-3 rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        ratingRow.rating === 5
                          ? 'bg-emerald-500'
                          : ratingRow.rating === 4
                            ? 'bg-lime-500'
                            : ratingRow.rating === 3
                              ? 'bg-amber-400'
                              : ratingRow.rating === 2
                                ? 'bg-orange-500'
                                : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(ratingRow.percentage, 4)}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-600">
                    {ratingRow.count} ({ratingRow.percentage}%)
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">Top Customers by Lifetime Value</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-gray-100 text-slate-600">
                  <tr>
                    {['Rank', 'Name', 'College', 'LTV', 'Orders', 'Status', 'Profile'].map((heading) => (
                      <th key={heading} className="px-4 py-4 font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((customer, index) => (
                    <tr key={customer.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-4 font-bold text-slate-900">#{index + 1}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{customer.name}</td>
                      <td className="px-4 py-4 text-slate-600">{customer.college}</td>
                      <td className="px-4 py-4 text-slate-600">₹{customer.lifetimeValue}</td>
                      <td className="px-4 py-4 text-slate-600">{customer.totalOrders}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          customer.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : customer.status === 'New'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Link to={`/customers/${customer.id}`} className="font-semibold text-indigo-600">
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">Recent Customer Interactions</h2>
            <div className="mt-6 space-y-4">
              {recentInteractions.map((interaction) => (
                <div key={`${interaction.customerName}-${interaction.date}-${interaction.type}`} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{interaction.customerName}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${interactionStyles[interaction.type]}`}>
                      {interaction.type}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{interaction.description}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(interaction.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Customer Snapshot</h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {customers.slice(0, 3).map((customer) => (
            <CustomerProfileCard key={customer.id} customer={customer} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default CRMDashboard;

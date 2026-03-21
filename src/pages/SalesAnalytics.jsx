import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import KPICard from '../components/KPICard';
import ReportTable from '../components/ReportTable';
import SalesChart from '../components/SalesChart';
import { useERPCRMContext } from '../context/ERPCRMContext';
import { useAppContext } from '../context/AppContext';

const categoryColors = {
  Books: 'bg-blue-500',
  Electronics: 'bg-indigo-500',
  Services: 'bg-emerald-500',
  Accessories: 'bg-orange-500',
};

function SalesAnalytics() {
  const { currentUser } = useAppContext();
  const { salesData, customers, getSalesGrowth, getTopPerformingCategory, setActiveModule } = useERPCRMContext();
  const [dateRange, setDateRange] = useState('Last 6 Months');

  useEffect(() => {
    setActiveModule('erp');
  }, [setActiveModule]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'buyer') {
    return <Navigate to="/dashboard" replace />;
  }

  const salesGrowth = getSalesGrowth();
  const topCategory = getTopPerformingCategory();
  const totalRevenue = salesData.monthlySales.reduce((sum, month) => sum + month.revenue, 0);
  const totalOrders = salesData.monthlySales.reduce((sum, month) => sum + month.orders, 0);
  const avgOrderValue = Math.round(totalRevenue / totalOrders);
  const totalNewCustomers = salesData.monthlySales.reduce((sum, month) => sum + month.newUsers, 0);

  const rangeFactor = dateRange === 'Last 7 Days' ? 0.18 : dateRange === 'Last 30 Days' ? 0.5 : 1;
  const rangeRevenue = Math.round(totalRevenue * rangeFactor);
  const rangeOrders = Math.max(Math.round(totalOrders * rangeFactor), 1);
  const rangeAvgOrder = Math.round(rangeRevenue / rangeOrders);
  const rangeNewCustomers = Math.max(Math.round(totalNewCustomers * rangeFactor), 1);

  const topKpis = [
    { title: 'Total Revenue', value: `₹${rangeRevenue}`, icon: '💰', color: 'bg-emerald-100 text-emerald-600', trend: `+${salesGrowth.latestGrowth.toFixed(1)}% vs previous period` },
    { title: 'Total Orders', value: rangeOrders, icon: '🛒', color: 'bg-blue-100 text-blue-600', trend: '+8% vs previous period' },
    { title: 'Avg Order Value', value: `₹${rangeAvgOrder}`, icon: '📊', color: 'bg-indigo-100 text-indigo-600', trend: '+3% vs previous period' },
    { title: 'New Customers', value: rangeNewCustomers, icon: '🆕', color: 'bg-purple-100 text-purple-600', trend: '+6% vs previous period' },
    { title: 'Growth Rate', value: `${salesGrowth.latestGrowth.toFixed(1)}%`, icon: '📈', color: 'bg-amber-100 text-amber-600', trend: '+12% momentum' },
  ];

  const weeklyChartData = salesData.weeklyRevenue.map((value, index) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
    revenue: value,
  }));

  const topProductRows = salesData.topProducts.map((product, index) => ({
    id: `${product.title}-${index}`,
    rank: index + 1,
    product: product.title,
    category: product.category,
    soldCount: product.soldCount,
    revenue: product.revenue,
    trend: product.trend === 'up' ? '↑' : '↓',
  }));

  const reportColumns = [
    { key: 'rank', label: '#', sortable: true },
    { key: 'product', label: 'Product', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'soldCount', label: 'Units Sold', sortable: true },
    { key: 'revenue', label: 'Revenue', sortable: true, render: (value) => `₹${value}` },
    {
      key: 'trend',
      label: 'Trend',
      sortable: true,
      render: (value) => <span className={value === '↑' ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>{value}</span>,
    },
  ];

  const topSellers = salesData.topSellers.map((seller, index) => ({
    ...seller,
    trend: index < 2 ? '↑' : index === 2 ? '→' : '↓',
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="mt-2 text-sm text-slate-500">Track revenue, seller performance, and category momentum.</p>
          </div>
          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          >
            {['Last 7 Days', 'Last 30 Days', 'Last 6 Months'].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {topKpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900">Monthly Revenue</h2>
          <div className="mt-6">
            <SalesChart data={salesData.monthlySales} captionKey="orders" />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900">Category Revenue Distribution</h2>
          <div className="mt-6 space-y-5">
            {salesData.categorySales.map((category) => (
              <div key={category.category}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <p className="font-semibold text-slate-700">{category.category}</p>
                  <p className="text-slate-500">
                    ₹{category.revenue} · {category.count} orders
                  </p>
                </div>
                <div className="h-4 rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${categoryColors[category.category]}`}
                    style={{ width: `${Math.max(category.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900">Top 5 Sellers</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-gray-100 text-slate-600">
                <tr>
                  {['Rank', 'Name', 'Revenue', 'Sales Count', 'Rating', 'Trend'].map((heading) => (
                    <th key={heading} className="px-4 py-4 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topSellers.map((seller, index) => (
                  <tr key={seller.name} className={index === 0 ? 'bg-amber-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-4 font-bold text-gray-900">#{index + 1}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{seller.name}</td>
                    <td className="px-4 py-4 text-slate-600">₹{seller.revenue}</td>
                    <td className="px-4 py-4 text-slate-600">{seller.totalSales}</td>
                    <td className="px-4 py-4 text-slate-600">{seller.rating}</td>
                    <td className={`px-4 py-4 font-bold ${seller.trend === '↑' ? 'text-emerald-600' : seller.trend === '↓' ? 'text-rose-600' : 'text-slate-500'}`}>
                      {seller.trend}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900">Weekly Revenue</h2>
          <div className="mt-6">
            <SalesChart
              data={weeklyChartData}
              valueKey="revenue"
              labelKey="day"
              barColor="bg-blue-500"
              highlightIndex={weeklyChartData.findIndex((day) => day.revenue === Math.max(...salesData.weeklyRevenue))}
            />
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900">Top Products Performance</h2>
        <div className="mt-6">
          <ReportTable data={topProductRows} columns={reportColumns} />
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900">Insights</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-blue-50 p-4 text-blue-800">
            📈 {topCategory.category} revenue leads the platform with ₹{topCategory.revenue}.
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 text-emerald-800">
            🏆 Top seller: {salesData.topSellers[0].name} with ₹{salesData.topSellers[0].revenue} in sales.
          </div>
          <div className="rounded-xl bg-amber-50 p-4 text-amber-800">
            ⚠️ Accessories category is showing comparatively slower growth this cycle.
          </div>
          <div className="rounded-xl bg-indigo-50 p-4 text-indigo-800">
            💡 Peak transaction time remains {salesData.monthlySales.length > 0 ? '2PM-4PM' : 'TBD'} with {customers.length} active CRM profiles tracked.
          </div>
        </div>
      </section>
    </div>
  );
}

export default SalesAnalytics;

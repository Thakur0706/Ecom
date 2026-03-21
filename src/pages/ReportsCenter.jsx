import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import ReportTable from '../components/ReportTable';
import { useERPCRMContext } from '../context/ERPCRMContext';
import { useOrderContext } from '../context/OrderContext';
import { useAppContext } from '../context/AppContext';

const reportCards = [
  { key: 'sales', icon: '💰', title: 'Sales Report', description: 'Monthly revenue and order trends.' },
  { key: 'users', icon: '👥', title: 'User Report', description: 'User growth and platform activity.' },
  { key: 'inventory', icon: '📦', title: 'Inventory Report', description: 'Listing stats and category health.' },
  { key: 'transactions', icon: '🧾', title: 'Transaction Report', description: 'Payment volume and success rates.' },
  { key: 'customers', icon: '🤝', title: 'Customer Report', description: 'CRM metrics and customer segments.' },
  { key: 'performance', icon: '⚙️', title: 'Platform Performance', description: 'ERP resource metrics and support health.' },
];

const exportCsv = (filename, rows) => {
  const csvContent = rows
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

function ReportsCenter() {
  const { currentUser } = useAppContext();
  const { customers, salesData, erpResources, crmKPIs, setActiveModule } = useERPCRMContext();
  const { inventory, orders } = useOrderContext();
  const [selectedReport, setSelectedReport] = useState(null);
  const [schedules, setSchedules] = useState([
    { id: 1, name: 'Sales Summary', frequency: 'Daily', lastGenerated: '2026-03-20', nextDue: '2026-03-22', enabled: true },
    { id: 2, name: 'Inventory Snapshot', frequency: 'Weekly', lastGenerated: '2026-03-18', nextDue: '2026-03-25', enabled: true },
    { id: 3, name: 'Customer Health', frequency: 'Monthly', lastGenerated: '2026-03-01', nextDue: '2026-04-01', enabled: false },
  ]);

  useEffect(() => {
    setActiveModule('erp');
  }, [setActiveModule]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'buyer') {
    return <Navigate to="/dashboard" replace />;
  }

  const reportMap = {
    sales: {
      title: 'Sales Report',
      summary: `CampusConnect generated ₹${salesData.monthlySales.reduce((sum, month) => sum + month.revenue, 0)} across ${salesData.monthlySales.reduce((sum, month) => sum + month.orders, 0)} orders in the tracked period.`,
      columns: [
        { key: 'month', label: 'Month', sortable: true },
        { key: 'revenue', label: 'Revenue', sortable: true, render: (value) => `₹${value}` },
        { key: 'orders', label: 'Orders', sortable: true },
        { key: 'newUsers', label: 'New Users', sortable: true },
      ],
      data: salesData.monthlySales.map((row) => ({ ...row, id: row.month })),
      rowsForExport: [
        ['Month', 'Revenue', 'Orders', 'New Users'],
        ...salesData.monthlySales.map((row) => [row.month, row.revenue, row.orders, row.newUsers]),
      ],
    },
    users: {
      title: 'User Report',
      summary: `${customers.length} CRM customer profiles are active in the system, with ${customers.filter((customer) => customer.status === 'Active').length} marked as active and ${customers.filter((customer) => customer.status === 'New').length} newly onboarded.`,
      columns: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'college', label: 'College', sortable: true },
        { key: 'role', label: 'Role', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'lifetimeValue', label: 'Lifetime Value', sortable: true, render: (value) => `₹${value}` },
      ],
      data: customers,
      rowsForExport: [
        ['Name', 'College', 'Role', 'Status', 'Lifetime Value'],
        ...customers.map((customer) => [customer.name, customer.college, customer.role, customer.status, customer.lifetimeValue]),
      ],
    },
    inventory: {
      title: 'Inventory Report',
      summary: `${inventory.length} inventory items are being tracked, with ${inventory.filter((item) => item.status === 'Low Stock' || item.status === 'Out of Stock').length} requiring attention.`,
      columns: [
        { key: 'title', label: 'Product', sortable: true },
        { key: 'category', label: 'Category', sortable: true },
        { key: 'availableStock', label: 'Available', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'price', label: 'Price', sortable: true, render: (value) => `₹${value}` },
      ],
      data: inventory,
      rowsForExport: [
        ['Product', 'Category', 'Available Stock', 'Status', 'Price'],
        ...inventory.map((item) => [item.title, item.category, item.availableStock, item.status, item.price]),
      ],
    },
    transactions: {
      title: 'Transaction Report',
      summary: `${orders.length} orders are stored in the system with a ${erpResources.transactionMetrics.successRate}% success rate and an average value of ₹${erpResources.transactionMetrics.averageValue}.`,
      columns: [
        { key: 'id', label: 'Order ID', sortable: true },
        { key: 'orderStatus', label: 'Status', sortable: true },
        { key: 'paymentStatus', label: 'Payment', sortable: true },
        { key: 'totalAmount', label: 'Amount', sortable: true, render: (value) => `₹${value}` },
        { key: 'paymentMethod', label: 'Method', sortable: true },
      ],
      data: orders,
      rowsForExport: [
        ['Order ID', 'Status', 'Payment Status', 'Amount', 'Payment Method'],
        ...orders.map((order) => [order.id, order.orderStatus, order.paymentStatus, order.totalAmount, order.paymentMethod]),
      ],
    },
    customers: {
      title: 'Customer Report',
      summary: `CRM metrics show customer satisfaction at ${crmKPIs.customerSatisfaction}/5 with a retention rate of ${crmKPIs.customerRetentionRate}% and ${crmKPIs.resolvedTickets} resolved tickets.`,
      columns: [
        { key: 'segment', label: 'Metric', sortable: true },
        { key: 'value', label: 'Value', sortable: true },
      ],
      data: [
        { id: 'metric-1', segment: 'Customer Satisfaction', value: crmKPIs.customerSatisfaction },
        { id: 'metric-2', segment: 'Net Promoter Score', value: crmKPIs.netPromoterScore },
        { id: 'metric-3', segment: 'Retention Rate', value: `${crmKPIs.customerRetentionRate}%` },
        { id: 'metric-4', segment: 'Churn Rate', value: `${crmKPIs.churnRate}%` },
        { id: 'metric-5', segment: 'Resolved Tickets', value: crmKPIs.resolvedTickets },
      ],
      rowsForExport: [
        ['Metric', 'Value'],
        ['Customer Satisfaction', crmKPIs.customerSatisfaction],
        ['Net Promoter Score', crmKPIs.netPromoterScore],
        ['Retention Rate', crmKPIs.customerRetentionRate],
        ['Churn Rate', crmKPIs.churnRate],
        ['Resolved Tickets', crmKPIs.resolvedTickets],
      ],
    },
    performance: {
      title: 'Platform Performance Report',
      summary: `Platform usage includes ${erpResources.platformUsage.totalUsers} total users, ${erpResources.platformUsage.activeToday} active today, and ${erpResources.platformUsage.serverLoad}% server load.`,
      columns: [
        { key: 'metric', label: 'Metric', sortable: true },
        { key: 'value', label: 'Value', sortable: true },
      ],
      data: [
        { id: 'perf-1', metric: 'Total Users', value: erpResources.platformUsage.totalUsers },
        { id: 'perf-2', metric: 'Active Today', value: erpResources.platformUsage.activeToday },
        { id: 'perf-3', metric: 'Pending Approvals', value: erpResources.listingMetrics.pendingApproval },
        { id: 'perf-4', metric: 'Server Load', value: `${erpResources.platformUsage.serverLoad}%` },
        { id: 'perf-5', metric: 'Success Rate', value: `${erpResources.transactionMetrics.successRate}%` },
      ],
      rowsForExport: [
        ['Metric', 'Value'],
        ['Total Users', erpResources.platformUsage.totalUsers],
        ['Active Today', erpResources.platformUsage.activeToday],
        ['Pending Approvals', erpResources.listingMetrics.pendingApproval],
        ['Server Load', erpResources.platformUsage.serverLoad],
        ['Success Rate', erpResources.transactionMetrics.successRate],
      ],
    },
  };

  const preview = selectedReport ? reportMap[selectedReport] : null;

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <h1 className="text-3xl font-bold text-gray-900">Reports Center</h1>
          <p className="mt-2 text-sm text-slate-500">Generate and export platform reports</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {reportCards.map((report) => (
            <div key={report.key} className="flex h-48 flex-col justify-between rounded-2xl bg-white p-6 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              <div>
                <p className="text-3xl">{report.icon}</p>
                <h2 className="mt-4 text-xl font-bold text-gray-900">{report.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{report.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(report.key)}
                className="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
              >
                Generate Report
              </button>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900">Scheduled Reports</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-gray-100 text-slate-600">
                <tr>
                  {['Report Name', 'Frequency', 'Last Generated', 'Next Due', 'Status'].map((heading) => (
                    <th key={heading} className="px-4 py-4 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule, index) => (
                  <tr key={schedule.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-4 font-semibold text-gray-900">{schedule.name}</td>
                    <td className="px-4 py-4 text-slate-600">{schedule.frequency}</td>
                    <td className="px-4 py-4 text-slate-600">{schedule.lastGenerated}</td>
                    <td className="px-4 py-4 text-slate-600">{schedule.nextDue}</td>
                    <td className="px-4 py-4">
                      <label className="inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={schedule.enabled}
                          onChange={() =>
                            setSchedules((previous) =>
                              previous.map((item) =>
                                item.id === schedule.id ? { ...item, enabled: !item.enabled } : item,
                              ),
                            )
                          }
                          className="peer sr-only"
                        />
                        <span className="relative h-6 w-11 rounded-full bg-slate-300 transition after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-5" />
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-8">
          <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{preview.title}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">{preview.summary}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => exportCsv(`campusconnect-${selectedReport}-report.csv`, preview.rowsForExport)}
                  className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-green-700"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition-all duration-200 hover:border-blue-400 hover:text-blue-600"
                >
                  Print Report
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-8">
              <ReportTable data={preview.data} columns={preview.columns} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ReportsCenter;

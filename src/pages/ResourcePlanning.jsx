import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import ResourceUtilizationBar from '../components/ResourceUtilizationBar';
import SalesChart from '../components/SalesChart';
import { useERPCRMContext } from '../context/ERPCRMContext';
import { useAppContext } from '../context/AppContext';

const healthRows = [
  { label: 'API Response Time', value: '142ms', status: 'green' },
  { label: 'Database Connection', value: 'Connected', status: 'green' },
  { label: 'Payment Gateway', value: 'Operational', status: 'green' },
  { label: 'File Storage', value: '85% Used', status: 'yellow' },
];

const actionDefaults = [
  { id: 1, label: 'Review 7 pending listings', checked: false },
  { id: 2, label: 'Respond to 3 open support tickets', checked: false },
  { id: 3, label: 'Update platform fee policy', checked: false },
  { id: 4, label: 'Send re-engagement email to inactive users', checked: false },
  { id: 5, label: 'Generate monthly report', checked: false },
];

function ResourcePlanning() {
  const { currentUser } = useAppContext();
  const { salesData, erpResources, approvePendingListing, rejectPendingListing, setActiveModule } =
    useERPCRMContext();
  const [actionItems, setActionItems] = useState(actionDefaults);

  useEffect(() => {
    setActiveModule('erp');
  }, [setActiveModule]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'buyer') {
    return <Navigate to="/dashboard" replace />;
  }

  const userGrowthData = salesData.monthlySales.map((month) => ({
    month: month.month,
    revenue: month.newUsers,
    orders: month.newUsers,
  }));

  const handleReject = (listingId, title) => {
    if (window.confirm(`Reject ${title}?`)) {
      rejectPendingListing(listingId);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <h1 className="text-3xl font-bold text-gray-900">Resource Planning</h1>
        <p className="mt-2 text-sm text-slate-500">Monitor platform capacity and operational metrics</p>
      </div>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900">Capacity Overview</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ResourceUtilizationBar large label="User Capacity" current={erpResources.platformUsage.totalUsers} max={100} />
          <ResourceUtilizationBar large label="Listing Capacity" current={erpResources.listingMetrics.totalActive} max={500} />
          <ResourceUtilizationBar large label="Transaction Load" current={erpResources.transactionMetrics.totalProcessed} max={200} />
          <ResourceUtilizationBar large label="Server Load" current={erpResources.platformUsage.serverLoad} max={100} />
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">Listing Approval Queue</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-gray-100 text-slate-600">
                  <tr>
                    {['Title', 'Seller', 'Category', 'Submitted', 'Action'].map((heading) => (
                      <th key={heading} className="px-4 py-4 font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {erpResources.approvalQueue.map((listing, index) => (
                    <tr key={listing.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-4 font-semibold text-gray-900">{listing.title}</td>
                      <td className="px-4 py-4 text-slate-600">{listing.seller}</td>
                      <td className="px-4 py-4 text-slate-600">{listing.category}</td>
                      <td className="px-4 py-4 text-slate-600">{listing.submitted}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => approvePendingListing(listing.id)}
                            className="rounded-lg bg-emerald-500 px-3 py-2 font-semibold text-white transition-all duration-200 hover:bg-emerald-600"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(listing.id, listing.title)}
                            className="rounded-lg bg-rose-500 px-3 py-2 font-semibold text-white transition-all duration-200 hover:bg-rose-600"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">Platform Health</h2>
            <div className="mt-6 space-y-4">
              {healthRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <p className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <span
                      className={`h-3 w-3 rounded-full ${row.status === 'green' ? 'bg-emerald-500' : row.status === 'yellow' ? 'bg-amber-400' : 'bg-rose-500'}`}
                    />
                    {row.label}
                  </p>
                  <p className="font-semibold text-gray-900">{row.value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">User Acquisition</h2>
            <div className="mt-6">
              <SalesChart data={userGrowthData} valueKey="revenue" captionKey="orders" />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">Action Items</h2>
            <div className="mt-6 space-y-4">
              {actionItems.map((item) => (
                <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() =>
                      setActionItems((previous) =>
                        previous.map((entry) =>
                          entry.id === item.id ? { ...entry, checked: !entry.checked } : entry,
                        ),
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className={`text-sm ${item.checked ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>
                    {item.checked ? '✓ ' : ''}
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ResourcePlanning;

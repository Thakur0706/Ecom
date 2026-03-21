import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import KPICard from '../components/KPICard';
import { useAppContext } from '../context/AppContext';
import { useERPCRMContext } from '../context/ERPCRMContext';
import { useOrderContext } from '../context/OrderContext';

function AdminPanel() {
  const { currentUser } = useAppContext();
  const { customers, salesData, erpResources, approvePendingListing, rejectPendingListing } = useERPCRMContext();
  const { orders, inventory } = useOrderContext();
  const [activeTab, setActiveTab] = useState('Manage Listings');

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const totalRevenue = salesData.monthlySales.reduce((sum, month) => sum + month.revenue, 0);
  const adminStats = [
    { title: 'Total Users', value: customers.length, icon: '👥', color: 'bg-blue-100 text-blue-600' },
    { title: 'Total Listings', value: inventory.length, icon: '📦', color: 'bg-indigo-100 text-indigo-600' },
    { title: 'Total Orders', value: orders.length, icon: '🛒', color: 'bg-emerald-100 text-emerald-600' },
    { title: 'Revenue', value: `₹${totalRevenue}`, icon: '💰', color: 'bg-amber-100 text-amber-600' },
  ];

  const handleReject = (listingId, title) => {
    if (window.confirm(`Reject ${title}?`)) {
      rejectPendingListing(listingId);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-[2rem] bg-white p-8 shadow-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Admin Panel</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">CampusConnect operations overview</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/erp"
              className="rounded-lg bg-blue-500 px-4 py-3 text-center font-semibold text-white transition hover:bg-indigo-500"
            >
              ERP Dashboard
            </Link>
            <Link
              to="/crm"
              className="rounded-lg border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
            >
              CRM Dashboard
            </Link>
            <Link
              to="/reports"
              className="rounded-lg border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
            >
              Reports Center
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((stat) => (
          <KPICard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="mt-8 rounded-[2rem] bg-white p-8 shadow-md">
        <div className="flex flex-wrap gap-3">
          {['Manage Listings', 'Manage Users', 'Reports'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Manage Listings' && (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-100 text-slate-600">
                <tr>
                  <th className="px-4 py-4 font-semibold">Listing Title</th>
                  <th className="px-4 py-4 font-semibold">Seller</th>
                  <th className="px-4 py-4 font-semibold">Category</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {erpResources.approvalQueue.map((row, index) => (
                  <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-4 font-medium text-slate-900">{row.title}</td>
                    <td className="px-4 py-4 text-slate-600">{row.seller}</td>
                    <td className="px-4 py-4 text-slate-600">{row.category}</td>
                    <td className="px-4 py-4 text-slate-600">Pending</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => approvePendingListing(row.id)}
                          className="rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-600"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(row.id, row.title)}
                          className="rounded-lg bg-rose-50 px-3 py-2 font-semibold text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {erpResources.approvalQueue.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-slate-500">
                      No pending listings left in the queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Manage Users' && (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-100 text-slate-600">
                <tr>
                  <th className="px-4 py-4 font-semibold">User Name</th>
                  <th className="px-4 py-4 font-semibold">Email</th>
                  <th className="px-4 py-4 font-semibold">Role</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Lifetime Value</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((row, index) => (
                  <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-4 font-medium text-slate-900">{row.name}</td>
                    <td className="px-4 py-4 text-slate-600">{row.email}</td>
                    <td className="px-4 py-4 capitalize text-slate-600">{row.role}</td>
                    <td className="px-4 py-4 text-slate-600">{row.status}</td>
                    <td className="px-4 py-4 text-slate-600">₹{row.lifetimeValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Reports' && (
          <div className="mt-8">
            <div className="grid gap-6 md:grid-cols-4">
              {salesData.categorySales.map((report) => (
                <div key={report.category} className="rounded-2xl bg-slate-50 p-5 text-center">
                  <div className="flex h-56 items-end justify-center">
                    <div
                      className="w-20 rounded-t-2xl bg-gradient-to-t from-blue-500 to-indigo-500"
                      style={{ height: `${Math.max(report.percentage * 2, 12)}px` }}
                    />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-700">{report.category}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">₹{report.revenue}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;

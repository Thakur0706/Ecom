import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { api } from '../lib/api';

const sellerReportCards = [
  { key: 'sales', title: 'Sales summary', description: 'Revenue summary for your delivered orders.' },
  { key: 'orders', title: 'Order history', description: 'Detailed order history across your sales.' },
  { key: 'customers', title: 'Customer list', description: 'Buyer list with purchase totals and counts.' },
];

const adminReportCards = [
  { key: 'orders', title: 'All orders', description: 'Platform-wide order export.' },
  { key: 'users', title: 'All users', description: 'All student users with status and join dates.' },
  { key: 'sellers', title: 'All sellers', description: 'Seller verification and approval export.' },
  { key: 'revenue', title: 'Revenue summary', description: 'Delivered-order revenue rollup.' },
  { key: 'product-performance', title: 'Product performance', description: 'Top products by units sold and revenue.' },
];

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ReportsCenter() {
  const { currentUser } = useAppContext();
  const [filters, setFilters] = useState({
    from: '',
    to: '',
  });
  const [message, setMessage] = useState('');

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = currentUser.role === 'admin';
  const reportCards = isAdmin ? adminReportCards : sellerReportCards;

  const handleDownload = async (type) => {
    try {
      const blob = isAdmin
        ? await api.admin.downloadReport({ type, ...filters })
        : await api.seller.downloadReport({ type, ...filters });
      downloadBlob(blob, `campusconnect-${type}-report.csv`);
      setMessage(`Downloaded ${type} report successfully.`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to generate report.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className={`rounded-2xl p-6 shadow-md ${isAdmin ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <h1 className="text-3xl font-bold">Reports Center</h1>
        <p className={`mt-2 text-sm ${isAdmin ? 'text-slate-300' : 'text-slate-500'}`}>
          Generate and download CSV exports for {isAdmin ? 'platform-wide' : 'seller-side'} reporting.
        </p>
      </div>

      {message && (
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-2xl font-bold text-slate-900">Date range filter</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            type="date"
            value={filters.from}
            onChange={(event) => setFilters((previous) => ({ ...previous, from: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(event) => setFilters((previous) => ({ ...previous, to: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportCards.map((report) => (
          <div key={report.key} className="rounded-2xl bg-white p-6 shadow-md">
            <h3 className="text-xl font-bold text-slate-900">{report.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">{report.description}</p>
            <button
              type="button"
              onClick={() => handleDownload(report.key)}
              className="mt-6 rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500"
            >
              Download CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReportsCenter;

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { api } from '../lib/api';

function SupplierDashboard() {
  const { currentUser } = useAppContext();

  const ledgerSummaryQuery = useQuery({
    queryKey: ['supplier', 'ledger-summary'],
    queryFn: api.supplier.ledgerSummary,
  });

  const summary = ledgerSummaryQuery.data?.data?.summary || { pending: 0, paid: 0, earned: 0 };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-amber-100 border-t-4 border-amber-500">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-amber-600">
              Supplier Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900 tracking-tight">Welcome, {currentUser.name}</h1>
            <p className="mt-2 text-slate-500">
              Manage your product listings and track your earnings from sales.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/supplier/products/new"
              className="rounded-lg bg-amber-500 px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-amber-600 hover:shadow-amber-500/20"
            >
              Add New Product
            </Link>
            <Link
              to="/supplier/products"
              className="rounded-lg border-2 border-slate-200 bg-white px-5 py-3 text-center font-bold text-slate-700 transition hover:border-amber-400 hover:text-amber-600"
            >
              My Products
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md border-l-4 border-l-emerald-500">
          <p className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Total Earned</p>
          <p className="mt-2 text-4xl font-black text-slate-900">₹ {summary.earned.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md border-l-4 border-l-amber-500">
          <p className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Pending Payout</p>
          <p className="mt-2 text-4xl font-black text-slate-900">₹ {summary.pending.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md border-l-4 border-l-blue-500">
          <p className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Already Paid</p>
          <p className="mt-2 text-4xl font-black text-slate-900">₹ {summary.paid.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Quick Actions</h2>
          <div className="grid gap-4 mt-6">
            <button 
              onClick={() => {
                 window.location.href = '/supplier/profile';
                 // A simple way to jump to orders tab conceptually, or just let them switch tabs.
                 // Ideally we'd use state, but a direct link to the Orders page is better.
              }}
              className="block rounded-xl border border-slate-100 bg-slate-50 p-6 transition hover:border-amber-200 hover:bg-amber-50/50 text-left w-full"
            >
              <h3 className="font-bold text-slate-900 text-lg">🛍️ My Orders & Chats</h3>
              <p className="text-slate-500 text-sm mt-1">Manage incoming orders, update shipping statuses, and chat directly with Admins.</p>
            </button>
            <Link to="/supplier/ledger" className="block rounded-xl border border-slate-100 bg-slate-50 p-6 transition hover:border-amber-200 hover:bg-amber-50/50">
              <h3 className="font-bold text-slate-900 text-lg">💰 Payment Ledger</h3>
              <p className="text-slate-500 text-sm mt-1">View Detailed breakdown of your credits and payouts.</p>
            </Link>
            <Link to="/supplier/profile" className="block rounded-xl border border-slate-100 bg-slate-50 p-6 transition hover:border-amber-200 hover:bg-amber-50/50">
              <h3 className="font-bold text-slate-900 text-lg">⚙️ Update Profile & Bank</h3>
              <p className="text-slate-500 text-sm mt-1">Make sure your UPI/Bank details are up to date for seamless payouts.</p>
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] bg-amber-50 p-8 shadow-sm ring-1 ring-amber-100">
          <h2 className="text-2xl font-bold text-amber-900 mb-6 tracking-tight">How supplying works</h2>
          <ul className="space-y-4 text-amber-800">
            <li className="flex items-start">
              <span className="mr-3 font-bold text-amber-500">1.</span>
              <p>You quote your price per unit when you submit a product listing.</p>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold text-amber-500">2.</span>
              <p>The admin reviews your listing, sets the final selling price for buyers, and approves it.</p>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold text-amber-500">3.</span>
              <p>When buyers order, your stock count decreases and credits are added to your ledger securely.</p>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold text-amber-500">4.</span>
              <p>Admins handle shipping and fulfillment, resolving buyer queries along the way!</p>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default SupplierDashboard;

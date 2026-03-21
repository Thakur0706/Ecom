import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useERPCRMContext } from '../context/ERPCRMContext';

const roleStyles = {
  Buyer: 'bg-blue-100 text-blue-700',
  Seller: 'bg-emerald-100 text-emerald-700',
  Both: 'bg-purple-100 text-purple-700',
};

const statusStyles = {
  Active: 'bg-emerald-100 text-emerald-700',
  Inactive: 'bg-slate-100 text-slate-700',
  New: 'bg-blue-100 text-blue-700',
};

const daysAgo = (timestamp) => {
  const diffMs = new Date('2026-03-21T23:59:59+05:30').getTime() - new Date(timestamp).getTime();
  return Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0);
};

function CustomerProfileCard({ customer }) {
  const { addCustomerNote, setSelectedCustomer } = useERPCRMContext();
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [note, setNote] = useState('');

  const initials = customer.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSaveNote = () => {
    if (!note.trim()) {
      return;
    }

    addCustomerNote(customer.id, note);
    setNote('');
    setShowNoteBox(false);
  };

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="h-10 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      <div className="px-6 pb-6">
        <div className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-lg font-bold text-blue-700">
          {initials}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-bold text-slate-900">{customer.name}</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleStyles[customer.role]}`}>
            {customer.role}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[customer.status]}`}>
            {customer.status}
          </span>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          {customer.college} · {customer.department}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">Orders</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{customer.totalOrders}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">Spent</p>
            <p className="mt-1 text-lg font-bold text-slate-900">₹{customer.totalSpent}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">Sales</p>
            <p className="mt-1 text-lg font-bold text-slate-900">₹{customer.totalSales}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm text-slate-600">
          <p>
            Satisfaction:{' '}
            <span className="text-amber-400">
              {Array.from({ length: 5 }, (_, index) => (index < customer.satisfactionScore ? '★' : '☆')).join(' ')}
            </span>
          </p>
          <p>
            Preferred Category:{' '}
            <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">
              {customer.preferredCategory}
            </span>
          </p>
          <p>Last Activity: {daysAgo(customer.lastActivity)} days ago</p>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            to={`/customers/${customer.id}`}
            onClick={() => setSelectedCustomer(customer)}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-center font-semibold text-slate-700 transition-all duration-200 hover:border-blue-400 hover:text-blue-600"
          >
            View Profile
          </Link>
          <button
            type="button"
            onClick={() => setShowNoteBox((previous) => !previous)}
            className="flex-1 rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
          >
            Add Note
          </button>
        </div>

        {showNoteBox && (
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <textarea
              rows="3"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a note about this customer"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setShowNoteBox(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default CustomerProfileCard;

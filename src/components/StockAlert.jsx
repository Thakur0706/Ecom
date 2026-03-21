import { useState } from 'react';
import { Link } from 'react-router-dom';

function StockAlert({ alerts }) {
  const [dismissed, setDismissed] = useState(false);

  if (!alerts.length || dismissed) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[2]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.86 1.82 18A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-3l-8.48-14.14a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-amber-900">
              You have {alerts.length} items with low or no stock
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-amber-800">
              {alerts.slice(0, 3).map((item) => (
                <span key={item.id} className="rounded-full bg-white/80 px-3 py-1">
                  {item.title} ({item.availableStock} left)
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/inventory?status=alerts"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-amber-600"
          >
            View All
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 transition-all duration-200 hover:bg-amber-100"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default StockAlert;

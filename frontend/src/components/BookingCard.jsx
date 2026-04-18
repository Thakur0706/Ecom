import { useNavigate } from 'react-router-dom';
import OrderStatusBadge from './OrderStatusBadge';

function BookingCard({ booking }) {
  const navigate = useNavigate();

  return (
    <article className="rounded-2xl bg-white p-6 shadow-md transition-all duration-200 hover:shadow-lg">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current stroke-[1.8]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18M16 19h6M19 16v6" />
            </svg>
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-bold text-slate-900">{booking.id}</h3>
              <p className="text-sm text-slate-500">
                {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold text-slate-900">{booking.serviceTitle}</p>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                Service
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span>Time: {new Date(booking.scheduledDate).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
              <span>
                Provider: <span className="font-semibold text-slate-800">{booking.supplierName}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl font-bold text-slate-900">₹{booking.totalAmount}</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {booking.paymentStatus}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {booking.paymentMethod}
              </span>
              <OrderStatusBadge status={booking.bookingStatus} />
            </div>
            {booking.transactionId && (
              <p className="text-xs text-slate-400">
                Txn ID: <span className="font-mono">{booking.transactionId}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-64">
           {booking.chatEnabled && (
             <button
                type="button"
                onClick={() => navigate(`/chat/${booking.supplierId}`)}
                className="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
              >
                Chat with Provider
              </button>
           )}
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition-all duration-200 hover:border-blue-400 hover:text-blue-600"
          >
            Booking Details
          </button>
        </div>
      </div>
    </article>
  );
}

export default BookingCard;

import { Link, Navigate } from 'react-router-dom';
import { useOrderContext } from '../context/OrderContext';
import { useAppContext } from '../context/AppContext';

function Bookings() {
  const { currentUser } = useAppContext();
  const { bookings, serviceBookings } = useOrderContext();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const rows = currentUser.role === 'seller' ? serviceBookings : bookings;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Bookings</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {currentUser.role === 'seller' ? 'Service bookings received' : 'My service bookings'}
        </h1>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-md">
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-4 font-semibold">Booking ID</th>
                  <th className="pb-4 font-semibold">Service</th>
                  <th className="pb-4 font-semibold">Counterparty</th>
                  <th className="pb-4 font-semibold">Scheduled</th>
                  <th className="pb-4 font-semibold">Duration</th>
                  <th className="pb-4 font-semibold">Status</th>
                  <th className="pb-4 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((booking) => (
                  <tr key={booking.id}>
                    <td className="py-4 font-medium text-slate-900">{booking.id}</td>
                    <td className="py-4 text-slate-600">{booking.serviceTitle}</td>
                    <td className="py-4 text-slate-600">
                      {currentUser.role === 'seller' ? booking.buyerName : booking.sellerName}
                    </td>
                    <td className="py-4 text-slate-600">
                      {new Date(booking.scheduledDate).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4 text-slate-600">{booking.duration}</td>
                    <td className="py-4 text-slate-600">{booking.bookingStatus}</td>
                    <td className="py-4 text-slate-600">Rs {booking.totalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 px-6 py-12 text-center">
            <h2 className="text-2xl font-bold text-slate-900">No bookings yet</h2>
            <p className="mt-3 text-sm text-slate-500">
              Service bookings will appear here once they are created.
            </p>
            <Link
              to="/services"
              className="mt-6 inline-flex rounded-lg bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500"
            >
              Browse Services
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Bookings;

import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useOrderContext } from '../context/OrderContext';

function Dashboard() {
  const { currentUser } = useAppContext();
  const { orders, bookings } = useOrderContext();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const purchaseOrders = orders.filter((order) => order.buyerId === currentUser.id);
  const totalSpent = purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-500">
              Buyer Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900 tracking-tight">Welcome back, {currentUser.name}</h1>
            <p className="mt-2 text-slate-500">
              Review your recent orders, service bookings, and track your activity.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/products"
              className="rounded-lg bg-indigo-600 px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-indigo-500/20"
            >
              Browse Products
            </Link>
            <Link
              to="/bookings"
              className="rounded-lg border-2 border-slate-200 bg-white px-5 py-3 text-center font-bold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
          <p className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Orders Placed</p>
          <p className="mt-2 text-4xl font-black text-slate-900">{purchaseOrders.length}</p>
        </div>
        <div className="rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
          <p className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Bookings Created</p>
          <p className="mt-2 text-4xl font-black text-slate-900">{bookings.length}</p>
        </div>
        <div className="rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
          <p className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Total Spent</p>
          <p className="mt-2 text-4xl font-black text-slate-900 text-indigo-600">₹ {totalSpent.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Recent Orders</h2>
          <div className="space-y-4">
            {purchaseOrders.slice(0, 5).map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="block rounded-2xl bg-slate-50 p-4 transition hover:bg-indigo-50 border border-slate-100">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900">{order.items?.[0]?.title || 'Product Order'}</p>
                    <p className="text-xs font-semibold text-slate-500 uppercase mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {order.orderStatus}
                  </span>
                </div>
              </Link>
            ))}
            {purchaseOrders.length === 0 && (
              <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
                No purchases yet. Start exploring the marketplace!
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Want to supply items?</h2>
          <div className="flex flex-col gap-4">
            <p className="text-slate-600">
              CampusConnect allows approved students to supply electronic components, modules, and parts to other students.
            </p>
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-6 text-center">
              <Link to="/supplier/apply" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-indigo-500/20">
                Apply to become a Supplier
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;

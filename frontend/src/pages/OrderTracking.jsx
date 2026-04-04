import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderTimeline from '../components/OrderTimeline';
import { useOrderContext } from '../context/OrderContext';
import { useAppContext } from '../context/AppContext';

const getDeliveryMessage = (order) => {
  if (order.orderStatus === 'Delivered') {
    return `Delivered on ${new Date(order.updatedAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  }

  if (order.orderStatus === 'Cancelled') {
    return 'This order was cancelled before delivery.';
  }

  if (order.orderStatus === 'Shipped') {
    return 'Estimated delivery in 1-2 days';
  }

  if (order.orderStatus === 'Confirmed') {
    return 'Estimated delivery in 4-5 days';
  }

  return 'Estimated delivery in 5-7 days';
};

function OrderTracking() {
  const { id } = useParams();
  const { currentUser } = useAppContext();
  const { orders } = useOrderContext();
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);

  const order = orders.find((item) => item.id === id);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        <div className="mt-8 h-96 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-md">
          <h1 className="text-3xl font-bold text-slate-900">Order not found</h1>
          <Link to="/orders" className="mt-4 inline-block font-semibold text-blue-600">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Tracking</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Track Your Order</h1>
          <p className="mt-2 text-sm text-slate-500">
            {order.id} · {order.product.title}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <OrderStatusBadge status={order.orderStatus} large />
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {getDeliveryMessage(order)}
            </span>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-md">
          <div className="mx-auto max-w-2xl">
            <OrderTimeline timeline={order.timeline} large />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900">Delivery Address</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{order.deliveryAddress}</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900">Need help?</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Contact the seller if you need to confirm delivery timing or pickup details.
            </p>
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="mt-6 rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
            >
              Contact Seller
            </button>
            <Link
              to={`/orders/${order.id}`}
              className="mt-4 block text-sm font-semibold text-blue-600 transition hover:text-indigo-600"
            >
              Back to Order Details
            </Link>
          </div>
        </div>
      </div>

      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8">
            <h3 className="text-2xl font-bold text-slate-900">Seller Contact Info</h3>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <p>Name: <span className="font-semibold text-slate-900">{order.sellerName}</span></p>
              <p>Email: <span className="font-semibold text-slate-900">{order.sellerEmail || 'seller@campusconnect.com'}</span></p>
              <p>Phone: <span className="font-semibold text-slate-900">Shared after confirmation</span></p>
              <p>Preferred Hours: <span className="font-semibold text-slate-900">5 PM - 8 PM</span></p>
            </div>
            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="mt-6 w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default OrderTracking;

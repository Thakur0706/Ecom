import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderTimeline from '../components/OrderTimeline';
import { useOrderContext } from '../context/OrderContext';
import { useAppContext } from '../context/AppContext';

const categoryStyles = {
  Books: 'bg-blue-100 text-blue-700',
  Electronics: 'bg-indigo-100 text-indigo-700',
  Accessories: 'bg-emerald-100 text-emerald-700',
  Stationery: 'bg-amber-100 text-amber-700',
};

const paymentStyles = {
  Paid: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-700',
};

const nextStatusMap = {
  Confirmed: ['Shipped'],
  Shipped: ['Delivered'],
};

const getEstimatedDelivery = (order) => {
  if (order.orderStatus === 'Delivered') {
    return `Delivered on ${new Date(order.updatedAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  }

  if (order.orderStatus === 'Cancelled') {
    return 'Delivery cancelled';
  }

  if (order.orderStatus === 'Shipped') {
    return 'Estimated in 1-2 days';
  }

  if (order.orderStatus === 'Confirmed') {
    return 'Estimated in 4-5 days';
  }

  return 'Estimated in 5-7 days';
};

function OrderDetail() {
  const { id } = useParams();
  const { currentUser } = useAppContext();
  const { orders, cancelOrder, updateOrderStatus, setSelectedOrder } = useOrderContext();
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const order = orders.find((item) => item.id === id);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (order) {
      setSelectedOrder(order);
      setSelectedStatus(nextStatusMap[order.orderStatus]?.[0] || '');
    }
  }, [order, setSelectedOrder]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        </div>
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

  const canManageAsSeller = currentUser.role === 'seller' || currentUser.role === 'both';
  const totalPaid = order.totalAmount + order.platformFee;

  const handleCancelOrder = () => {
    if (window.confirm(`Cancel ${order.id}? This action cannot be undone.`)) {
      cancelOrder(order.id);
    }
  };

  const handleReviewSubmit = (event) => {
    event.preventDefault();
    setShowReviewModal(false);
    setReviewRating(5);
    setReviewText('');
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link to="/orders" className="text-sm font-semibold text-blue-600 transition hover:text-indigo-600">
                Back to Orders
              </Link>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">{order.id}</h1>
              <p className="mt-2 text-sm text-slate-500">
                Ordered on{' '}
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <OrderStatusBadge status={order.orderStatus} large />
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${paymentStyles[order.paymentStatus]}`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900">Product Info</h2>
            <div className="mt-6 flex flex-col gap-5 sm:flex-row">
              <img
                src={order.product.image}
                alt={order.product.title}
                className="h-32 w-32 rounded-2xl object-cover"
              />
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xl font-semibold text-slate-900">{order.product.title}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryStyles[order.product.category]}`}
                  >
                    {order.product.category}
                  </span>
                </div>
                <p className="text-sm text-slate-600">Condition: {order.product.condition}</p>
                <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p>Quantity: <span className="font-semibold text-slate-900">{order.quantity}</span></p>
                  <p>Unit Price: <span className="font-semibold text-slate-900">₹{order.unitPrice}</span></p>
                  <p>Subtotal: <span className="font-semibold text-slate-900">₹{order.totalAmount}</span></p>
                  <p>Platform Fee: <span className="font-semibold text-slate-900">₹{order.platformFee}</span></p>
                  <p className="sm:col-span-2">
                    Total Amount Paid: <span className="text-lg font-bold text-slate-900">₹{totalPaid}</span>
                  </p>
                  <p className="sm:col-span-2">
                    Payment Method: <span className="font-semibold text-slate-900">{order.paymentMethod}</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900">Delivery Info</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 px-4 py-4">
                <p className="font-semibold text-slate-900">Delivery Address</p>
                <p className="mt-1">{order.deliveryAddress}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 px-4 py-4">
                  <p className="font-semibold text-slate-900">Estimated Delivery</p>
                  <p className="mt-1">{getEstimatedDelivery(order)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-4">
                  <p className="font-semibold text-slate-900">Buyer / Seller</p>
                  <p className="mt-1">Buyer: {order.buyerName}</p>
                  <p>Seller: {order.sellerName}</p>
                </div>
              </div>
              {order.notes && (
                <div className="rounded-xl bg-blue-50 px-4 py-4 text-blue-700">
                  <p className="font-semibold">Notes</p>
                  <p className="mt-1">{order.notes}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900">Order Timeline</h2>
          <div className="mt-6">
            <OrderTimeline timeline={order.timeline} />
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900">Actions</h2>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            {order.orderStatus === 'Placed' && (
              <button
                type="button"
                onClick={handleCancelOrder}
                className="rounded-lg bg-rose-500 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-rose-600"
              >
                Cancel Order
              </button>
            )}

            {canManageAsSeller && nextStatusMap[order.orderStatus]?.length > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                >
                  {nextStatusMap[order.orderStatus].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => updateOrderStatus(order.id, selectedStatus)}
                  className="rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
                >
                  Update Status
                </button>
              </div>
            )}

            {order.orderStatus === 'Delivered' && (
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
              >
                Leave Review
              </button>
            )}
          </div>
        </section>
      </div>

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8">
            <h3 className="text-2xl font-bold text-slate-900">Review This Order</h3>
            <form onSubmit={handleReviewSubmit} className="mt-6 space-y-5">
              <div className="flex gap-2 text-2xl text-amber-400">
                {Array.from({ length: 5 }, (_, index) => {
                  const starValue = index + 1;
                  return (
                    <button key={starValue} type="button" onClick={() => setReviewRating(starValue)}>
                      {starValue <= reviewRating ? '★' : '☆'}
                    </button>
                  );
                })}
              </div>
              <textarea
                rows="4"
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                placeholder="Share your review"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-3 font-semibold text-slate-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default OrderDetail;

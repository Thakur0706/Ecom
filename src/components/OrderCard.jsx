import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderStatusBadge from './OrderStatusBadge';
import { useOrderContext } from '../context/OrderContext';

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
  Placed: ['Confirmed'],
  Confirmed: ['Shipped'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

function OrderCard({ order, viewMode = 'purchases' }) {
  const navigate = useNavigate();
  const { cancelOrder, updateOrderStatus, setSelectedOrder } = useOrderContext();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(nextStatusMap[order.orderStatus][0] || '');

  useEffect(() => {
    setSelectedStatus(nextStatusMap[order.orderStatus][0] || '');
  }, [order.orderStatus]);

  const handleOpenOrder = (path) => {
    setSelectedOrder(order);
    navigate(path);
  };

  const handleCancel = () => {
    if (window.confirm(`Cancel ${order.id}? This action cannot be undone.`)) {
      cancelOrder(order.id);
    }
  };

  const handleStatusUpdate = () => {
    if (selectedStatus) {
      updateOrderStatus(order.id, selectedStatus);
    }
  };

  const handleReviewSubmit = (event) => {
    event.preventDefault();
    setShowReviewModal(false);
    setReviewRating(5);
    setReviewText('');
  };

  const counterpartLabel = viewMode === 'sales' ? 'Buyer' : 'Seller';
  const counterpartName = viewMode === 'sales' ? order.buyerName : order.sellerName;

  return (
    <>
      <article className="rounded-2xl bg-white p-6 shadow-md transition-all duration-200 hover:shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row">
            <img
              src={order.product.image}
              alt={order.product.title}
              className="h-24 w-24 rounded-2xl object-cover"
            />
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-bold text-slate-900">{order.id}</h3>
                <p className="text-sm text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-lg font-semibold text-slate-900">{order.product.title}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryStyles[order.product.category]}`}
                >
                  {order.product.category}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <span>Qty: {order.quantity}</span>
                <span>Unit Price: ₹{order.unitPrice}</span>
                <span>
                  {counterpartLabel}: <span className="font-semibold text-slate-800">{counterpartName}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xl font-bold text-slate-900">₹{order.totalAmount}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStyles[order.paymentStatus]}`}
                >
                  {order.paymentStatus}
                </span>
                <OrderStatusBadge status={order.orderStatus} />
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-64">
            <button
              type="button"
              onClick={() => handleOpenOrder(`/orders/${order.id}`)}
              className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition-all duration-200 hover:border-blue-400 hover:text-blue-600"
            >
              View Details
            </button>
            <button
              type="button"
              onClick={() => handleOpenOrder(`/orders/${order.id}/track`)}
              className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition-all duration-200 hover:border-blue-400 hover:text-blue-600"
            >
              Track Order
            </button>
            {order.orderStatus === 'Placed' && (
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg bg-rose-500 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-rose-600"
              >
                Cancel Order
              </button>
            )}
            {order.orderStatus === 'Delivered' && (
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
              >
                Leave Review
              </button>
            )}
            {viewMode === 'sales' && nextStatusMap[order.orderStatus].length > 0 && (
              <div className="rounded-xl border border-slate-200 p-3">
                <label htmlFor={`status-${order.id}`} className="mb-2 block text-xs font-semibold text-slate-500">
                  Update Status
                </label>
                <div className="flex gap-2">
                  <select
                    id={`status-${order.id}`}
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    {nextStatusMap[order.orderStatus].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleStatusUpdate}
                    className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8">
            <h3 className="text-2xl font-bold text-slate-900">Leave a Review</h3>
            <p className="mt-2 text-sm text-slate-500">Share your experience with this order.</p>
            <form onSubmit={handleReviewSubmit} className="mt-6 space-y-5">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Rating</p>
                <div className="flex gap-2 text-2xl text-amber-400">
                  {Array.from({ length: 5 }, (_, index) => {
                    const starValue = index + 1;

                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setReviewRating(starValue)}
                      >
                        {starValue <= reviewRating ? '★' : '☆'}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label htmlFor="reviewText" className="mb-2 block text-sm font-semibold text-slate-700">
                  Comment
                </label>
                <textarea
                  id="reviewText"
                  rows="4"
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  placeholder="Tell other students about the item and delivery experience"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300"
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

export default OrderCard;

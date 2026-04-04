import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { api } from '../lib/api';

function Cart() {
  const { currentUser, cart, removeFromCart, updateQuantity } = useAppContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const orderMutation = useMutation({
    mutationFn: api.orders.create,
  });

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const total = subtotal;

  const handlePayment = async () => {
    if (!deliveryAddress.trim()) {
      return;
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, 2000);
    });

    try {
      const response = await orderMutation.mutateAsync({
        deliveryAddress,
      });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      const createdOrders = response.data.orders || [];
      const firstOrderId = createdOrders[0]?._id;

      if (firstOrderId) {
        setSuccessMessage(`Payment successful. Order ID: ${firstOrderId}`);
        window.setTimeout(() => {
          navigate(`/orders/${firstOrderId}`);
        }, 1200);
      }
    } catch (error) {
      setSuccessMessage(error.response?.data?.message || 'Unable to place the order.');
    }
  };

  if (cart.length === 0 && !successMessage) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-[2rem] bg-white px-6 py-16 text-center shadow-md">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current stroke-[1.8]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16l-1.5 9h-13z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7a4 4 0 0 1 8 0" />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-slate-900">Your cart is empty</h1>
          <p className="mt-3 text-sm text-slate-500">
            Browse campus listings and add a few great finds to get started.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/products"
              className="rounded-lg bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500"
            >
              Browse Products
            </Link>
            <Link
              to="/services"
              className="rounded-lg border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Cart</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Review your selected items</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-[2rem] bg-white p-5 shadow-md sm:flex-row sm:items-center"
              >
                <img src={item.image} alt={item.title} className="h-28 w-full rounded-2xl object-cover sm:w-36" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.category} by {item.seller}
                  </p>
                  <p className="mt-3 text-lg font-bold text-blue-600">Rs {item.price}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center text-lg font-semibold text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-8 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900">Order Summary</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">Rs {subtotal}</span>
              </div>
              <div>
                <label htmlFor="deliveryAddress" className="mb-2 block font-semibold text-slate-700">
                  Delivery Address
                </label>
                <textarea
                  id="deliveryAddress"
                  rows="4"
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  placeholder="Hostel / room / pickup point"
                />
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between text-base">
                  <span className="font-semibold text-slate-700">Total</span>
                  <span className="text-2xl font-bold text-blue-600">Rs {total}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-8 w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500"
            >
              Pay Now
            </button>
          </aside>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-6">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-slate-900">Dummy Payment</h3>
            <p className="mt-2 text-sm text-slate-500">Enter any values below. Payment will always succeed.</p>
            <div className="mt-6 space-y-4">
              <input
                type="text"
                value={paymentForm.cardNumber}
                onChange={(event) =>
                  setPaymentForm((previous) => ({ ...previous, cardNumber: event.target.value }))
                }
                placeholder="Card Number"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  value={paymentForm.expiry}
                  onChange={(event) =>
                    setPaymentForm((previous) => ({ ...previous, expiry: event.target.value }))
                  }
                  placeholder="Expiry"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
                <input
                  type="text"
                  value={paymentForm.cvv}
                  onChange={(event) =>
                    setPaymentForm((previous) => ({ ...previous, cvv: event.target.value }))
                  }
                  placeholder="CVV"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            {successMessage && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-3 font-semibold text-slate-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePayment}
                disabled={orderMutation.isPending || !deliveryAddress.trim()}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {orderMutation.isPending ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Cart;

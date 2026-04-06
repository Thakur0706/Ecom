import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { api } from '../lib/api';
import { loadRazorpayCheckout } from '../lib/razorpay';

const paymentOptions = [
  {
    id: 'upi',
    label: 'UPI',
    description: 'Pay instantly using your UPI ID and UPI PIN.',
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Pay securely using Razorpay card checkout.',
    accent: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay when the product reaches you. Coupons do not apply.',
    accent: 'border-amber-200 bg-amber-50 text-amber-800',
  },
];

function isValidUpiId(value = '') {
  return /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(value.trim());
}

function buildCardCheckoutConfig() {
  return {
    display: {
      blocks: {
        cards_only: {
          name: 'Pay via Card',
          instruments: [
            {
              method: 'card',
            },
          ],
        },
      },
      sequence: ['block.cards_only'],
      preferences: {
        show_default_blocks: false,
      },
    },
  };
}

function Cart() {
  const { currentUser, cart, removeFromCart, updateQuantity } = useAppContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [processingMethod, setProcessingMethod] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiPin, setUpiPin] = useState('');

  const checkoutSessionMutation = useMutation({
    mutationFn: api.orders.createCheckoutSession,
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: api.orders.verifyPayment,
  });

  const directOrderMutation = useMutation({
    mutationFn: api.orders.create,
  });

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const total = subtotal;
  const normalizedCouponCode = couponCode.trim().toUpperCase();
  const isProcessing =
    checkoutSessionMutation.isPending || verifyPaymentMutation.isPending || directOrderMutation.isPending;

  const closePaymentModal = () => {
    setProcessingMethod('');
    setSelectedMethod('');
    setUpiId('');
    setUpiPin('');
    setShowModal(false);
  };

  const finalizeOrderSuccess = async (createdOrders, successText) => {
    const firstOrderId = createdOrders[0]?._id;

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cart'] }),
      queryClient.invalidateQueries({ queryKey: ['orders'] }),
    ]);

    setPaymentMessage(successText);
    setProcessingMethod('');
    setSelectedMethod('');
    setUpiId('');
    setUpiPin('');
    setShowModal(false);

    if (firstOrderId) {
      window.setTimeout(() => {
        navigate(`/orders/${firstOrderId}`);
      }, 900);
    }
  };

  const handleCardCheckout = async () => {
    if (!deliveryAddress.trim()) {
      setPaymentMessage('Add a delivery address before continuing to payment.');
      return;
    }

    setPaymentMessage('');
    setSelectedMethod('card');
    setProcessingMethod('card');

    try {
      const Razorpay = await loadRazorpayCheckout();

      if (!Razorpay) {
        throw new Error('Payment checkout did not load correctly.');
      }

      const checkoutResponse = await checkoutSessionMutation.mutateAsync({
        deliveryAddress,
        preferredMethod: 'card',
        couponCode: normalizedCouponCode,
      });
      const checkout = checkoutResponse.data.checkout;

      const razorpay = new Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        order_id: checkout.razorpayOrderId,
        name: 'CampusConnect',
        description: `Purchase for ${cart.length} item${cart.length === 1 ? '' : 's'}`,
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
        },
        theme: {
          color: '#2563eb',
        },
        config: buildCardCheckoutConfig(),
        modal: {
          ondismiss: () => {
            setProcessingMethod('');
            setPaymentMessage('Card payment was closed before completion.');
          },
        },
        handler: async (response) => {
          try {
            const verificationResponse = await verifyPaymentMutation.mutateAsync({
              sessionId: checkout.sessionId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await finalizeOrderSuccess(
              verificationResponse.data.orders || [],
              'Payment completed successfully. Your order has been placed.',
            );
          } catch (error) {
            setProcessingMethod('');
            setPaymentMessage(error.response?.data?.message || 'Payment was received but order confirmation failed.');
          }
        },
      });

      razorpay.on('payment.failed', (response) => {
        setProcessingMethod('');
        setPaymentMessage(response.error?.description || 'Card payment failed. Please try again.');
      });

      razorpay.open();
    } catch (error) {
      setProcessingMethod('');
      setPaymentMessage(error.response?.data?.message || error.message || 'Unable to start card checkout.');
    }
  };

  const handleUpiPayment = async () => {
    if (!deliveryAddress.trim()) {
      setPaymentMessage('Add a delivery address before continuing to payment.');
      return;
    }

    if (!isValidUpiId(upiId)) {
      setPaymentMessage('Enter a valid UPI ID such as student@upi.');
      return;
    }

    if (upiPin.trim().length < 4) {
      setPaymentMessage('Enter your UPI password or PIN to continue.');
      return;
    }

    setPaymentMessage('');
    setProcessingMethod('upi');

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 3500);
      });

      const response = await directOrderMutation.mutateAsync({
        deliveryAddress,
        paymentMethod: 'upi',
        paymentProvider: 'manual',
        paymentReference: `TXN_UPI_${Date.now()}`,
        paymentStatus: 'paid',
        couponCode: normalizedCouponCode,
      });

      await finalizeOrderSuccess(response.data.orders || [], 'Payment completed successfully. Your order has been placed.');
    } catch (error) {
      setProcessingMethod('');
      setPaymentMessage(error.response?.data?.message || 'Unable to complete the UPI payment right now.');
    }
  };

  const handleCashOnDelivery = async () => {
    if (!deliveryAddress.trim()) {
      setPaymentMessage('Add a delivery address before placing the COD order.');
      return;
    }

    if (normalizedCouponCode) {
      setPaymentMessage('Coupons are available only for UPI and Card payments.');
      return;
    }

    setPaymentMessage('');
    setSelectedMethod('cod');
    setProcessingMethod('cod');

    try {
      const response = await directOrderMutation.mutateAsync({
        deliveryAddress,
        paymentMethod: 'cod',
        paymentProvider: 'cod',
        paymentStatus: 'pending',
      });

      await finalizeOrderSuccess(
        response.data.orders || [],
        'Cash on Delivery order placed successfully. Payment will be collected on delivery.',
      );
    } catch (error) {
      setProcessingMethod('');
      setPaymentMessage(error.response?.data?.message || 'Unable to place the COD order right now.');
    }
  };

  if (cart.length === 0) {
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
          {paymentMessage && (
            <div className="mx-auto mt-6 max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {paymentMessage}
            </div>
          )}
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
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Choose the payment option that works best for you. Card and UPI support coupon codes, including
            <span className="font-semibold text-slate-900"> FIRSTBUY10</span> for eligible first-time payments.
          </p>
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
              <div>
                <label htmlFor="couponCode" className="mb-2 block font-semibold text-slate-700">
                  Coupon Code
                </label>
                <input
                  id="couponCode"
                  type="text"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  placeholder="Enter seller coupon or FIRSTBUY10"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="font-semibold text-slate-900">Payment options</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Card and UPI support coupon codes. Cash on Delivery is available without online payment.
                </p>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between text-base">
                  <span className="font-semibold text-slate-700">Total</span>
                  <span className="text-2xl font-bold text-blue-600">Rs {total}</span>
                </div>
              </div>
            </div>

            {paymentMessage && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {paymentMessage}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setPaymentMessage('');
                setSelectedMethod('');
                setUpiId('');
                setUpiPin('');
                setShowModal(true);
              }}
              className="mt-8 w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500"
            >
              Choose Payment Method
            </button>
          </aside>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-6">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-lg">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Complete Your Payment</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Select your preferred payment method for this order.
                </p>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {paymentOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (option.id === 'card') {
                      handleCardCheckout();
                      return;
                    }

                    setSelectedMethod(option.id);
                    setPaymentMessage('');
                  }}
                  disabled={isProcessing}
                  className={`rounded-[1.5rem] border p-5 text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${option.accent}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">Payment</p>
                  <h4 className="mt-3 text-xl font-bold">{option.label}</h4>
                  <p className="mt-2 text-sm leading-6 opacity-90">{option.description}</p>
                  <div className="mt-5 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-800">
                    {processingMethod === option.id ? 'Processing...' : `Use ${option.label}`}
                  </div>
                </button>
              ))}
            </div>

            {selectedMethod === 'upi' && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">UPI Payment</p>
                <h4 className="mt-2 text-2xl font-bold text-slate-900">Authorize UPI payment</h4>
                <div className="mt-4 grid gap-3">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(event) => setUpiId(event.target.value)}
                    placeholder="Enter UPI ID"
                    className="w-full rounded-xl border border-emerald-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                  />
                  <input
                    type="password"
                    value={upiPin}
                    onChange={(event) => setUpiPin(event.target.value)}
                    placeholder="Enter UPI password or PIN"
                    className="w-full rounded-xl border border-emerald-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleUpiPayment}
                    disabled={isProcessing}
                    className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {processingMethod === 'upi' ? 'Processing payment...' : 'Pay with UPI'}
                  </button>
                </div>
              </div>
            )}

            {selectedMethod === 'cod' && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Cash on Delivery</p>
                <h4 className="mt-2 text-2xl font-bold text-slate-900">Place your COD order</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Payment will stay pending until delivery. Coupon codes are not applied on COD orders.
                </p>
                <button
                  type="button"
                  onClick={handleCashOnDelivery}
                  disabled={isProcessing}
                  className="mt-4 rounded-xl bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {processingMethod === 'cod' ? 'Placing order...' : 'Confirm COD Order'}
                </button>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Transaction details</p>
              <p className="mt-2 leading-6">
                After payment, the order detail page will show the payment method, transaction reference, and related
                order identifiers for buyer and seller tracking.
              </p>
            </div>

            {paymentMessage && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {paymentMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Cart;

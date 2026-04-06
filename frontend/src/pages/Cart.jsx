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
    description: 'Open a UPI-only Razorpay test checkout.',
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Open a card-only Razorpay test checkout.',
    accent: 'border-blue-200 bg-blue-50 text-blue-800',
  },
];

function isValidUpiId(value = '') {
  return /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(value.trim());
}

function buildCheckoutDisplayConfig(preferredMethod) {
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
  const [upiId, setUpiId] = useState('');

  const checkoutSessionMutation = useMutation({
    mutationFn: api.orders.createCheckoutSession,
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: api.orders.verifyPayment,
  });

  const simulatedUpiMutation = useMutation({
    mutationFn: api.orders.create,
  });

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const total = subtotal;
  const isProcessing =
    checkoutSessionMutation.isPending || verifyPaymentMutation.isPending || simulatedUpiMutation.isPending;

  const finalizeOrderSuccess = async (createdOrders, successText) => {
    const firstOrderId = createdOrders[0]?._id;

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cart'] }),
      queryClient.invalidateQueries({ queryKey: ['orders'] }),
    ]);

    setPaymentMessage(successText);
    setShowModal(false);
    setProcessingMethod('');
    setSelectedMethod('');
    setUpiId('');

    if (firstOrderId) {
      window.setTimeout(() => {
        navigate(`/orders/${firstOrderId}`);
      }, 900);
    }
  };

  const handleLaunchCheckout = async (preferredMethod) => {
    if (!deliveryAddress.trim()) {
      setPaymentMessage('Add a delivery address before starting the Razorpay test checkout.');
      return;
    }

    setPaymentMessage('');
    setProcessingMethod(preferredMethod);

    try {
      const Razorpay = await loadRazorpayCheckout();

      if (!Razorpay) {
        throw new Error('Razorpay Checkout did not load correctly.');
      }

      const checkoutResponse = await checkoutSessionMutation.mutateAsync({
        deliveryAddress,
        preferredMethod,
      });
      const checkout = checkoutResponse.data.checkout;

      const razorpay = new Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        order_id: checkout.razorpayOrderId,
        name: 'CampusConnect',
        description: `Test checkout for ${cart.length} item${cart.length === 1 ? '' : 's'}`,
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
        },
        notes: {
          checkoutSessionId: checkout.sessionId,
          mode: checkout.testMode ? 'test' : 'live',
        },
        theme: {
          color: preferredMethod === 'upi' ? '#0f766e' : '#2563eb',
        },
        config: buildCheckoutDisplayConfig(preferredMethod),
        modal: {
          ondismiss: () => {
            setProcessingMethod('');
            setPaymentMessage('Razorpay checkout was closed before completing payment.');
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
            const createdOrders = verificationResponse.data.orders || [];
            await finalizeOrderSuccess(createdOrders, 'Payment successful via Razorpay Card.');
          } catch (error) {
            setProcessingMethod('');
            setPaymentMessage(error.response?.data?.message || 'Payment was captured but order verification failed.');
          }
        },
      });

      razorpay.on('payment.failed', (response) => {
        setProcessingMethod('');
        setPaymentMessage(
          response.error?.description || 'Razorpay reported a failed payment. Retry with the test checkout.',
        );
      });

      razorpay.open();
    } catch (error) {
      setProcessingMethod('');
      setPaymentMessage(error.response?.data?.message || error.message || 'Unable to start Razorpay checkout.');
    }
  };

  const handleSimulatedUpiPayment = async () => {
    if (!deliveryAddress.trim()) {
      setPaymentMessage('Add a delivery address before starting the UPI test payment.');
      return;
    }

    if (!isValidUpiId(upiId)) {
      setPaymentMessage('Enter a valid UPI ID like name@bank to simulate a successful UPI payment.');
      return;
    }

    setPaymentMessage('');
    setProcessingMethod('upi');

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 1000);
      });

      const response = await simulatedUpiMutation.mutateAsync({
        deliveryAddress,
        paymentMethod: 'upi',
        paymentProvider: 'simulation',
        paymentReference: `SIMUPI_${Date.now()}`,
      });
      const createdOrders = response.data.orders || [];
      await finalizeOrderSuccess(createdOrders, `UPI payment simulated successfully for ${upiId.trim()}.`);
    } catch (error) {
      setProcessingMethod('');
      setPaymentMessage(error.response?.data?.message || 'Unable to complete the simulated UPI payment.');
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
            Card uses Razorpay test checkout. UPI uses a local dummy success flow with UPI ID validation only.
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
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="font-semibold text-slate-900">Test mode notes</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Card goes through Razorpay test checkout. UPI is fully simulated in-app and succeeds when you enter a
                  valid UPI ID like <span className="font-semibold text-slate-900">student@upi</span>.
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
                <h3 className="text-2xl font-bold text-slate-900">Test Payment</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Choose how you want to test this order. UPI is simulated locally and Card opens Razorpay test
                  checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProcessingMethod('');
                  setSelectedMethod('');
                  setUpiId('');
                  setShowModal(false);
                }}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {paymentOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (option.id === 'upi') {
                      setSelectedMethod('upi');
                      setProcessingMethod('');
                      setPaymentMessage('');
                      return;
                    }

                    setSelectedMethod('card');
                    handleLaunchCheckout('card');
                  }}
                  disabled={isProcessing}
                  className={`rounded-[1.5rem] border p-5 text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${option.accent}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">Test Method</p>
                  <h4 className="mt-3 text-2xl font-bold">{option.label}</h4>
                  <p className="mt-2 text-sm leading-6 opacity-90">{option.description}</p>
                  <div className="mt-5 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-800">
                    {processingMethod === option.id
                      ? option.id === 'upi'
                        ? 'Processing...'
                        : 'Launching...'
                      : option.id === 'upi'
                        ? 'Use UPI'
                        : 'Open Card Checkout'}
                  </div>
                </button>
              ))}
            </div>

            {selectedMethod === 'upi' && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Dummy UPI</p>
                <h4 className="mt-2 text-2xl font-bold text-slate-900">Simulate a UPI payment</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enter any valid UPI ID format such as <span className="font-semibold text-slate-900">name@bank</span>
                  . This is a local test flow only and does not trigger a real payment.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(event) => setUpiId(event.target.value)}
                    placeholder="Enter UPI ID"
                    className="flex-1 rounded-xl border border-emerald-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleSimulatedUpiPayment}
                    disabled={isProcessing}
                    className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {simulatedUpiMutation.isPending ? 'Processing...' : 'Pay with Dummy UPI'}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">How this behaves</p>
              <p className="mt-2 leading-6">
                Card creates a Razorpay order on the backend and places CampusConnect orders only after the Razorpay
                signature is verified successfully. UPI uses a local dummy success path that validates the UPI ID
                format and then places the order as a simulated UPI payment.
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

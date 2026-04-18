import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { useOrderContext } from "../context/OrderContext";
import { useAppContext } from "../context/AppContext";
import { api } from "../lib/api";
import { loadRazorpayCheckout } from "../lib/razorpay";

function isValidUpiId(value = "") {
  return /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(value.trim());
}

function buildCardCheckoutConfig() {
  return {
    display: {
      blocks: {
        cards_only: {
          name: "Pay via Card",
          instruments: [{ method: "card" }],
        },
      },
      sequence: ["block.cards_only"],
      preferences: { show_default_blocks: false },
    },
  };
}

function Bookings() {
  const { currentUser } = useAppContext();
  const { bookings } = useOrderContext();
  const queryClient = useQueryClient();
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [processingMethod, setProcessingMethod] = useState("");
  const [upiId, setUpiId] = useState("");
  const [upiPin, setUpiPin] = useState("");
  const [chatDraft, setChatDraft] = useState("");

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // bookings from context is already the buyer's bookings array
  const rows = useMemo(() => {
    return Array.isArray(bookings) ? bookings.filter(Boolean) : [];
  }, [bookings]);

  const selectedBooking = useMemo(() => {
    if (!selectedBookingId || rows.length === 0) {
      return null;
    }
    return rows.find((b) => b?.id === selectedBookingId) || null;
  }, [rows, selectedBookingId]);

  const payUpiMutation = useMutation({
    mutationFn: ({ bookingId, upiValue }) =>
      api.bookings.payUpi(bookingId, { upiId: upiValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: (payload) => api.bookings.verifyPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ bookingId, message }) =>
      api.bookings.sendMessage(bookingId, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["booking", selectedBookingId, "messages"],
      });
      setChatDraft("");
    },
  });

  // Chat is only fetched if booking is paid (paymentStatus from formatter is "Paid" capitalized)
  const chatEnabled =
    selectedBooking?.paymentStatus === "Paid" ||
    selectedBooking?.chatEnabled === true;

  const messagesQuery = useQuery({
    queryKey: ["booking", selectedBookingId, "messages"],
    queryFn: () => api.bookings.messages(selectedBookingId),
    enabled: Boolean(selectedBookingId && chatEnabled),
    refetchInterval: chatEnabled ? 5000 : false,
  });

  const isProcessing =
    payUpiMutation.isPending || verifyPaymentMutation.isPending;

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setProcessingMethod("");
    setUpiId("");
    setUpiPin("");
  };

  const refreshBookings = async () => {
    await queryClient.invalidateQueries({ queryKey: ["bookings"] });
    await queryClient.invalidateQueries({ queryKey: ["bookings", "buyer"] });
  };

  const finalizeBookingPayment = async (successText) => {
    setPaymentMessage(successText);
    closePaymentModal();
    await refreshBookings();
  };

  const handleCardPayment = async () => {
    if (!selectedBooking) return;

    setPaymentMessage("");
    setProcessingMethod("card");

    try {
      const Razorpay = await loadRazorpayCheckout();
      const checkoutResponse = await api.bookings.createCheckoutSession(
        selectedBooking.id
      );
      const checkout = checkoutResponse.data.checkout;

      const razorpay = new Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        order_id: checkout.razorpayOrderId,
        name: "CampusConnect",
        description: selectedBooking.serviceTitle,
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
        },
        theme: { color: "#2563eb" },
        config: buildCardCheckoutConfig(),
        modal: {
          ondismiss: () => {
            setProcessingMethod("");
            setPaymentMessage("Card payment was closed before completion.");
          },
        },
        handler: async (response) => {
          try {
            await verifyPaymentMutation.mutateAsync({
              bookingId: selectedBooking.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await finalizeBookingPayment(
              "Payment completed successfully. Chat with the provider is now available."
            );
          } catch (error) {
            setProcessingMethod("");
            setPaymentMessage(
              error.response?.data?.message ||
                "Unable to verify the card payment."
            );
          }
        },
      });

      razorpay.on("payment.failed", (response) => {
        setProcessingMethod("");
        setPaymentMessage(
          response.error?.description ||
            "Card payment failed. Please try again."
        );
      });

      razorpay.open();
    } catch (error) {
      setProcessingMethod("");
      setPaymentMessage(
        error.response?.data?.message || "Unable to start the card payment."
      );
    }
  };

  const handleUpiPayment = async () => {
    if (!selectedBooking) return;

    if (!isValidUpiId(upiId)) {
      setPaymentMessage("Enter a valid UPI ID such as student@upi.");
      return;
    }

    if (upiPin.trim().length < 4) {
      setPaymentMessage("Enter your UPI password or PIN to continue.");
      return;
    }

    setPaymentMessage("");
    setProcessingMethod("upi");

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 3500));

      await payUpiMutation.mutateAsync({
        bookingId: selectedBooking.id,
        upiValue: upiId.trim(),
      });
      await finalizeBookingPayment(
        "Payment completed successfully. Chat with the provider is now available."
      );
    } catch (error) {
      setProcessingMethod("");
      setPaymentMessage(
        error.response?.data?.message ||
          "Unable to complete the UPI payment."
      );
    }
  };

  const handleSendMessage = async () => {
    if (!selectedBooking || !chatDraft.trim()) return;
    await sendMessageMutation.mutateAsync({
      bookingId: selectedBooking.id,
      message: chatDraft.trim(),
    });
  };

  const chatMessages = messagesQuery.data?.data?.messages || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
          Bookings
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          My service bookings
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Track admin confirmations, pay online, and chat after payment is complete.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        {/* Bookings list */}
        <section className="rounded-2xl bg-white p-6 shadow-md">
          {rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-4 font-semibold">Booking ID</th>
                    <th className="pb-4 font-semibold">Service</th>
                    <th className="pb-4 font-semibold">Booking Status</th>
                    <th className="pb-4 font-semibold">Payment</th>
                    <th className="pb-4 font-semibold">Amount</th>
                    <th className="pb-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((booking) => (
                    <tr
                      key={booking.id}
                      className={
                        selectedBooking?.id === booking.id
                          ? "bg-blue-50/50"
                          : ""
                      }
                    >
                      <td className="py-4 font-medium text-slate-700 text-xs">
                        {(booking.transactionId || booking.id || "").slice(-8).toUpperCase()}
                      </td>
                      <td className="py-4 text-slate-700 font-medium">
                        {booking.serviceTitle}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                          booking.bookingStatus === "Confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : booking.bookingStatus === "Cancelled"
                            ? "bg-rose-100 text-rose-700"
                            : booking.bookingStatus === "Completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {booking.bookingStatus}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                          booking.paymentStatus === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="py-4 font-semibold text-slate-800">
                        ₹ {(booking.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedBookingId(booking.id)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            Details
                          </button>

                          {booking.bookingStatus === "Confirmed" &&
                            booking.paymentStatus === "Pending" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBookingId(booking.id);
                                  setPaymentModalOpen(true);
                                  setPaymentMessage("");
                                }}
                                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                              >
                                Pay Now
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 px-6 py-12 text-center">
              <h2 className="text-2xl font-bold text-slate-900">
                No bookings yet
              </h2>
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
        </section>

        {/* Right sidebar: Details + Chat */}
        <aside className="space-y-6">
          {selectedBooking ? (
            <>
              <section className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="text-xl font-bold text-slate-900">
                  Booking Details
                </h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-900">
                      Service:
                    </span>{" "}
                    {selectedBooking.serviceTitle}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      Scheduled:
                    </span>{" "}
                    {new Date(selectedBooking.scheduledDate).toLocaleString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      Duration:
                    </span>{" "}
                    {selectedBooking.duration}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      Booking Status:
                    </span>{" "}
                    <span className={`font-bold ${
                      selectedBooking.bookingStatus === "Confirmed"
                        ? "text-emerald-600"
                        : selectedBooking.bookingStatus === "Cancelled"
                        ? "text-rose-600"
                        : "text-amber-600"
                    }`}>
                      {selectedBooking.bookingStatus}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      Payment Status:
                    </span>{" "}
                    <span className={`font-bold ${
                      selectedBooking.paymentStatus === "Paid"
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}>
                      {selectedBooking.paymentStatus}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      Total Amount:
                    </span>{" "}
                    ₹ {(selectedBooking.totalAmount || 0).toFixed(2)}
                  </p>
                  {selectedBooking.couponCode && (
                    <p>
                      <span className="font-semibold text-slate-900">
                        Coupon:
                      </span>{" "}
                      {selectedBooking.couponCode}
                    </p>
                  )}
                  {selectedBooking.paymentMethod && (
                    <p>
                      <span className="font-semibold text-slate-900">
                        Payment Method:
                      </span>{" "}
                      {selectedBooking.paymentMethod}
                    </p>
                  )}
                  {selectedBooking.paymentReference && (
                    <p>
                      <span className="font-semibold text-slate-900">
                        Transaction:
                      </span>{" "}
                      <span className="text-xs font-mono">{selectedBooking.paymentReference}</span>
                    </p>
                  )}
                </div>

                {selectedBooking.bookingStatus === "Confirmed" &&
                  selectedBooking.paymentStatus === "Pending" && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentModalOpen(true);
                        setPaymentMessage("");
                      }}
                      className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Pay Now
                    </button>
                  )}

                {selectedBooking.bookingStatus === "Pending" && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    ⏳ Waiting for admin approval. You'll be able to pay once confirmed.
                  </div>
                )}
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="text-xl font-bold text-slate-900">
                  Booking Chat
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Chat is unlocked after successful payment.
                </p>

                {chatEnabled ? (
                  <>
                    <div className="mt-4 max-h-72 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4">
                      {chatMessages.map((message) => {
                        const isMine =
                          message.senderId?._id === currentUser.id ||
                          message.senderId?.id === currentUser.id;
                        return (
                          <div
                            key={message._id}
                            className={`rounded-2xl px-4 py-3 text-sm ${
                              isMine
                                ? "ml-8 bg-blue-500 text-white"
                                : "mr-8 bg-white text-slate-700 shadow-sm border border-slate-100"
                            }`}
                          >
                            <p className={`font-semibold text-xs ${isMine ? "text-blue-100" : "text-slate-500"}`}>
                              {message.senderId?.name || "User"}
                            </p>
                            <p className="mt-1 leading-6">{message.message}</p>
                          </div>
                        );
                      })}
                      {chatMessages.length === 0 && (
                        <p className="text-center text-sm text-slate-400 py-4">
                          No messages yet. Start the conversation!
                        </p>
                      )}
                    </div>
                    {selectedBooking.bookingStatus !== "Completed" && (
                      <div className="mt-4 flex gap-3">
                        <input
                          type="text"
                          value={chatDraft}
                          onChange={(e) => setChatDraft(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSendMessage()
                          }
                          placeholder="Type your message"
                          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={sendMessageMutation.isPending || !chatDraft.trim()}
                          className="rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Send
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                    Complete the booking payment to unlock chat.
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="rounded-2xl bg-white p-6 shadow-md">
              <h2 className="text-xl font-bold text-slate-900">
                Select a booking
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                Choose a booking from the list to view details, pay online, or
                open chat.
              </p>
            </section>
          )}
        </aside>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-6">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-lg">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Pay for {selectedBooking.serviceTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Choose UPI or Card to complete the booking and unlock chat.
                </p>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 transition"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {/* UPI Option */}
              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                  UPI
                </p>
                <h4 className="mt-3 text-xl font-bold">Pay via UPI</h4>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-xl bg-white/80 px-4 py-3 text-sm text-slate-700">
                    <p className="font-semibold">
                      Amount: ₹ {(selectedBooking.totalAmount || 0).toFixed(2)}
                    </p>
                  </div>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="Enter UPI ID (e.g. name@upi)"
                    className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 text-sm"
                  />
                  <input
                    type="password"
                    value={upiPin}
                    onChange={(e) => setUpiPin(e.target.value)}
                    placeholder="Enter UPI password or PIN"
                    className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleUpiPayment}
                    disabled={isProcessing || processingMethod === "card"}
                    className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {processingMethod === "upi"
                      ? "Processing..."
                      : "Pay with UPI"}
                  </button>
                </div>
              </div>

              {/* Card Option */}
              <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5 text-blue-800">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                  Card
                </p>
                <h4 className="mt-3 text-xl font-bold">Pay via Card</h4>
                <p className="mt-2 text-sm leading-6 opacity-90">
                  Complete this booking through secure Razorpay card checkout.
                </p>
                <div className="mt-3 rounded-xl bg-white/80 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold">
                    Amount: ₹ {(selectedBooking.totalAmount || 0).toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCardPayment}
                  disabled={isProcessing}
                  className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {processingMethod === "card"
                    ? "Launching checkout..."
                    : "Open Card Checkout"}
                </button>
              </div>
            </div>

            {paymentMessage && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {paymentMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Bookings;

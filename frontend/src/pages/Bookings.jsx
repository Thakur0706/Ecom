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
          instruments: [
            {
              method: "card",
            },
          ],
        },
      },
      sequence: ["block.cards_only"],
      preferences: {
        show_default_blocks: false,
      },
    },
  };
}

function Bookings() {
  const { currentUser } = useAppContext();
  const { bookings, serviceBookings } = useOrderContext();
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

  const rows = useMemo(() => {
    const rawRows = currentUser.role === "seller" ? serviceBookings : bookings;
    return Array.isArray(rawRows) ? rawRows.filter(Boolean) : [];
  }, [serviceBookings, bookings, currentUser.role]);

  const selectedBooking = useMemo(() => {
    if (!selectedBookingId || rows.length === 0) {
      return rows[0] || null;
    }
    return (
      rows.find((booking) => booking?.id === selectedBookingId) ||
      rows[0] ||
      null
    );
  }, [rows, selectedBookingId]);

  const statusMutation = useMutation({
    mutationFn: ({ bookingId, bookingStatus }) =>
      api.bookings.updateStatus(bookingId, { bookingStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  const payUpiMutation = useMutation({
    mutationFn: ({ bookingId, upiValue }) =>
      api.bookings.payUpi(bookingId, { upiId: upiValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: ({ bookingId, payload }) =>
      api.bookings.verifyPayment(bookingId, payload),
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

  const messagesQuery = useQuery({
    queryKey: ["booking", selectedBookingId, "messages"],
    queryFn: () => api.bookings.messages(selectedBookingId),
    enabled: Boolean(
      selectedBookingId && selectedBooking?.paymentStatus === "Paid",
    ),
    refetchInterval: selectedBooking?.paymentStatus === "Paid" ? 5000 : false,
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
  };

  const handleSellerAction = async (bookingId, bookingStatus) => {
    await statusMutation.mutateAsync({ bookingId, bookingStatus });
  };

  const finalizeBookingPayment = async (successText) => {
    setPaymentMessage(successText);
    closePaymentModal();
    await refreshBookings();
  };

  const handleCardPayment = async () => {
    if (!selectedBooking) {
      return;
    }

    setPaymentMessage("");
    setProcessingMethod("card");

    try {
      const Razorpay = await loadRazorpayCheckout();
      const checkoutResponse = await api.bookings.createPaymentSession(
        selectedBooking.id,
        { preferredMethod: "card" },
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
        theme: {
          color: "#2563eb",
        },
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
              payload: {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            });
            await finalizeBookingPayment(
              "Payment completed successfully. Chat with the provider is now available.",
            );
          } catch (error) {
            setProcessingMethod("");
            setPaymentMessage(
              error.response?.data?.message ||
                "Unable to verify the card payment.",
            );
          }
        },
      });

      razorpay.on("payment.failed", (response) => {
        setProcessingMethod("");
        setPaymentMessage(
          response.error?.description ||
            "Card payment failed. Please try again.",
        );
      });

      razorpay.open();
    } catch (error) {
      setProcessingMethod("");
      setPaymentMessage(
        error.response?.data?.message || "Unable to start the card payment.",
      );
    }
  };

  const handleUpiPayment = async () => {
    if (!selectedBooking) {
      return;
    }

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
      await new Promise((resolve) => {
        window.setTimeout(resolve, 3500);
      });

      await payUpiMutation.mutateAsync({
        bookingId: selectedBooking.id,
        upiValue: upiId.trim(),
      });
      await finalizeBookingPayment(
        "Payment completed successfully. Chat with the provider is now available.",
      );
    } catch (error) {
      setProcessingMethod("");
      setPaymentMessage(
        error.response?.data?.message || "Unable to complete the UPI payment.",
      );
    }
  };

  const handleSendMessage = async () => {
    if (!selectedBooking || !chatDraft.trim()) {
      return;
    }

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
          {currentUser.role === "seller"
            ? "Service bookings received"
            : "My service bookings"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {currentUser.role === "seller"
            ? "Confirm bookings, complete paid sessions, and chat with buyers after payment."
            : "Track provider confirmations, pay online, and chat with providers after payment."}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl bg-white p-6 shadow-md">
          {rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-4 font-semibold">Booking ID</th>
                    <th className="pb-4 font-semibold">Service</th>
                    <th className="pb-4 font-semibold">Counterparty</th>
                    <th className="pb-4 font-semibold">Booking</th>
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
                      <td className="py-4 font-medium text-slate-900">
                        {booking.id}
                      </td>
                      <td className="py-4 text-slate-600">
                        {booking.serviceTitle}
                      </td>
                      <td className="py-4 text-slate-600">
                        {currentUser.role === "seller"
                          ? booking.buyerName
                          : booking.sellerName}
                      </td>
                      <td className="py-4 text-slate-600">
                        {booking.bookingStatus}
                      </td>
                      <td className="py-4 text-slate-600">
                        {booking.paymentStatus}
                      </td>
                      <td className="py-4 text-slate-600">
                        Rs {booking.totalAmount}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedBookingId(booking.id)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                          >
                            Details
                          </button>

                          {currentUser.role === "seller" &&
                            booking.bookingStatus === "Pending" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSellerAction(booking.id, "confirmed")
                                }
                                className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white"
                              >
                                Confirm
                              </button>
                            )}

                          {currentUser.role === "seller" &&
                            booking.bookingStatus === "Confirmed" &&
                            booking.paymentStatus === "Paid" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSellerAction(booking.id, "completed")
                                }
                                className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white"
                              >
                                Mark Completed
                              </button>
                            )}

                          {currentUser.role === "buyer" &&
                            booking.bookingStatus === "Confirmed" &&
                            booking.paymentStatus === "Pending" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBookingId(booking.id);
                                  setPaymentModalOpen(true);
                                  setPaymentMessage("");
                                }}
                                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
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

        <aside className="space-y-6">
          {selectedBooking ? (
            <>
              <section className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="text-2xl font-bold text-slate-900">
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
                      },
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
                    {selectedBooking.bookingStatus}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      Payment Status:
                    </span>{" "}
                    {selectedBooking.paymentStatus}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      Original Amount:
                    </span>{" "}
                    Rs {selectedBooking.originalAmount}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      Discount:
                    </span>{" "}
                    Rs {selectedBooking.discountAmount}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      Platform Fee (5%):
                    </span>{" "}
                    Rs {(selectedBooking.totalAmount * 0.05).toFixed(2)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      Final Amount:
                    </span>{" "}
                    Rs {(selectedBooking.totalAmount * 1.05).toFixed(2)}
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
                        Transaction ID:
                      </span>{" "}
                      {selectedBooking.paymentReference}
                    </p>
                  )}
                </div>

                {currentUser.role === "buyer" &&
                  selectedBooking.bookingStatus === "Confirmed" &&
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
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Booking Chat
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Chat is available after payment is completed for this
                      booking.
                    </p>
                  </div>
                </div>

                {selectedBooking.paymentStatus === "Paid" ? (
                  <>
                    <div className="mt-5 max-h-80 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4">
                      {chatMessages.map((message) => {
                        const isMine =
                          message.senderId?._id === currentUser.id ||
                          message.senderId?.id === currentUser.id;

                        return (
                          <div
                            key={message._id}
                            className={`rounded-2xl px-4 py-3 text-sm ${isMine ? "ml-10 bg-blue-500 text-white" : "mr-10 bg-white text-slate-700 shadow-sm"}`}
                          >
                            <p
                              className={`font-semibold ${isMine ? "text-white" : "text-slate-900"}`}
                            >
                              {message.senderId?.name || "User"}
                            </p>
                            <p className="mt-1 leading-6">{message.message}</p>
                          </div>
                        );
                      })}
                      {chatMessages.length === 0 && (
                        <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-slate-500">
                          No messages yet. Start the conversation here.
                        </p>
                      )}
                    </div>
                    {selectedBooking.bookingStatus === "Completed" ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                        <p className="font-semibold">
                          Service session completed
                        </p>
                        <p className="mt-1">
                          This chat has been closed as the booking is marked as
                          completed.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 flex gap-3">
                        <input
                          type="text"
                          value={chatDraft}
                          onChange={(event) => setChatDraft(event.target.value)}
                          placeholder="Type your message"
                          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={
                            sendMessageMutation.isPending || !chatDraft.trim()
                          }
                          className="rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Send
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                    Complete the booking payment to unlock the chat section.
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="rounded-2xl bg-white p-6 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900">
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

      {paymentModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-6">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-lg">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Pay for {selectedBooking.serviceTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Choose UPI or Card to complete the booking and unlock chat
                  with the provider.
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

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={handleUpiPayment}
                disabled={isProcessing || processingMethod === "card"}
                className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-left text-emerald-800 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                  UPI
                </p>
                <h4 className="mt-3 text-2xl font-bold">Pay via UPI</h4>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-xl bg-white/80 px-4 py-3 text-sm text-slate-700">
                    <p className="font-semibold">
                      Amount: Rs{" "}
                      {(selectedBooking.totalAmount * 1.05).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      (Includes 5% platform fee)
                    </p>
                  </div>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(event) => setUpiId(event.target.value)}
                    placeholder="Enter UPI ID"
                    className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                  />
                  <input
                    type="password"
                    value={upiPin}
                    onChange={(event) => setUpiPin(event.target.value)}
                    placeholder="Enter UPI password or PIN"
                    className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                  />
                  <span className="inline-flex w-fit rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-800">
                    {processingMethod === "upi"
                      ? "Processing payment..."
                      : "Pay with UPI"}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleCardPayment}
                disabled={isProcessing}
                className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5 text-left text-blue-800 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                  Card
                </p>
                <h4 className="mt-3 text-2xl font-bold">Pay via Card</h4>
                <p className="mt-2 text-sm leading-6 opacity-90">
                  Complete this booking through secure card checkout.
                </p>
                <div className="mt-3 rounded-xl bg-white/80 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold">
                    Amount: Rs {(selectedBooking.totalAmount * 1.05).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    (Includes 5% platform fee)
                  </p>
                </div>
                <div className="mt-4 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-800">
                  {processingMethod === "card"
                    ? "Launching checkout..."
                    : "Open Card Checkout"}
                </div>
              </button>
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

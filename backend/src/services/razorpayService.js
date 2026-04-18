import crypto from 'crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/http.js';

const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1';

// ─── Simulation mode ─────────────────────────────────────────────────────────
// Enable when RAZORPAY_SIMULATE=true in .env OR when keys are absent.
// Generates structurally-valid fake order/payment IDs and a real HMAC signature
// so the entire card-payment verify flow works end-to-end locally.

function isSimulated() {
  return (
    process.env.RAZORPAY_SIMULATE === 'true' ||
    !env.razorpayKeyId ||
    !env.razorpayKeySecret
  );
}

function simulationSecret() {
  // Use the real key secret if available, else a fixed local secret.
  return env.razorpayKeySecret || 'sim_razorpay_local_secret';
}

function randomAlphaNum(length) {
  return crypto
    .randomBytes(Math.ceil(length * 0.75))
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, length);
}

function simCreateOrder({ amount, currency = 'INR', receipt }) {
  const orderId = `order_SIM${randomAlphaNum(14)}`;
  return {
    id: orderId,
    entity: 'order',
    amount,
    amount_paid: 0,
    amount_due: amount,
    currency,
    receipt: receipt || '',
    status: 'created',
    created_at: Math.floor(Date.now() / 1000),
  };
}

function simFetchPayment(paymentId, { orderId, amount, currency = 'INR' } = {}) {
  // paymentId is in the form pay_SIM<orderId>_<random> — we embed the orderId
  // so we can retrieve it on verify. Fall back to extracting from the ID.
  let resolvedOrderId = orderId;
  if (!resolvedOrderId) {
    // paymentId format: pay_SIM<encoded orderId hash>_<rand>
    const match = paymentId.match(/^pay_SIM[A-Za-z0-9]+_(.+)$/);
    resolvedOrderId = match ? Buffer.from(match[1], 'base64url').toString() : '';
  }

  return {
    id: paymentId,
    entity: 'payment',
    amount: amount || 0,
    currency,
    status: 'captured',
    order_id: resolvedOrderId,
    method: 'card',
    captured: true,
    created_at: Math.floor(Date.now() / 1000),
  };
}

// ─── Real Razorpay helpers ────────────────────────────────────────────────────

function ensureRazorpayConfigured() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new AppError(
      'Razorpay test keys are missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env.',
      500,
    );
  }
}

function buildAuthHeader() {
  ensureRazorpayConfigured();
  return `Basic ${Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString('base64')}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

async function razorpayRequest(path, { method = 'GET', body } = {}) {
  ensureRazorpayConfigured();

  let response;

  try {
    response = await fetch(`${RAZORPAY_BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: buildAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AppError('Unable to reach Razorpay right now. Please try again.', 502);
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      payload?.error?.description ||
      payload?.description ||
      'Razorpay request failed. Please check your test credentials.';
    throw new AppError(message, response.status >= 500 ? 502 : response.status);
  }

  return payload;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function createRazorpayOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  if (isSimulated()) {
    console.log('[Razorpay] SIMULATION MODE — creating fake order');
    return simCreateOrder({ amount, currency, receipt });
  }

  return razorpayRequest('/orders', {
    method: 'POST',
    body: { amount, currency, receipt, notes },
  });
}

export async function fetchRazorpayPayment(paymentId) {
  if (isSimulated()) {
    // Extract the embedded orderId from the simulated paymentId
    const match = paymentId.match(/^pay_SIM[A-Za-z0-9]+_([A-Za-z0-9_-]+)$/);
    const encodedOrderId = match ? match[1] : '';
    const orderId = encodedOrderId ? Buffer.from(encodedOrderId, 'base64url').toString() : '';
    console.log('[Razorpay] SIMULATION MODE — fetching fake payment', { paymentId, orderId });
    return simFetchPayment(paymentId, { orderId });
  }

  return razorpayRequest(`/payments/${paymentId}`);
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const secret = simulationSecret();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expectedSignature.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

/**
 * Helper used by the frontend simulation endpoint to produce the correct
 * HMAC signature for a given (orderId, paymentId) pair.
 */
export function buildSimulatedPaymentResult(orderId) {
  const paymentId = `pay_SIM${randomAlphaNum(10)}_${Buffer.from(orderId).toString('base64url')}`;
  const signature = crypto
    .createHmac('sha256', simulationSecret())
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return { paymentId, signature };
}

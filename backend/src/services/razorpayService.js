import crypto from 'crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/http.js';

const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1';

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

export async function createRazorpayOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  return razorpayRequest('/orders', {
    method: 'POST',
    body: {
      amount,
      currency,
      receipt,
      notes,
    },
  });
}

export async function fetchRazorpayPayment(paymentId) {
  return razorpayRequest(`/payments/${paymentId}`);
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  ensureRazorpayConfigured();

  const expectedSignature = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expectedSignature.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

import { env } from '../config/env.js';
import { sendResponse } from '../utils/http.js';

export function notFoundHandler(req, res) {
  return sendResponse(res, 404, false, `Route ${req.originalUrl} not found.`, {});
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Something went wrong.';

  if (env.enableBackendLogs) {
    console.error(error);
  }

  return sendResponse(res, statusCode, false, message, {
    ...(process.env.NODE_ENV !== 'production' && error.errors ? { errors: error.errors } : {}),
  });
}

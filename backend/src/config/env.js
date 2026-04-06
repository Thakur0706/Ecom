import dotenv from 'dotenv';

dotenv.config();

const requiredValues = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

requiredValues.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongodbUri: process.env.MONGODB_URI || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  enableBackendLogs: process.env.ENABLE_BACKEND_LOGS === 'true',
  accessTokenSecret: process.env.JWT_ACCESS_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  mailFrom: process.env.MAIL_FROM || 'CampusConnect <no-reply@campusconnect.local>',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
};

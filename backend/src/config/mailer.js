import nodemailer from 'nodemailer';
import { env } from './env.js';

let transporter;

function createTransporter() {
  if (env.smtpHost && env.smtpUser && env.smtpPass) {
    return nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }

  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

export function getMailer() {
  if (!transporter) {
    transporter = createTransporter();
  }

  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  const mailer = getMailer();

  const info = await mailer.sendMail({
    from: env.mailFrom,
    to,
    subject,
    html,
  });

  if (info.message && env.enableBackendLogs) {
    console.log('Email payload:', info.message.toString());
  }

  return info;
}

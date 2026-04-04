import { sendEmail } from '../config/mailer.js';

export async function sendSellerApplicationDecisionEmail({ email, name, approved, reason }) {
  const subject = approved
    ? 'CampusConnect seller application approved'
    : 'CampusConnect seller application update';
  const html = approved
    ? `
      <div>
        <h2>Hi ${name},</h2>
        <p>Your seller application has been approved. You can now create product and service listings on CampusConnect.</p>
        <p>Welcome aboard.</p>
      </div>
    `
    : `
      <div>
        <h2>Hi ${name},</h2>
        <p>Your seller application was not approved at this time.</p>
        <p>${reason ? `Reason: ${reason}` : 'No rejection reason was provided.'}</p>
        <p>You can update your details and apply again later.</p>
      </div>
    `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

export async function sendOrderStatusEmail({ email, name, orderId, status }) {
  return sendEmail({
    to: email,
    subject: `CampusConnect order ${orderId} is now ${status}`,
    html: `
      <div>
        <h2>Hi ${name},</h2>
        <p>Your order <strong>${orderId}</strong> has been updated to <strong>${status}</strong>.</p>
        <p>Open CampusConnect to view the latest status timeline.</p>
      </div>
    `,
  });
}

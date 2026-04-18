import { SupplierLedger } from '../models/SupplierLedger.js';

function withOptionalSession(query, session) {
  return session ? query.session(session) : query;
}

export async function createLedgerCreditsForOrder(order, session = null) {
  const creditDocs = order.items
    .filter((item) => item.supplierId)
    .map((item) => ({
      supplierId: item.supplierId,
      orderId: order._id,
      orderItemId: item._id,
      productId: item.productId,
      type: 'credit',
      status: 'pending',
      amount: Number(item.supplierPayable || 0),
      description: `Order ${order.transactionId} - ${item.title}`,
      reference: order.transactionId,
      notes: `Auto-created from order ${order._id.toString()}`,
      isAcknowledged: false, // Default to false until supplier confirms
    }));

  if (!creditDocs.length) {
    return [];
  }

  return SupplierLedger.insertMany(creditDocs, session ? { session } : undefined);
}

export async function markOrderLedgerCreditsReversed(orderId, session = null) {
  return withOptionalSession(
    SupplierLedger.updateMany(
      {
        orderId,
        type: 'credit',
        status: 'pending',
      },
      {
        $set: {
          status: 'reversed',
          paidAt: new Date(),
        },
      },
    ),
    session,
  );
}

export async function listPendingSupplierCredits(supplierId, session = null) {
  return withOptionalSession(
    SupplierLedger.find({
      supplierId,
      type: 'credit',
      status: 'pending',
    }).sort({ createdAt: 1 }),
    session,
  );
}

export async function createSupplierPayment({
  supplierId,
  amount,
  method,
  reference,
  notes = '',
  session = null,
}) {
  const pendingCredits = await listPendingSupplierCredits(supplierId, session);

  let remainingAmount = Number(amount || 0);
  const linkedCreditIds = [];
  let settledAmount = 0;

  for (const credit of pendingCredits) {
    if (remainingAmount < Number(credit.amount || 0)) {
      continue;
    }

    remainingAmount -= Number(credit.amount || 0);
    settledAmount += Number(credit.amount || 0);
    linkedCreditIds.push(credit._id);
  }

  if (!linkedCreditIds.length) {
    return null;
  }

  await withOptionalSession(
    SupplierLedger.updateMany(
      {
        _id: { $in: linkedCreditIds },
      },
      {
        $set: {
          status: 'paid',
          paidAt: new Date(),
        },
      },
    ),
    session,
  );

  const [paymentEntry] = await SupplierLedger.create(
    [
      {
        supplierId,
        type: 'debit',
        status: 'paid',
        amount: settledAmount,
        description: `Supplier payout - ${method}`,
        paymentMethod: method,
        reference,
        notes,
        linkedCreditIds,
        paidAt: new Date(),
      },
    ],
    session ? { session } : undefined,
  );

  return paymentEntry;
}

export async function getSupplierLedgerSummary(supplierId) {
  const entries = await SupplierLedger.find({ supplierId });

  return entries.reduce(
    (summary, entry) => {
      const amount = Number(entry.amount || 0);

      // Earning is only seen if admin has actually paid the supplier
      if (entry.status === 'paid') {
        summary.earned += amount;
      }

      // Payout is pending only if credit is pending AND supplier acknowledged the request
      if (entry.status === 'pending') {
        if (entry.isAcknowledged) {
          summary.pending += amount;
        }
      }

      // Total paid out so far
      if (entry.status === 'paid') {
        summary.paid += amount;
      }

      return summary;
    },
    { earned: 0, pending: 0, paid: 0 },
  );
}

export async function acknowledgeCreditsForOrder(orderId, supplierId, session = null) {
    return withOptionalSession(
        SupplierLedger.updateMany(
            { orderId, supplierId, status: 'pending' },
            { $set: { isAcknowledged: true } }
        ),
        session
    );
}

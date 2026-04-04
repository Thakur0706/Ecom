export function getDateRangeFilter(from, to, field = 'createdAt') {
  if (!from && !to) {
    return {};
  }

  const filter = {};

  if (from) {
    filter.$gte = new Date(`${from}T00:00:00.000Z`);
  }

  if (to) {
    filter.$lte = new Date(`${to}T23:59:59.999Z`);
  }

  return {
    [field]: filter,
  };
}

export function getLastMonths(count = 6) {
  const months = [];
  const now = new Date();
  const current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  for (let index = count - 1; index >= 0; index -= 1) {
    const monthDate = new Date(current);
    monthDate.setUTCMonth(current.getUTCMonth() - index);

    months.push({
      key: `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, '0')}`,
      label: monthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      revenue: 0,
      orders: 0,
      signups: 0,
    });
  }

  return months;
}

export function bucketOrdersByMonth(orders, dateField = 'createdAt', amountField = 'totalAmount') {
  const buckets = getLastMonths();
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  orders.forEach((order) => {
    const sourceDate = new Date(order[dateField]);
    const key = `${sourceDate.getUTCFullYear()}-${String(sourceDate.getUTCMonth() + 1).padStart(2, '0')}`;
    const bucket = bucketMap.get(key);

    if (bucket) {
      bucket.revenue += Number(order[amountField] || 0);
      bucket.orders += 1;
    }
  });

  return buckets;
}

export function bucketUsersByMonth(users) {
  const buckets = getLastMonths();
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  users.forEach((user) => {
    const sourceDate = new Date(user.createdAt);
    const key = `${sourceDate.getUTCFullYear()}-${String(sourceDate.getUTCMonth() + 1).padStart(2, '0')}`;
    const bucket = bucketMap.get(key);

    if (bucket) {
      bucket.signups += 1;
    }
  });

  return buckets;
}

export function toObjectIdString(value) {
  if (!value) {
    return '';
  }

  return typeof value === 'string' ? value : value.toString();
}

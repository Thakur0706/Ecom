const statusStyles = {
  Placed: 'bg-blue-100 text-blue-700',
  Confirmed: 'bg-indigo-100 text-indigo-700',
  Shipped: 'bg-amber-100 text-amber-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700',
};

const dotStyles = {
  Placed: 'bg-blue-500',
  Confirmed: 'bg-indigo-500',
  Shipped: 'bg-amber-500',
  Delivered: 'bg-emerald-500',
  Cancelled: 'bg-rose-500',
};

function OrderStatusBadge({ status, large = false }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-semibold ${
        large ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs'
      } ${statusStyles[status] || 'bg-slate-100 text-slate-700'}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotStyles[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  );
}

export default OrderStatusBadge;

function ResourceUtilizationBar({ label, current, max = 100, color, large = false }) {
  const percentage = max === 0 ? 0 : Math.min((current / max) * 100, 100);
  const barColor =
    color ||
    (percentage < 50 ? 'bg-emerald-500' : percentage <= 80 ? 'bg-amber-400' : 'bg-rose-500');

  return (
    <div className={`rounded-2xl bg-white ${large ? 'p-5 shadow-md' : 'p-4'}`}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className={`${large ? 'text-base' : 'text-sm'} font-semibold text-slate-800`}>{label}</p>
        <p className="text-sm font-semibold text-slate-500">
          {current}/{max} ({percentage.toFixed(1)}%)
        </p>
      </div>
      <div className={`w-full rounded-full bg-slate-200 ${large ? 'h-4' : 'h-3'}`}>
        <div
          className={`h-full rounded-full transition-all duration-200 ${barColor}`}
          style={{ width: `${Math.max(percentage, 4)}%` }}
        />
      </div>
    </div>
  );
}

export default ResourceUtilizationBar;

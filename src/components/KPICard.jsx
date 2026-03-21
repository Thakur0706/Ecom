function KPICard({ title, value, icon, color = 'bg-blue-100 text-blue-600', trend }) {
  const trendIsPositive = trend?.includes('+');

  return (
    <div className="h-32 rounded-2xl bg-white p-6 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex h-full flex-col justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
          <span className="text-xl">{icon}</span>
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">{title}</p>
          {trend && (
            <p className={`mt-2 text-xs font-semibold ${trendIsPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default KPICard;

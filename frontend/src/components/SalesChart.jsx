const defaultWeekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function SalesChart({
  data,
  type = 'bar',
  valueKey = 'revenue',
  labelKey = 'month',
  captionKey,
  barColor = 'bg-blue-500',
  heightClass = 'h-48',
  highlightIndex = -1,
}) {
  const normalizedData = data.map((entry, index) =>
    typeof entry === 'number'
      ? {
          label: defaultWeekLabels[index] || `D${index + 1}`,
          value: entry,
          caption: '',
        }
      : {
          label: entry[labelKey],
          value: entry[valueKey],
          caption: captionKey ? entry[captionKey] : '',
        },
  );

  const maxValue = Math.max(...normalizedData.map((entry) => entry.value), 1);
  const halfValue = Math.round(maxValue / 2);

  if (type === 'line') {
    const points = normalizedData
      .map((entry, index) => {
        const x = normalizedData.length === 1 ? 50 : (index / (normalizedData.length - 1)) * 100;
        const y = 100 - (Math.max(entry.value / maxValue, 0) * 100 || 0);
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <div className="grid grid-cols-[auto_1fr] gap-4">
        <div className={`flex flex-col justify-between py-2 text-xs text-slate-500 ${heightClass}`}>
          <span>{maxValue}</span>
          <span>{halfValue}</span>
          <span>0</span>
        </div>
        <div>
          <div className={`rounded-2xl bg-slate-50 p-4 ${heightClass}`}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
              <polyline
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                points={points}
              />
            </svg>
          </div>
          <div className="mt-3 grid grid-cols-6 gap-2 text-center text-xs text-slate-500">
            {normalizedData.map((entry) => (
              <span key={entry.label}>{entry.label.slice(0, 3)}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[auto_1fr] gap-4">
      <div className={`flex flex-col justify-between py-2 text-xs text-slate-500 ${heightClass}`}>
        <span>{maxValue}</span>
        <span>{halfValue}</span>
        <span>0</span>
      </div>
      <div>
        <div className={`flex items-end gap-2 rounded-2xl bg-slate-50 p-4 ${heightClass}`}>
          {normalizedData.map((entry, index) => {
            const barHeight = Math.max((entry.value / maxValue) * 100, 4);
            const colorClass = index === highlightIndex ? 'bg-blue-700' : barColor;

            return (
              <div key={`${entry.label}-${index}`} className="flex flex-1 flex-col items-center justify-end gap-2">
                <div className="flex h-full w-full items-end">
                  <div
                    title={`${entry.label}: ${entry.value}`}
                    className={`w-full rounded-t-md transition-all duration-200 hover:bg-blue-600 ${colorClass}`}
                    style={{ height: `${barHeight}%` }}
                  />
                </div>
                <div className="text-center text-[11px] text-slate-500">
                  <p>{entry.label.slice(0, 3)}</p>
                  {entry.caption !== '' && <p>{entry.caption}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SalesChart;

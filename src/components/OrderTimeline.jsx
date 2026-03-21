const stages = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];

function OrderTimeline({ timeline, large = false }) {
  const timelineByStatus = Object.fromEntries(timeline.map((entry) => [entry.status, entry]));
  const latestStatus = timeline[timeline.length - 1]?.status || 'Placed';
  const latestBaseStatus =
    latestStatus === 'Cancelled'
      ? [...timeline].reverse().find((entry) => entry.status !== 'Cancelled')?.status || 'Placed'
      : latestStatus;
  const displayStages = latestStatus === 'Cancelled' ? [...stages, 'Cancelled'] : stages;

  const getDotClass = (status) => {
    if (status === 'Cancelled') {
      return timelineByStatus.Cancelled
        ? 'border-rose-500 bg-rose-500'
        : 'border-slate-300 bg-white';
    }

    if (status === latestBaseStatus && latestStatus !== 'Delivered') {
      return 'animate-pulse border-blue-500 bg-blue-500';
    }

    if (timelineByStatus[status]) {
      return status === 'Delivered'
        ? 'border-emerald-500 bg-emerald-500'
        : 'border-blue-500 bg-blue-500';
    }

    return 'border-slate-300 bg-white';
  };

  return (
    <div className="space-y-0">
      {displayStages.map((status, index) => {
        const entry = timelineByStatus[status];

        return (
          <div key={status} className={`relative pl-10 ${index === displayStages.length - 1 ? '' : 'pb-8'}`}>
            {index !== displayStages.length - 1 && (
              <span
                className={`absolute left-[0.45rem] top-5 h-full w-0.5 ${
                  entry ? (status === 'Cancelled' ? 'bg-rose-200' : 'bg-blue-200') : 'bg-slate-200'
                }`}
              />
            )}
            <span
              className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 ${getDotClass(status)}`}
            />
            <div className={large ? 'space-y-2' : 'space-y-1'}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className={`${large ? 'text-lg' : 'text-sm'} font-semibold text-slate-900`}>{status}</p>
                <p className="text-xs text-slate-500">
                  {entry
                    ? new Date(entry.timestamp).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Awaiting update'}
                </p>
              </div>
              <p className={`${large ? 'text-sm' : 'text-xs'} leading-6 text-slate-500`}>
                {entry?.description || 'This stage has not been reached yet.'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default OrderTimeline;

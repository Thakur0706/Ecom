import { useState } from 'react';

const typeStyles = {
  'New User': 'bg-blue-100 text-blue-700',
  'New Listing': 'bg-indigo-100 text-indigo-700',
  'Order Placed': 'bg-emerald-100 text-emerald-700',
  Payment: 'bg-teal-100 text-teal-700',
  Review: 'bg-purple-100 text-purple-700',
  'Support Ticket': 'bg-rose-100 text-rose-700',
};

const timeAgo = (timestamp) => {
  const diffMs = new Date('2026-03-21T23:59:59+05:30').getTime() - new Date(timestamp).getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / (1000 * 60)), 0);

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  return `${Math.floor(diffHours / 24)} days ago`;
};

function ActivityFeed({ activities, limit = 8 }) {
  const [visibleCount, setVisibleCount] = useState(limit);
  const visibleActivities = activities.slice(0, visibleCount);

  return (
    <div>
      <div className="max-h-80 space-y-4 overflow-y-auto pr-2">
        {visibleActivities.map((activity) => (
          <div key={activity.id} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${typeStyles[activity.type] || 'bg-slate-100 text-slate-600'}`}>
              <span className="text-lg">{activity.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm leading-6 text-slate-600">
                <span className="font-semibold text-slate-900">{activity.user}</span> {activity.description}
              </p>
              <p className="mt-2 text-xs text-slate-400">{timeAgo(activity.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>

      {activities.length > visibleCount && (
        <button
          type="button"
          onClick={() => setVisibleCount((previous) => previous + limit)}
          className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-blue-400 hover:text-blue-600"
        >
          Load More
        </button>
      )}
    </div>
  );
}

export default ActivityFeed;

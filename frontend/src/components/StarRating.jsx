function StarRating({ rating = 0, reviewCount = 0, compact = false }) {
  const filledStars = Math.round(Number(rating || 0));

  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      <span className="tracking-[0.15em] text-amber-400">
        {Array.from({ length: 5 }, (_, index) => (index < filledStars ? '*' : '.')).join(' ')}
      </span>
      <span className="font-medium text-slate-600">
        {Number(rating || 0).toFixed(1)}
        {reviewCount ? ` (${reviewCount})` : ''}
      </span>
    </div>
  );
}

export default StarRating;

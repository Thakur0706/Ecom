function StarRating({ rating }) {
  const filledStars = Math.round(rating);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="tracking-wide text-amber-400">
        {Array.from({ length: 5 }, (_, index) => (index < filledStars ? '★' : '☆')).join(' ')}
      </span>
      <span className="font-medium text-slate-600">{rating.toFixed(1)}</span>
    </div>
  );
}

export default StarRating;

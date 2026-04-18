import { Link } from 'react-router-dom';
import StarRating from './StarRating';

function ServiceCard({ service }) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <img src={service.imageUrl} alt={service.title} className="h-56 w-full object-cover" />

      <div className="space-y-4 px-6 py-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            {service.category}
          </p>
          <h3 className="text-xl font-semibold text-slate-900">{service.title}</h3>
          <p className="min-h-12 text-sm leading-6 text-slate-600">{service.description}</p>
        </div>

        <StarRating rating={service.averageRating} reviewCount={service.reviewCount} compact />

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p>{service.availability || 'Slots managed by admin after booking confirmation.'}</p>
          <p className="mt-1 font-semibold text-slate-900">{service.duration || 'Custom duration'}</p>
        </div>

        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-slate-900">Rs {service.price}</p>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {service.status}
          </span>
        </div>

        <Link
          to={`/services/${service.id}`}
          className="block rounded-full bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          View service
        </Link>
      </div>
    </article>
  );
}

export default ServiceCard;

import { Link } from 'react-router-dom';
import StarRating from './StarRating';

const categoryStyles = {
  Tutoring: 'bg-blue-100 text-blue-700',
  Design: 'bg-fuchsia-100 text-fuchsia-700',
  Programming: 'bg-indigo-100 text-indigo-700',
  Coding: 'bg-indigo-100 text-indigo-700',
  'Content Writing': 'bg-amber-100 text-amber-700',
};

function ServiceCard({ service }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <img
          src={service.image}
          alt={service.title}
          className="h-52 w-full object-cover"
        />
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${categoryStyles[service.category] || 'bg-slate-100 text-slate-700'}`}
        >
          {service.category}
        </span>
      </div>
      <div className="space-y-4 px-6 py-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">{service.title}</h3>
          <p className="text-sm text-slate-600">By {service.provider}</p>
        </div>
        <p className="min-h-12 text-sm text-slate-600">{service.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-slate-900">₹{service.price}</span>
          <StarRating rating={service.rating} />
        </div>
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Availability: <span className="font-semibold text-slate-800">{service.availability}</span>
        </p>
        <Link
          to={`/services/${service.id}`}
          className="block rounded-lg bg-blue-500 px-4 py-2 text-center font-semibold text-white transition hover:bg-indigo-500"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}

export default ServiceCard;

import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import StarRating from '../components/StarRating';
import { services } from '../data/dummyData';

const categoryStyles = {
  Tutoring: 'bg-blue-100 text-blue-700',
  Design: 'bg-fuchsia-100 text-fuchsia-700',
  Programming: 'bg-indigo-100 text-indigo-700',
  'Content Writing': 'bg-amber-100 text-amber-700',
};

function ServiceDetail() {
  const { id } = useParams();
  const service = services.find((item) => item.id === Number(id));
  const [showModal, setShowModal] = useState(false);

  if (!service) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-[2rem] bg-white px-6 py-16 text-center shadow-md">
          <h1 className="text-3xl font-bold text-slate-900">Service not found</h1>
          <Link to="/services" className="mt-4 inline-block font-semibold text-blue-600">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-md">
          <img src={service.image} alt={service.title} className="h-full min-h-[420px] w-full object-cover" />
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-md">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryStyles[service.category]}`}
          >
            {service.category}
          </span>
          <h1 className="mt-5 text-4xl font-bold text-slate-900">{service.title}</h1>
          <p className="mt-4 text-3xl font-bold text-blue-600">₹{service.price}</p>
          <div className="mt-4">
            <StarRating rating={service.rating} />
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 px-5 py-4">
            <p className="text-sm text-slate-500">Provider</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{service.provider}</p>
            <p className="mt-3 text-sm text-slate-600">
              Availability: <span className="font-semibold text-slate-800">{service.availability}</span>
            </p>
          </div>

          <p className="mt-6 text-base leading-7 text-slate-600">{service.description}</p>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-8 w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            Book Now
          </button>

          <Link
            to="/services"
            className="mt-4 inline-flex text-sm font-semibold text-blue-600 transition hover:text-indigo-600"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>

      <section className="mt-10 rounded-[2rem] bg-white p-8 shadow-md">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Reviews</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Student feedback</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {service.reviews.map((review) => (
            <div key={`${review.name}-${review.comment}`} className="rounded-2xl bg-slate-50 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-slate-900">{review.name}</p>
                <StarRating rating={review.rating} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>
            </div>
          ))}
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-6">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-lg">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current stroke-[2]">
                <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
              </svg>
            </div>
            <h3 className="mt-5 text-2xl font-bold text-slate-900">Booking Confirmed!</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Your booking request has been recorded. The provider can now coordinate the next steps with you.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-6 w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceDetail;

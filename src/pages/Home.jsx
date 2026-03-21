import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ServiceCard from '../components/ServiceCard';
import { products, services } from '../data/dummyData';

const stats = [
  { label: 'Students', value: '500+' },
  { label: 'Listings', value: '1200+' },
  { label: 'Services', value: '300+' },
];

const steps = [
  {
    title: 'Register',
    description: 'Create your account and set up your buyer or seller profile in minutes.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.8]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    title: 'Browse',
    description: 'Search campus listings, filter by category, and compare trusted student offers.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.8]">
        <circle cx="11" cy="11" r="6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    title: 'Buy or Book',
    description: 'Purchase useful products or book student services without leaving the platform.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.8]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16l-1.5 9h-13z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7a4 4 0 0 1 8 0" />
      </svg>
    ),
  },
  {
    title: 'Track',
    description: 'Manage your orders, bookings, and listings from one student-friendly dashboard.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.8]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 19h12M6 5h12M8 15l2-2 2 2 4-4" />
      </svg>
    ),
  },
];

function Home() {
  return (
    <div className="space-y-16 pb-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-500 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-10 top-10 h-44 w-44 rounded-full bg-white blur-3xl" />
          <div className="absolute right-0 top-0 h-60 w-60 rounded-full bg-cyan-200 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-indigo-200 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-6 py-20 lg:flex-row lg:items-center lg:py-24">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
              Buy smart. Sell fast. Share skills on campus.
            </div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Welcome to CampusConnect
            </h1>
            <p className="max-w-2xl text-lg text-blue-50">
              The all-in-one student marketplace and skill exchange platform for books,
              gadgets, creative services, tutoring, and more.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/products"
                className="rounded-lg bg-white px-6 py-3 text-center font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                Browse Products
              </Link>
              <Link
                to="/services"
                className="rounded-lg border border-white/30 px-6 py-3 text-center font-semibold text-white transition hover:bg-white/10"
              >
                Explore Services
              </Link>
            </div>
          </div>

          <div className="w-full max-w-xl rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/10 px-6 py-5 shadow-soft backdrop-blur"
                >
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="mt-2 text-sm text-blue-50">{stat.label} growing every semester</p>
                </div>
              ))}
              <div className="rounded-2xl bg-slate-900/20 px-6 py-5 shadow-soft backdrop-blur sm:col-span-2">
                <p className="text-lg font-semibold">Trusted by clubs, peers, and student sellers</p>
                <p className="mt-2 text-sm text-blue-50">
                  From second-hand essentials to peer-led gigs, CampusConnect keeps campus trade
                  simple and organized.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="-mt-8 px-6">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-white px-6 py-6 shadow-md transition hover:shadow-lg"
            >
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="mt-2 text-sm font-medium text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
              Featured Products
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Smart campus essentials</h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-blue-600 transition hover:text-indigo-600">
            View all products
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">
              Featured Services
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Student talent, ready to book</h2>
          </div>
          <Link to="/services" className="text-sm font-semibold text-blue-600 transition hover:text-indigo-600">
            View all services
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.slice(0, 3).map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">How It Works</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Campus commerce without the chaos</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl bg-white px-6 py-6 shadow-md transition hover:shadow-lg"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-soft">
                {step.icon}
              </div>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Step {index + 1}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;

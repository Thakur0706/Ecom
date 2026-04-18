import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ServiceCard from '../components/ServiceCard';
import { api } from '../lib/api';

function Home() {
  const productsQuery = useQuery({
    queryKey: ['home', 'featured-products'],
    queryFn: () => api.products.list({ limit: 4, featured: true, sort: 'discount' }),
  });

  const servicesQuery = useQuery({
    queryKey: ['home', 'featured-services'],
    queryFn: () => api.services.list({ limit: 3 }),
  });

  const products = productsQuery.data?.data?.products || [];
  const services = servicesQuery.data?.data?.services || [];

  return (
    <div className="space-y-16 pb-16">
      <section className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.2),_transparent_34%),linear-gradient(135deg,_#ffffff,_#eff6ff_55%,_#e0e7ff)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700">
              Buyer marketplace, supplier sourcing, and admin operations in one platform
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-bold leading-tight text-slate-900">
                Campus commerce built for real products, real services, and real operations.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Browse approved product listings, book campus services, manage supplier payouts,
                and track real-time analytics from a single light-themed workflow.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/products"
                className="rounded-full bg-blue-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
              >
                Explore products
              </Link>
              <Link
                to="/services"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
              >
                Browse services
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Live products</p>
              <p className="mt-4 text-4xl font-bold text-slate-900">{products.length}</p>
              <p className="mt-2 text-sm text-slate-500">Approved inventory visible to buyers now</p>
            </div>
            <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Services</p>
              <p className="mt-4 text-4xl font-bold text-slate-900">{services.length}</p>
              <p className="mt-2 text-sm text-slate-500">Admin-managed service offerings</p>
            </div>
            <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Suppliers</p>
              <p className="mt-4 text-4xl font-bold text-slate-900">3</p>
              <p className="mt-2 text-sm text-slate-500">Verified supplier accounts on the platform</p>
            </div>
            <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Revenue</p>
              <p className="mt-4 text-4xl font-bold text-slate-900">Live</p>
              <p className="mt-2 text-sm text-slate-500">Admin dashboards refresh from actual order and booking data</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Featured products
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Approved inventory for campus buyers</h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-blue-600">
            View all
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Featured services
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Admin-curated service support</h2>
          </div>
          <Link to="/services" className="text-sm font-semibold text-indigo-600">
            View all
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;

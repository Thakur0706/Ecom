import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ServiceCard from '../components/ServiceCard';
import { api } from '../lib/api';

function ServiceMarketplace() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('rating');

  const servicesQuery = useQuery({
    queryKey: ['services', { search, sort }],
    queryFn: () =>
      api.services.list({
        limit: 100,
        search: search || undefined,
        sort,
      }),
  });

  const services = servicesQuery.data?.data?.services || [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Service marketplace
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Book admin-managed services</h1>
            <p className="mt-2 text-sm text-slate-500">
              Find the right campus support package and book it directly from the platform.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search services"
              className="rounded-full border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500"
            />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-full border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500"
            >
              <option value="rating">Top rated</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}

export default ServiceMarketplace;

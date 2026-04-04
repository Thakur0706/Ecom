import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ServiceCard from '../components/ServiceCard';
import { api } from '../lib/api';
import { formatService } from '../lib/formatters';

const categories = ['All', 'Tutoring', 'Design', 'Coding', 'Content Writing'];

function ServiceMarketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const servicesQuery = useQuery({
    queryKey: ['services', { searchTerm, activeCategory }],
    queryFn: () =>
      api.services.list({
        limit: 100,
        search: searchTerm || undefined,
        category: activeCategory === 'All' ? undefined : activeCategory,
      }),
  });

  const filteredServices = (servicesQuery.data?.data?.services || []).map(formatService);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-[2rem] bg-white p-8 shadow-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">
              Service Marketplace
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Hire talented students</h1>
            <p className="mt-2 text-sm text-slate-500">{filteredServices.length} services available</p>
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search services by title"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 lg:max-w-md"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filteredServices.length > 0 ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[2rem] bg-white px-6 py-16 text-center shadow-md">
          <h2 className="text-2xl font-bold text-slate-900">No services found</h2>
          <p className="mt-3 text-sm text-slate-500">
            Try adjusting the search term or choosing another category.
          </p>
        </div>
      )}
    </div>
  );
}

export default ServiceMarketplace;

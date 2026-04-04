import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { api } from '../lib/api';
import { formatService } from '../lib/formatters';

function ListService() {
  const { currentUser } = useAppContext();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'Tutoring',
    description: '',
    price: '',
    availability: '',
    imageUrl: '',
  });

  const servicesQuery = useQuery({
    queryKey: ['services', 'mine'],
    queryFn: () => api.services.mine({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'seller'),
  });

  const createMutation = useMutation({
    mutationFn: api.services.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.services.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: api.services.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const myServices = (servicesQuery.data?.data?.services || []).map(formatService);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await createMutation.mutateAsync({
        ...formData,
        price: Number(formData.price),
      });
      setSuccessMessage('Service submitted successfully. It is now pending admin approval.');
      setFormData({
        title: '',
        category: 'Tutoring',
        description: '',
        price: '',
        availability: '',
        imageUrl: '',
      });
    } catch (error) {
      setSuccessMessage(error.response?.data?.message || 'Unable to create service.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] bg-white p-8 shadow-md">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">List Service</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Submit a new service listing</h1>
          </div>

          {successMessage && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Title"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
            <div className="grid gap-5 md:grid-cols-2">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              >
                <option>Tutoring</option>
                <option>Design</option>
                <option>Coding</option>
                <option>Content Writing</option>
              </select>
              <input
                name="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="Price"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>
            <textarea
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Description"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
            <input
              name="availability"
              type="text"
              value={formData.availability}
              onChange={handleChange}
              required
              placeholder="Availability"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
            <input
              name="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="Public image URL"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Service'}
            </button>
          </form>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-md">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">My Services</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Manage your services</h2>
          </div>

          <div className="mt-6 space-y-4">
            {myServices.map((service) => (
              <div key={service.id} className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center">
                <img src={service.image} alt={service.title} className="h-24 w-full rounded-2xl object-cover sm:w-28" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">{service.title}</h3>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {service.status}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {service.isActive ? 'active' : 'inactive'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {service.category} • Rs {service.price} • {service.availability}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate(service.id)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Toggle
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(service.id)}
                    className="rounded-lg bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {myServices.length === 0 && (
              <div className="rounded-2xl bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                No service listings yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListService;

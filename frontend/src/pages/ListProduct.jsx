import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { api } from '../lib/api';
import { formatProduct } from '../lib/formatters';

function ListProduct() {
  const { currentUser } = useAppContext();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'Books',
    description: '',
    price: '',
    condition: 'new',
    stock: '',
    imageUrl: '',
  });

  const productsQuery = useQuery({
    queryKey: ['products', 'mine'],
    queryFn: () => api.products.mine({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'seller'),
  });

  const createMutation = useMutation({
    mutationFn: api.products.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.products.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: api.products.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const myProducts = (productsQuery.data?.data?.products || []).map(formatProduct);

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
        stock: Number(formData.stock),
      });
      setSuccessMessage('Product submitted successfully. It is now pending admin approval.');
      setFormData({
        title: '',
        category: 'Books',
        description: '',
        price: '',
        condition: 'new',
        stock: '',
        imageUrl: '',
      });
    } catch (error) {
      setSuccessMessage(error.response?.data?.message || 'Unable to create product.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] bg-white p-8 shadow-md">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">List Product</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Submit a new product listing</h1>
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
                <option>Books</option>
                <option>Electronics</option>
                <option>Accessories</option>
                <option>Lab Equipment</option>
              </select>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              >
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
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
            <div className="grid gap-5 md:grid-cols-2">
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
              <input
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                required
                placeholder="Stock"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>
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
              {createMutation.isPending ? 'Submitting...' : 'Submit Product'}
            </button>
          </form>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">My Products</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Manage your listings</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {myProducts.map((product) => (
              <div key={product.id} className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center">
                <img src={product.image} alt={product.title} className="h-24 w-full rounded-2xl object-cover sm:w-28" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">{product.title}</h3>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {product.status}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {product.isActive ? 'active' : 'inactive'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {product.category} • Rs {product.price} • Stock {product.stock}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate(product.id)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Toggle
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(product.id)}
                    className="rounded-lg bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {myProducts.length === 0 && (
              <div className="rounded-2xl bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                No product listings yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListProduct;

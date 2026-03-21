import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

function ListProduct() {
  const { currentUser } = useAppContext();
  const [successMessage, setSuccessMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'Books',
    description: '',
    price: '',
    condition: 'New',
    image: null,
  });

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFormData((previous) => ({ ...previous, image: file }));
    setPreviewUrl(file ? URL.createObjectURL(file) : '');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSuccessMessage('Product listed successfully!');
    setFormData({
      title: '',
      category: 'Books',
      description: '',
      price: '',
      condition: 'New',
      image: null,
    });
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-[2rem] bg-white p-8 shadow-md">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">List Product</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Share an item with your campus</h1>
        </div>

        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-semibold text-slate-700">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-2 block text-sm font-semibold text-slate-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              >
                <option>Books</option>
                <option>Electronics</option>
                <option>Accessories</option>
              </select>
            </div>

            <div>
              <label htmlFor="condition" className="mb-2 block text-sm font-semibold text-slate-700">
                Condition
              </label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              >
                <option>New</option>
                <option>Good</option>
                <option>Fair</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="price" className="mb-2 block text-sm font-semibold text-slate-700">
              Price
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              value={formData.price}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="image" className="mb-2 block text-sm font-semibold text-slate-700">
              Image Upload
            </label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-600"
            />
          </div>

          {previewUrl && (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <img src={previewUrl} alt="Product preview" className="h-72 w-full object-cover" />
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            List Product
          </button>
        </form>
      </div>
    </div>
  );
}

export default ListProduct;

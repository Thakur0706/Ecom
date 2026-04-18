import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

const initialState = {
  title: '',
  description: '',
  category: '',
  imageUrl: '',
  condition: 'new',
  quotedPrice: '',
  availableStock: '',
  lowStockThreshold: 5,
  status: '',
  rejectionReason: '',
};

function SupplierProductForm({ isEdit = false }) {
  const [form, setForm] = useState(initialState);
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['supplier', 'product', id],
    queryFn: () => api.supplier.product(id),
    enabled: isEdit && !!id,
  });

  useEffect(() => {
    if (isEdit && data?.data?.product) {
      const p = data.data.product;
      setForm({
        title: p.title,
        description: p.description,
        category: p.category,
        imageUrl: p.imageUrl,
        condition: p.condition,
        quotedPrice: p.quotedPrice,
        availableStock: p.availableStock,
        lowStockThreshold: p.lowStockThreshold,
        status: p.status,
        rejectionReason: p.rejectionReason,
      });
    }
  }, [isEdit, data]);

  const mutation = useMutation({
    mutationFn: (payload) => 
       isEdit ? api.supplier.updateProduct(id, payload) : api.supplier.createProduct(payload),
    onSuccess: () => navigate('/supplier/products'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
       ...form,
       quotedPrice: Number(form.quotedPrice),
       availableStock: Number(form.availableStock),
       lowStockThreshold: Number(form.lowStockThreshold),
    });
  };

  if (isEdit && isLoading) {
     return <div className="p-10 text-center">Loading product details...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
       <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-8">
          {isEdit ? 'Edit Product' : 'Add New Product'}
       </h1>

       {form.status === 'rejected' && form.rejectionReason && (
          <div className="mb-8 rounded-xl bg-rose-50 border border-rose-200 p-5">
             <h3 className="text-sm font-black text-rose-800 uppercase tracking-wider mb-2">Product Rejected</h3>
             <p className="text-sm text-rose-700 font-medium">
               <strong>Reason:</strong> {form.rejectionReason}
             </p>
             <p className="text-sm text-rose-600 mt-2">
               Please address the issue(s) above and save your changes. Your product will automatically be reconsidered for approval.
             </p>
          </div>
       )}

       <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 grid gap-6">
          <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
             <input required name="title" value={form.title} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-amber-500" />
          </div>

          <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
             <textarea required name="description" value={form.description} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-amber-500 min-h-[100px]" />
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                <input required name="category" value={form.category} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-amber-500" />
             </div>
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Condition</label>
                <select name="condition" value={form.condition} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-amber-500 bg-white">
                   <option value="new">New</option>
                   <option value="like-new">Like New</option>
                   <option value="good">Good</option>
                   <option value="fair">Fair</option>
                </select>
             </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">Image URL</label>
             <input required type="url" name="imageUrl" value={form.imageUrl} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-amber-500" />
          </div>

          <div className="grid grid-cols-3 gap-6">
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Quoted Price (₹)</label>
                <input required type="number" min="0" name="quotedPrice" value={form.quotedPrice} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-amber-500" />
             </div>
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Stock Available</label>
                <input required type="number" min="0" name="availableStock" value={form.availableStock} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-amber-500" />
             </div>
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Low Stock Alert At</label>
                <input required type="number" min="0" name="lowStockThreshold" value={form.lowStockThreshold} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-amber-500" />
             </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-6 flex justify-end gap-3">
             <button type="button" onClick={() => navigate('/supplier/products')} className="rounded-lg px-6 py-3 font-bold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
             <button type="submit" disabled={mutation.isPending} className="rounded-lg bg-amber-500 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50">
                {mutation.isPending ? 'Saving...' : 'Save Product'}
             </button>
          </div>
       </form>
    </div>
  );
}

export default SupplierProductForm;

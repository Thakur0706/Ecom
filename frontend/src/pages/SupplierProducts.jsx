import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

function SupplierProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ['supplier', 'products'],
    queryFn: () => api.supplier.products(),
  });

  const products = data?.data?.products || [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
       <div className="flex items-center justify-between mb-8">
          <div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Products</h1>
             <p className="text-slate-500 mt-2">Manage your current listings and check their approval status.</p>
          </div>
          <Link to="/supplier/products/new" className="rounded-lg bg-amber-500 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-amber-600">
             Add New Product
          </Link>
       </div>

       <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
             <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-bold">
                <tr>
                   <th className="px-6 py-4">Product Info</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4">Stock</th>
                   <th className="px-6 py-4 text-right">Quoted Price</th>
                   <th className="px-6 py-4 text-center">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                   <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading products...</td></tr>
                ) : products.length === 0 ? (
                   <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500">
                         No products found. Start by adding one!
                      </td>
                   </tr>
                ) : (
                   products.map(product => (
                      <tr key={product._id} className="hover:bg-slate-50 transition">
                         <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{product.title}</div>
                            <div className="text-slate-500 text-xs mt-1">{product.category}</div>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                               product.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                               product.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                               'bg-rose-100 text-rose-800'
                            }`}>
                               {product.status}
                            </span>
                            {product.status === 'rejected' && product.rejectionReason && (
                               <div className="mt-2 text-xs text-rose-600 max-w-[200px] whitespace-normal">
                                  <strong>Reason:</strong> {product.rejectionReason}
                               </div>
                            )}
                         </td>
                         <td className="px-6 py-4 font-semibold text-slate-700">
                            {product.availableStock}
                         </td>
                         <td className="px-6 py-4 text-right font-bold text-slate-900">
                            ₹ {product.quotedPrice}
                         </td>
                         <td className="px-6 py-4 text-center">
                            {(product.status === 'pending' || product.status === 'rejected') && (
                               <Link to={`/supplier/products/${product._id}/edit`} className="text-amber-600 font-semibold hover:underline">
                                  Edit Listing
                               </Link>
                            )}
                         </td>
                      </tr>
                   ))
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
}

export default SupplierProducts;

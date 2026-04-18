import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

function SupplierLedger() {
  const { data, isLoading } = useQuery({
    queryKey: ['supplier', 'ledger'],
    queryFn: () => api.supplier.ledger(),
  });

  const entries = data?.data?.entries || [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
       <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Ledger</h1>
          <p className="text-slate-500 mt-2">Track your credits and payouts securely.</p>
       </div>

       <div className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
             <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-bold">
                <tr>
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4">Description</th>
                   <th className="px-6 py-4">Type</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4 text-right">Amount</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                   <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading ledger...</td></tr>
                ) : entries.length === 0 ? (
                   <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500">
                         No ledger entries yet.
                      </td>
                   </tr>
                ) : (
                   entries.map(entry => (
                      <tr key={entry._id} className="hover:bg-slate-50 transition">
                         <td className="px-6 py-4 text-slate-600">
                            {new Date(entry.createdAt).toLocaleDateString()}
                         </td>
                         <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{entry.description}</div>
                            {entry.reference && <div className="text-slate-500 text-xs mt-1">Ref: {entry.reference}</div>}
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                               entry.type === 'credit' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                               {entry.type}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                               entry.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                               {entry.status}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right font-black text-slate-900">
                            ₹ {entry.amount.toLocaleString()}
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

export default SupplierLedger;

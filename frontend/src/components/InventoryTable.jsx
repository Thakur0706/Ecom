import { useState } from 'react';

const categoryStyles = {
  Books: 'bg-blue-100 text-blue-700',
  Electronics: 'bg-indigo-100 text-indigo-700',
  Accessories: 'bg-emerald-100 text-emerald-700',
  Stationery: 'bg-amber-100 text-amber-700',
};

const conditionStyles = {
  New: 'bg-emerald-100 text-emerald-700',
  Good: 'bg-blue-100 text-blue-700',
  Fair: 'bg-amber-100 text-amber-700',
};

const statusStyles = {
  Active: 'bg-emerald-100 text-emerald-700',
  'Low Stock': 'bg-amber-100 text-amber-700',
  'Out of Stock': 'bg-rose-100 text-rose-700',
};

function InventoryTable({ items, onUpdateStock, onRemove }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const beginEditing = (item) => {
    setEditingId(item.id);
    setEditValue(String(item.totalStock));
  };

  const saveEditing = (itemId) => {
    if (editingId !== itemId) {
      return;
    }

    onUpdateStock(itemId, Number(editValue));
    setEditingId(null);
    setEditValue('');
  };

  const handleRemove = (itemId, title) => {
    if (window.confirm(`Remove ${title} from inventory?`)) {
      onRemove(itemId);
    }
  };

  const availableStockColor = (availableStock) => {
    if (availableStock === 0) {
      return 'text-rose-600';
    }

    if (availableStock <= 2) {
      return 'text-amber-600';
    }

    return 'text-emerald-600';
  };

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl bg-white shadow-md lg:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-500">
            <tr>
              {['#', 'Image', 'Product', 'Category', 'Condition', 'Price', 'Total Stock', 'Sold', 'Available', 'Status', 'Actions'].map((heading) => (
                <th key={heading} className="px-4 py-4 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-4 font-semibold text-slate-700">{index + 1}</td>
                <td className="px-4 py-4">
                  <img src={item.image} alt={item.title} className="h-14 w-14 rounded-xl object-cover" />
                </td>
                <td className="px-4 py-4 font-semibold text-slate-900">{item.title}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryStyles[item.category]}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${conditionStyles[item.condition]}`}>
                    {item.condition}
                  </span>
                </td>
                <td className="px-4 py-4 font-semibold text-slate-900">₹{item.price}</td>
                <td className="px-4 py-4">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      min="0"
                      autoFocus
                      value={editValue}
                      onChange={(event) => setEditValue(event.target.value)}
                      onBlur={() => saveEditing(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          saveEditing(item.id);
                        }
                      }}
                      className="w-24 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => beginEditing(item)}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-200"
                    >
                      {item.totalStock}
                      <span aria-hidden="true">✎</span>
                    </button>
                  )}
                </td>
                <td className="px-4 py-4 text-slate-600">{item.soldCount}</td>
                <td className={`px-4 py-4 font-semibold ${availableStockColor(item.availableStock)}`}>
                  {item.availableStock}
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => beginEditing(item)}
                      className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-600 transition-all duration-200 hover:bg-blue-100"
                    >
                      Edit Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id, item.title)}
                      className="rounded-lg bg-rose-50 px-3 py-2 font-semibold text-rose-600 transition-all duration-200 hover:bg-rose-100"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:hidden">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-white p-5 shadow-md">
            <div className="flex gap-4">
              <img src={item.image} alt={item.title} className="h-20 w-20 rounded-2xl object-cover" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryStyles[item.category]}`}>
                    {item.category}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${conditionStyles[item.condition]}`}>
                    {item.condition}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <p>Price: <span className="font-semibold text-slate-900">₹{item.price}</span></p>
              <p>Sold: <span className="font-semibold text-slate-900">{item.soldCount}</span></p>
              <p className={availableStockColor(item.availableStock)}>
                Available: <span className="font-semibold">{item.availableStock}</span>
              </p>
              <div>
                <span className="font-semibold text-slate-900">Stock: </span>
                {editingId === item.id ? (
                  <input
                    type="number"
                    min="0"
                    autoFocus
                    value={editValue}
                    onChange={(event) => setEditValue(event.target.value)}
                    onBlur={() => saveEditing(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        saveEditing(item.id);
                      }
                    }}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => beginEditing(item)}
                    className="mt-2 rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700"
                  >
                    {item.totalStock} ✎
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => beginEditing(item)}
                className="flex-1 rounded-lg bg-blue-50 px-4 py-2 font-semibold text-blue-600 transition-all duration-200 hover:bg-blue-100"
              >
                Edit Stock
              </button>
              <button
                type="button"
                onClick={() => handleRemove(item.id, item.title)}
                className="flex-1 rounded-lg bg-rose-50 px-4 py-2 font-semibold text-rose-600 transition-all duration-200 hover:bg-rose-100"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default InventoryTable;

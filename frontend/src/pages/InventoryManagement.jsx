import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import InventoryTable from '../components/InventoryTable';
import StockAlert from '../components/StockAlert';
import { useOrderContext } from '../context/OrderContext';
import { useAppContext } from '../context/AppContext';

const categories = ['All', 'Books', 'Electronics', 'Accessories', 'Stationery'];
const statuses = ['All', 'Active', 'Low Stock', 'Out of Stock'];
const sortOptions = ['Name A-Z', 'Price High-Low', 'Stock Low-High'];

function InventoryManagement() {
  const { currentUser } = useAppContext();
  const { inventory, updateInventoryStock, addInventoryItem, removeInventoryItem, getInventoryAlerts } =
    useOrderContext();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOption, setSortOption] = useState(sortOptions[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Books',
    condition: 'New',
    price: '',
    totalStock: '',
    image: '',
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (searchParams.get('status') === 'alerts') {
      setStatusFilter('Low Stock');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!showToast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setShowToast(false), 2500);
    return () => window.clearTimeout(timer);
  }, [showToast]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'buyer') {
    return <Navigate to="/dashboard" replace />;
  }

  const alerts = getInventoryAlerts();

  const filteredInventory = [...inventory]
    .filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((left, right) => {
      if (sortOption === 'Name A-Z') {
        return left.title.localeCompare(right.title);
      }

      if (sortOption === 'Price High-Low') {
        return right.price - left.price;
      }

      return left.availableStock - right.availableStock;
    });

  const summaryCards = [
    { label: 'Total Listed Items', value: inventory.length, filter: 'All', styles: 'from-blue-500 to-blue-600 text-white' },
    {
      label: 'Active Listings',
      value: inventory.filter((item) => item.status === 'Active').length,
      filter: 'Active',
      styles: 'from-emerald-500 to-emerald-600 text-white',
    },
    {
      label: 'Low Stock Items',
      value: inventory.filter((item) => item.status === 'Low Stock').length,
      filter: 'Low Stock',
      styles: 'from-amber-400 to-amber-500 text-white',
    },
    {
      label: 'Out of Stock',
      value: inventory.filter((item) => item.status === 'Out of Stock').length,
      filter: 'Out of Stock',
      styles: 'from-rose-500 to-rose-600 text-white',
    },
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    addInventoryItem({
      ...formData,
      sellerId: currentUser.id || 'user_2',
    });
    setShowAddModal(false);
    setShowToast(true);
    setFormData({
      title: '',
      category: 'Books',
      condition: 'New',
      price: '',
      totalStock: '',
      image: '',
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="mt-8 h-96 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Inventory</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Inventory Management</h1>
              <p className="mt-2 text-sm text-slate-500">Monitor stock, update listings, and respond to alerts.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
            >
              Add New Item
            </button>
          </div>
        </div>

        <div className="mt-6">
          <StockAlert alerts={alerts} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => setStatusFilter(card.filter)}
              className={`rounded-2xl bg-gradient-to-br p-6 text-left shadow-md transition-all duration-200 hover:shadow-lg ${card.styles}`}
            >
              <p className="text-sm font-medium text-white/80">{card.label}</p>
              <p className="mt-3 text-3xl font-bold">{card.value}</p>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-md">
          <div className="grid gap-4 xl:grid-cols-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by product title"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            >
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
            <select
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8">
          {filteredInventory.length > 0 ? (
            <InventoryTable
              items={filteredInventory}
              onUpdateStock={updateInventoryStock}
              onRemove={removeInventoryItem}
            />
          ) : (
            <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-md">
              <h2 className="text-2xl font-bold text-slate-900">No inventory items found</h2>
              <p className="mt-3 text-sm text-slate-500">
                Try another search term or adjust the category and stock filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8">
            <h3 className="text-2xl font-bold text-slate-900">Add New Item</h3>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Title"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              >
                {categories.slice(1).map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              >
                <option>New</option>
                <option>Good</option>
                <option>Fair</option>
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
              <input
                name="totalStock"
                type="number"
                min="0"
                value={formData.totalStock}
                onChange={handleChange}
                required
                placeholder="Total Stock"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
              <input
                name="image"
                type="url"
                value={formData.image}
                onChange={handleChange}
                placeholder="Image URL (optional)"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-3 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed right-4 top-24 z-50 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          Inventory item added successfully!
        </div>
      )}
    </>
  );
}

export default InventoryManagement;

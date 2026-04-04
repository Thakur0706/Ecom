import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/ProductCard';
import { api } from '../lib/api';
import { formatProduct } from '../lib/formatters';

const categories = ['All', 'Books', 'Electronics', 'Accessories', 'Lab Equipment'];
const priceRanges = ['All Prices', 'Under Rs 200', 'Rs 200-Rs 500', 'Above Rs 500'];

function ProductMarketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [priceRange, setPriceRange] = useState('All Prices');

  const params = {
    limit: 100,
    search: searchTerm || undefined,
    category: activeCategory === 'All' ? undefined : activeCategory,
  };

  if (priceRange === 'Under Rs 200') {
    params.maxPrice = 199;
  }

  if (priceRange === 'Rs 200-Rs 500') {
    params.minPrice = 200;
    params.maxPrice = 500;
  }

  if (priceRange === 'Above Rs 500') {
    params.minPrice = 501;
  }

  const productsQuery = useQuery({
    queryKey: ['products', params],
    queryFn: () => api.products.list(params),
  });

  const filteredProducts = (productsQuery.data?.data?.products || []).map(formatProduct);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-[2rem] bg-white p-8 shadow-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
              Product Marketplace
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Find useful campus essentials</h1>
            <p className="mt-2 text-sm text-slate-500">{filteredProducts.length} products available</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:min-w-[480px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products by title"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
            <select
              value={priceRange}
              onChange={(event) => setPriceRange(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            >
              {priceRanges.map((range) => (
                <option key={range}>{range}</option>
              ))}
            </select>
          </div>
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

      {filteredProducts.length > 0 ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[2rem] bg-white px-6 py-16 text-center shadow-md">
          <h2 className="text-2xl font-bold text-slate-900">No products found</h2>
          <p className="mt-3 text-sm text-slate-500">
            Try adjusting your search term, category, or price range.
          </p>
        </div>
      )}
    </div>
  );
}

export default ProductMarketplace;

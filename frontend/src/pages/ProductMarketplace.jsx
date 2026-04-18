import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/ProductCard';
import { api } from '../lib/api';

const categories = ['All', 'Electrical', 'Mechanical', 'Electronic Modules'];
const conditions = ['All', 'new', 'like-new', 'good', 'fair'];

function ProductMarketplace() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [condition, setCondition] = useState('All');
  const [sort, setSort] = useState('discount');
  const [discountOnly, setDiscountOnly] = useState(false);

  const productsQuery = useQuery({
    queryKey: ['products', { search, category, condition, sort, discountOnly }],
    queryFn: () =>
      api.products.list({
        limit: 100,
        search: search || undefined,
        category: category === 'All' ? undefined : category,
        condition: condition === 'All' ? undefined : condition,
        sort,
        discount: discountOnly ? 'true' : undefined,
      }),
  });

  const products = productsQuery.data?.data?.products || [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Product marketplace
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Browse approved product listings</h1>
            <p className="mt-2 text-sm text-slate-500">
              Filter by category, condition, discount, and search terms.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              className="rounded-full border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-full border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
              className="rounded-full border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
            >
              {conditions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-full border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
            >
              <option value="discount">Highest discount</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
        </div>

        <label className="mt-6 inline-flex items-center gap-3 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={discountOnly}
            onChange={(event) => setDiscountOnly(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Discounted only
        </label>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default ProductMarketplace;

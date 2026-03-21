import { Link } from 'react-router-dom';
import { useState } from 'react';
import StarRating from './StarRating';
import { useAppContext } from '../context/AppContext';

const categoryStyles = {
  Books: 'bg-blue-100 text-blue-700',
  Electronics: 'bg-indigo-100 text-indigo-700',
  Accessories: 'bg-emerald-100 text-emerald-700',
};

const conditionStyles = {
  New: 'bg-emerald-100 text-emerald-700',
  Good: 'bg-amber-100 text-amber-700',
  Fair: 'bg-rose-100 text-rose-700',
};

function ProductCard({ product }) {
  const { addToCart } = useAppContext();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <img
          src={product.image}
          alt={product.title}
          className="h-52 w-full object-cover"
        />
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${categoryStyles[product.category]}`}
        >
          {product.category}
        </span>
      </div>
      <div className="space-y-4 px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{product.title}</h3>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${conditionStyles[product.condition]}`}
          >
            {product.condition}
          </span>
        </div>
        <p className="min-h-12 text-sm text-slate-600">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-slate-900">₹{product.price}</span>
          <StarRating rating={product.rating} />
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Seller: <span className="font-semibold text-slate-800">{product.seller}</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to={`/products/${product.id}`}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-center font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition hover:bg-indigo-500"
          >
            {added ? 'Added!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;

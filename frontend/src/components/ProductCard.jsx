import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import StarRating from './StarRating';
import { useAppContext } from '../context/AppContext';

const conditionClasses = {
  new: 'bg-emerald-50 text-emerald-700',
  'like-new': 'bg-sky-50 text-sky-700',
  good: 'bg-amber-50 text-amber-700',
  fair: 'bg-rose-50 text-rose-700',
};

function sentenceCase(value = '') {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function ProductCard({ product }) {
  const { addToCart, currentUser } = useAppContext();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  const hasDiscount = Number(product.discountPercent || 0) > 0 && product.discountActive !== false;

  const handleAddToCart = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setBusy(true);

    try {
      await addToCart({
        productId: product.id,
        quantity: 1,
      });
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <img src={product.imageUrl} alt={product.title} className="h-56 w-full object-cover" />

        {hasDiscount && (
          <span className="absolute left-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white">
            {product.discountPercent}% OFF
          </span>
        )}

        <span
          className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${
            conditionClasses[product.condition] || 'bg-slate-100 text-slate-700'
          }`}
        >
          {sentenceCase(product.condition)}
        </span>

        {product.isFlashSale && (
          <span className="absolute bottom-4 left-4 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-900">
            Flash Sale
          </span>
        )}
      </div>

      <div className="space-y-4 px-6 py-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            {product.category}
          </p>
          <h3 className="text-xl font-semibold text-slate-900">{product.title}</h3>
          <p className="min-h-12 text-sm leading-6 text-slate-600">{product.description}</p>
        </div>

        <StarRating rating={product.averageRating} reviewCount={product.reviewCount} compact />

        <div className="flex items-end justify-between">
          <div>
            {hasDiscount && (
              <p className="text-sm text-slate-400 line-through">Rs {product.sellingPrice}</p>
            )}
            <p className="text-2xl font-bold text-slate-900">Rs {product.finalPrice}</p>
          </div>
          <p className="text-sm text-slate-500">
            {product.availableStock > 0 ? `${product.availableStock} in stock` : 'Out of stock'}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to={`/products/${product.id}`}
            className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
          >
            View
          </Link>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={busy || product.availableStock <= 0}
            className="flex-1 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy ? 'Adding...' : added ? 'Added' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;

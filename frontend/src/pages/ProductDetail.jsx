import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import StarRating from '../components/StarRating';
import { useAppContext } from '../context/AppContext';
import { api } from '../lib/api';
import { formatProduct, formatReview } from '../lib/formatters';

const categoryStyles = {
  Books: 'bg-blue-100 text-blue-700',
  Electronics: 'bg-indigo-100 text-indigo-700',
  Accessories: 'bg-emerald-100 text-emerald-700',
  'Lab Equipment': 'bg-amber-100 text-amber-700',
};

const conditionStyles = {
  New: 'bg-emerald-100 text-emerald-700',
  'Like New': 'bg-sky-100 text-sky-700',
  Good: 'bg-amber-100 text-amber-700',
  Fair: 'bg-rose-100 text-rose-700',
};

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, currentUser } = useAppContext();
  const [added, setAdded] = useState(false);
  const productQuery = useQuery({
    queryKey: ['products', id],
    queryFn: () => api.products.get(id),
  });
  const reviewsQuery = useQuery({
    queryKey: ['reviews', 'product', id],
    queryFn: () => api.reviews.product(id, { limit: 20 }),
  });

  const product = formatProduct(productQuery.data?.data?.product);
  const reviews = (reviewsQuery.data?.data?.reviews || []).map(formatReview);

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-[2rem] bg-white px-6 py-16 text-center shadow-md">
          <h1 className="text-3xl font-bold text-slate-900">Product not found</h1>
          <Link to="/products" className="mt-4 inline-block font-semibold text-blue-600">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      await addToCart(product);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1600);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-md">
          <img src={product.image} alt={product.title} className="h-full min-h-[420px] w-full object-cover" />
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-md">
          <div className="flex flex-wrap gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryStyles[product.category] || 'bg-slate-100 text-slate-700'}`}
            >
              {product.category}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${conditionStyles[product.condition] || 'bg-slate-100 text-slate-700'}`}
            >
              {product.condition}
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-bold text-slate-900">{product.title}</h1>
          <p className="mt-4 text-3xl font-bold text-blue-600">Rs {product.price}</p>
          <div className="mt-4">
            <StarRating rating={product.rating} />
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 px-5 py-4">
            <p className="text-sm text-slate-500">Seller</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{product.seller}</p>
            <p className="mt-2 text-sm text-slate-600">Stock available: {product.stock}</p>
          </div>

          <p className="mt-6 text-base leading-7 text-slate-600">{product.description}</p>

          <button
            type="button"
            onClick={handleAddToCart}
            className="mt-8 w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            {added ? 'Added!' : 'Add to Cart'}
          </button>

          <Link
            to="/products"
            className="mt-4 inline-flex text-sm font-semibold text-blue-600 transition hover:text-indigo-600"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>

      <section className="mt-10 rounded-[2rem] bg-white p-8 shadow-md">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Reviews</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">What students are saying</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <div key={`${review.name}-${review.comment}`} className="rounded-2xl bg-slate-50 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-slate-900">{review.name}</p>
                <StarRating rating={review.rating} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="rounded-2xl bg-slate-50 px-5 py-8 text-sm text-slate-500">
              No reviews yet for this product.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ProductDetail;

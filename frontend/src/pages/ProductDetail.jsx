import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import StarRating from '../components/StarRating';
import { useAppContext } from '../context/AppContext';
import { api } from '../lib/api';

function ProductDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { currentUser, addToCart } = useAppContext();
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState('');

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.products.get(id),
  });

  const reviewsQuery = useQuery({
    queryKey: ['product', id, 'reviews'],
    queryFn: () => api.products.reviews(id),
  });

  const reviewMutation = useMutation({
    mutationFn: (payload) => api.products.createReview(id, payload),
    onSuccess: () => {
      setMessage('Review submitted successfully.');
      setReviewForm({ rating: 5, comment: '' });
      queryClient.invalidateQueries({ queryKey: ['product', id, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
    onError: (error) => {
      setMessage(error.response?.data?.message || 'Unable to submit review.');
    },
  });

  const product = productQuery.data?.data?.product;
  const reviews = reviewsQuery.data?.data?.reviews || [];
  const hasDiscount = product && product.discountActive !== false && Number(product.discountPercent || 0) > 0;

  if (!product) {
    return <div className="px-6 py-10 text-sm text-slate-500">Loading product...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="relative">
            <img src={product.imageUrl} alt={product.title} className="h-[28rem] w-full object-cover" />
            {hasDiscount && (
              <span className="absolute left-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white">
                {product.discountPercent}% OFF
              </span>
            )}
            <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
              {product.condition}
            </span>
          </div>
        </div>

        <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{product.category}</p>
            <h1 className="text-4xl font-semibold text-slate-900">{product.title}</h1>
            <StarRating rating={product.averageRating} reviewCount={product.reviewCount} />
          </div>

          <p className="text-base leading-8 text-slate-600">{product.description}</p>

          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            {hasDiscount && (
              <p className="text-base text-slate-400 line-through">Rs {product.sellingPrice}</p>
            )}
            <p className="mt-1 text-4xl font-bold text-slate-900">Rs {product.finalPrice}</p>
            <p className="mt-2 text-sm text-slate-500">
              {product.availableStock > 0
                ? `${product.availableStock} units currently available`
                : 'Currently out of stock'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => addToCart({ productId: product.id, quantity: 1 })}
            disabled={product.availableStock <= 0}
            className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
          >
            Add to cart
          </button>

          {message && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {message}
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Add a review</h2>
          <p className="mt-2 text-sm text-slate-500">
            Backend validation will only allow reviews from buyers with a delivered order.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              reviewMutation.mutate(reviewForm);
            }}
            className="mt-6 space-y-4"
          >
            <select
              value={reviewForm.rating}
              onChange={(event) => setReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              disabled={!currentUser}
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} stars
                </option>
              ))}
            </select>
            <textarea
              rows="5"
              value={reviewForm.comment}
              onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
              placeholder={currentUser ? 'Share your product experience' : 'Log in to add a review'}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              disabled={!currentUser}
            />
            <button
              type="submit"
              disabled={!currentUser || reviewMutation.isPending}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
            >
              {reviewMutation.isPending ? 'Submitting...' : 'Submit review'}
            </button>
          </form>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Reviews</h2>
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <article key={review._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-slate-900">{review.reviewerId?.name || 'Buyer'}</p>
                  <span className="text-sm font-semibold text-amber-600">{review.rating}/5</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProductDetail;

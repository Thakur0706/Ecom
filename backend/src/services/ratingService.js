import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { Service } from '../models/Service.js';

async function getAverageRating(targetType, targetId) {
  const result = await Review.aggregate([
    {
      $match: {
        targetType,
        targetId,
      },
    },
    {
      $group: {
        _id: '$targetId',
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  return result[0]?.averageRating || 0;
}

async function getReviewCount(targetType, targetId) {
  return Review.countDocuments({
    targetType,
    targetId,
  });
}

export async function refreshProductRating(productId) {
  const [averageRating, reviewCount] = await Promise.all([
    getAverageRating('product', productId),
    getReviewCount('product', productId),
  ]);
  await Product.findByIdAndUpdate(productId, { averageRating, reviewCount });
  return averageRating;
}

export async function refreshServiceRating(serviceId) {
  const [averageRating, reviewCount] = await Promise.all([
    getAverageRating('service', serviceId),
    getReviewCount('service', serviceId),
  ]);
  await Service.findByIdAndUpdate(serviceId, { averageRating, reviewCount });
  return averageRating;
}

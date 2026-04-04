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

export async function refreshProductRating(productId) {
  const averageRating = await getAverageRating('product', productId);
  await Product.findByIdAndUpdate(productId, { averageRating });
  return averageRating;
}

export async function refreshServiceRating(serviceId) {
  const averageRating = await getAverageRating('service', serviceId);
  await Service.findByIdAndUpdate(serviceId, { averageRating });
  return averageRating;
}

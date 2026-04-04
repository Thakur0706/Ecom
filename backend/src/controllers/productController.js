import { Product } from '../models/Product.js';
import { LISTING_STATUS } from '../constants/enums.js';
import { AppError, sendResponse } from '../utils/http.js';
import { buildPagination, getPagination } from '../utils/pagination.js';

function getProductSort(sort) {
  if (sort === 'price-asc') {
    return { price: 1, createdAt: -1 };
  }

  if (sort === 'price-desc') {
    return { price: -1, createdAt: -1 };
  }

  if (sort === 'rating') {
    return { averageRating: -1, createdAt: -1 };
  }

  return { createdAt: -1 };
}

function buildPublicProductFilter(query) {
  const filter = {
    status: LISTING_STATUS.APPROVED,
    isActive: true,
  };

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { category: { $regex: query.search, $options: 'i' } },
    ];
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.condition) {
    filter.condition = query.condition;
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) {
      filter.price.$gte = Number(query.minPrice);
    }
    if (query.maxPrice) {
      filter.price.$lte = Number(query.maxPrice);
    }
  }

  return filter;
}

async function ensureOwnProduct(productId, sellerId) {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  if (product.sellerId.toString() !== sellerId.toString()) {
    throw new AppError('You can only manage your own products.', 403);
  }

  return product;
}

export async function getProducts(req, res) {
  const filter = buildPublicProductFilter(req.query);
  const { page, limit, skip } = getPagination(req.query);
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('sellerId', 'name profilePictureUrl')
      .sort(getProductSort(req.query.sort))
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Products fetched successfully.', {
    products,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getOwnProducts(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { sellerId: req.user._id };
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Your products fetched successfully.', {
    products,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getProductById(req, res) {
  const product = await Product.findOne({
    _id: req.params.id,
    status: LISTING_STATUS.APPROVED,
    isActive: true,
  }).populate('sellerId', 'name profilePictureUrl');

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  return sendResponse(res, 200, true, 'Product fetched successfully.', {
    product,
  });
}

export async function createProduct(req, res) {
  const product = await Product.create({
    ...req.body,
    sellerId: req.user._id,
    status: LISTING_STATUS.PENDING,
  });

  return sendResponse(res, 201, true, 'Product submitted for admin approval.', {
    product,
  });
}

export async function updateProduct(req, res) {
  const product = await ensureOwnProduct(req.params.id, req.user._id);
  Object.assign(product, req.body);
  await product.save();

  return sendResponse(res, 200, true, 'Product updated successfully.', {
    product,
  });
}

export async function deleteProduct(req, res) {
  const product = await ensureOwnProduct(req.params.id, req.user._id);
  await product.deleteOne();

  return sendResponse(res, 200, true, 'Product deleted successfully.', {});
}

export async function toggleProduct(req, res) {
  const product = await ensureOwnProduct(req.params.id, req.user._id);
  product.isActive = !product.isActive;
  await product.save();

  return sendResponse(res, 200, true, 'Product status toggled successfully.', {
    product,
  });
}

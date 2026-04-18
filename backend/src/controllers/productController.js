import { LISTING_SOURCE, PRODUCT_STATUS } from '../constants/enums.js';
import { Product } from '../models/Product.js';
import { AppError, sendResponse } from '../utils/http.js';
import { buildPagination, getPagination } from '../utils/pagination.js';

function getProductSort(sort) {
  if (sort === 'price-asc') {
    return { finalPrice: 1, createdAt: -1 };
  }

  if (sort === 'price-desc') {
    return { finalPrice: -1, createdAt: -1 };
  }

  if (sort === 'rating') {
    return { averageRating: -1, reviewCount: -1, createdAt: -1 };
  }

  if (sort === 'discount') {
    return { discountPercent: -1, createdAt: -1 };
  }

  return { createdAt: -1 };
}

function buildPublicProductFilter(query) {
  const filter = {
    status: PRODUCT_STATUS.APPROVED,
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

  if (query.featured === 'true') {
    filter.isFeatured = true;
  }

  if (query.discount === 'true') {
    filter.discountActive = true;
    filter.discountPercent = { $gt: 0 };
  }

  if (query.minDiscount) {
    filter.discountPercent = {
      ...(filter.discountPercent || {}),
      $gte: Number(query.minDiscount),
    };
  }

  if (query.minPrice || query.maxPrice) {
    filter.finalPrice = {};
    if (query.minPrice) {
      filter.finalPrice.$gte = Number(query.minPrice);
    }
    if (query.maxPrice) {
      filter.finalPrice.$lte = Number(query.maxPrice);
    }
  }

  return filter;
}

function serializeMargin(product) {
  return Number((Number(product.finalPrice || 0) - Number(product.quotedPrice || 0)).toFixed(2));
}

function serializeProduct(product, { includeSupplier = false, includeInternal = false } = {}) {
  if (!product) {
    return null;
  }

  const payload = {
    id: product._id,
    title: product.title,
    description: product.description,
    category: product.category,
    imageUrl: product.imageUrl,
    condition: product.condition,
    sellingPrice:
      product.sellingPrice === null || product.sellingPrice === undefined
        ? product.quotedPrice
        : product.sellingPrice,
    discountPercent: product.discountPercent,
    discountActive: product.discountActive,
    finalPrice: product.finalPrice,
    availableStock: product.availableStock,
    lowStockThreshold: product.lowStockThreshold,
    unitsSold: product.unitsSold,
    isFeatured: product.isFeatured,
    isFlashSale: product.isFlashSale,
    hasLowStockAlert: product.hasLowStockAlert,
    averageRating: product.averageRating,
    reviewCount: product.reviewCount,
    status: product.status,
    listingSource: product.listingSource,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    approvedAt: product.approvedAt,
  };

  if (includeInternal) {
    payload.quotedPrice = product.quotedPrice;
    payload.marginPerUnit = serializeMargin(product);
    payload.rejectionReason = product.rejectionReason;
  }

  if (includeSupplier) {
    payload.supplier = product.supplierId
      ? {
          id: product.supplierId._id || product.supplierId,
          name: product.supplierId.name || '',
          email: product.supplierId.email || '',
        }
      : null;
  }

  return payload;
}

async function getOwnProductOrThrow(productId, supplierId) {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  if (!product.supplierId || product.supplierId.toString() !== supplierId.toString()) {
    throw new AppError('You can only manage your own products.', 403);
  }

  return product;
}

export async function getProducts(req, res) {
  const filter = buildPublicProductFilter(req.query);
  const { page, limit, skip } = getPagination(req.query);
  const [products, total] = await Promise.all([
    Product.find(filter).sort(getProductSort(req.query.sort)).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Products fetched successfully.', {
    products: products.map((product) => serializeProduct(product)),
    pagination: buildPagination(page, limit, total),
  });
}

export async function getProductById(req, res) {
  const product = await Product.findOne({
    _id: req.params.id,
    status: PRODUCT_STATUS.APPROVED,
  });

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  return sendResponse(res, 200, true, 'Product fetched successfully.', {
    product: serializeProduct(product),
  });
}

export async function createSupplierProduct(req, res) {
  const product = await Product.create({
    ...req.body,
    supplierId: req.user._id,
    listingSource: LISTING_SOURCE.SUPPLIER,
    status: PRODUCT_STATUS.PENDING,
    availableStock: 0,
    sellingPrice: null,
    discountPercent: 0,
    discountActive: false,
    isFeatured: false,
    isFlashSale: false,
  });

  return sendResponse(res, 201, true, 'Product submitted for approval successfully.', {
    product: serializeProduct(product, { includeSupplier: true, includeInternal: true }),
  });
}

export async function getSupplierProducts(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { supplierId: req.user._id };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { category: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Supplier products fetched successfully.', {
    products: products.map((product) =>
      serializeProduct(product, { includeSupplier: true, includeInternal: true }),
    ),
    pagination: buildPagination(page, limit, total),
  });
}

export async function getSupplierProductById(req, res) {
  const product = await getOwnProductOrThrow(req.params.id, req.user._id);

  return sendResponse(res, 200, true, 'Supplier product fetched successfully.', {
    product: serializeProduct(product, { includeSupplier: true, includeInternal: true }),
  });
}

export async function updateSupplierProduct(req, res) {
  const product = await getOwnProductOrThrow(req.params.id, req.user._id);

  if (![PRODUCT_STATUS.PENDING, PRODUCT_STATUS.REJECTED].includes(product.status)) {
    throw new AppError('Only pending or rejected products can be edited.', 400);
  }

  Object.assign(product, req.body, {
    rejectionReason: '',
    status: PRODUCT_STATUS.PENDING,
    sellingPrice: null,
    discountPercent: 0,
    discountActive: false,
    availableStock: 0,
    approvedAt: null,
    approvedBy: null,
  });
  await product.save();

  return sendResponse(res, 200, true, 'Product updated successfully.', {
    product: serializeProduct(product, { includeSupplier: true, includeInternal: true }),
  });
}

export async function deleteSupplierProduct(req, res) {
  const product = await getOwnProductOrThrow(req.params.id, req.user._id);

  if (product.status !== PRODUCT_STATUS.PENDING) {
    throw new AppError('Only pending products can be withdrawn.', 400);
  }

  await product.deleteOne();

  return sendResponse(res, 200, true, 'Pending product withdrawn successfully.', {});
}

export async function getPendingProducts(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { status: PRODUCT_STATUS.PENDING };

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { category: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('supplierId', 'name email')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Pending products fetched successfully.', {
    products: products.map((product) =>
      serializeProduct(product, { includeSupplier: true, includeInternal: true }),
    ),
    pagination: buildPagination(page, limit, total),
  });
}

export async function getAdminProducts(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { category: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('supplierId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Admin products fetched successfully.', {
    products: products.map((product) =>
      serializeProduct(product, { includeSupplier: true, includeInternal: true }),
    ),
    pagination: buildPagination(page, limit, total),
  });
}

export async function getAdminProductById(req, res) {
  const product = await Product.findById(req.params.id).populate('supplierId', 'name email');

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  return sendResponse(res, 200, true, 'Admin product fetched successfully.', {
    product: serializeProduct(product, { includeSupplier: true, includeInternal: true }),
  });
}

export async function approveProduct(req, res) {
  const product = await Product.findById(req.params.id).populate('supplierId', 'name email');

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  Object.assign(product, req.body, {
    status: PRODUCT_STATUS.APPROVED,
    rejectionReason: '',
    approvedAt: new Date(),
    approvedBy: req.user._id,
  });
  product.recomputePricing();
  await product.save();

  return sendResponse(res, 200, true, 'Product approved successfully.', {
    product: serializeProduct(product, { includeSupplier: true, includeInternal: true }),
  });
}

export async function rejectProduct(req, res) {
  const product = await Product.findById(req.params.id).populate('supplierId', 'name email');

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  product.status = PRODUCT_STATUS.REJECTED;
  product.rejectionReason = req.body.rejectionReason;
  product.approvedAt = null;
  product.approvedBy = null;
  product.availableStock = 0;
  await product.save();

  return sendResponse(res, 200, true, 'Product rejected successfully.', {
    product: serializeProduct(product, { includeSupplier: true, includeInternal: true }),
  });
}

export async function updateProductPricing(req, res) {
  const product = await Product.findById(req.params.id).populate('supplierId', 'name email');

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  Object.assign(product, req.body);
  product.recomputePricing();
  await product.save();

  return sendResponse(res, 200, true, 'Product pricing updated successfully.', {
    product: serializeProduct(product, { includeSupplier: true, includeInternal: true }),
  });
}

export async function delistProduct(req, res) {
  const product = await Product.findById(req.params.id).populate('supplierId', 'name email');

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  product.status = PRODUCT_STATUS.DELISTED;
  product.delistedAt = new Date();
  product.delistedBy = req.user._id;
  await product.save();

  return sendResponse(res, 200, true, 'Product delisted successfully.', {
    product: serializeProduct(product, { includeSupplier: true, includeInternal: true }),
  });
}

export async function relistProduct(req, res) {
  const product = await Product.findById(req.params.id).populate('supplierId', 'name email');

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  product.status = PRODUCT_STATUS.APPROVED;
  product.delistedAt = null;
  product.delistedBy = null;
  await product.save();

  return sendResponse(res, 200, true, 'Product relisted successfully.', {
    product: serializeProduct(product, { includeSupplier: true, includeInternal: true }),
  });
}

export async function createAdminProduct(req, res) {
  const product = await Product.create({
    ...req.body,
    supplierId: null,
    listingSource: LISTING_SOURCE.ADMIN,
    status: PRODUCT_STATUS.APPROVED,
    approvedAt: new Date(),
    approvedBy: req.user._id,
  });

  return sendResponse(res, 201, true, 'Admin product listed successfully.', {
    product: serializeProduct(product, { includeSupplier: true, includeInternal: true }),
  });
}

export async function updateProductStock(req, res) {
  const product = await Product.findById(req.params.id).populate('supplierId', 'name email');

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  product.availableStock = req.body.availableStock;

  if (req.body.lowStockThreshold !== undefined) {
    product.lowStockThreshold = req.body.lowStockThreshold;
  }

  await product.save();

  return sendResponse(res, 200, true, 'Product stock updated successfully.', {
    product: serializeProduct(product, { includeSupplier: true, includeInternal: true }),
  });
}

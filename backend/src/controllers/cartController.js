import { PRODUCT_STATUS } from '../constants/enums.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { AppError, sendResponse } from '../utils/http.js';
import { normalizeCouponCode, validateCoupon } from '../utils/couponHelpers.js';

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId }).populate('items.productId');

  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [],
      couponCode: '',
    });
    cart = await Cart.findOne({ userId }).populate('items.productId');
  }

  return cart;
}

async function buildCartPayload(cart, userId) {
  const validItems = cart.items.filter(
    (item) => item.productId && item.productId.status === PRODUCT_STATUS.APPROVED,
  );

  const items = validItems.map((item) => {
    const product = item.productId;
    const unitPrice = Number(product.finalPrice || 0);
    const subtotal = Number((unitPrice * item.quantity).toFixed(2));

    return {
      id: item._id,
      productId: product._id,
      title: product.title,
      imageUrl: product.imageUrl,
      category: product.category,
      quantity: item.quantity,
      unitPrice,
      price: unitPrice,
      originalUnitPrice:
        product.sellingPrice === null || product.sellingPrice === undefined
          ? product.quotedPrice
          : product.sellingPrice,
      subtotal,
      availableStock: product.availableStock,
      discountPercent: product.discountActive ? product.discountPercent : 0,
      condition: product.condition,
      isFlashSale: product.isFlashSale,
    };
  });

  const subtotal = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  let discountAmount = 0;
  let appliedCoupon = null;

  if (cart.couponCode) {
    try {
      const couponResult = await validateCoupon({
        code: cart.couponCode,
        orderTotal: subtotal,
        items,
        userId,
      });

      discountAmount = couponResult.discountAmount;
      appliedCoupon = {
        code: couponResult.coupon.code,
        type: couponResult.coupon.type,
        value: couponResult.coupon.value,
        maxDiscount: couponResult.coupon.maxDiscount,
      };
    } catch {
      cart.couponCode = '';
      await cart.save();
    }
  }

  const total = Number((subtotal - discountAmount).toFixed(2));

  return {
    id: cart._id,
    userId: cart.userId,
    couponCode: cart.couponCode || '',
    appliedCoupon,
    subtotal,
    discountAmount,
    total,
    items,
    updatedAt: cart.updatedAt,
  };
}

export async function getCart(req, res) {
  const cart = await getOrCreateCart(req.user._id);
  const payload = await buildCartPayload(cart, req.user._id);

  return sendResponse(res, 200, true, 'Cart fetched successfully.', {
    cart: payload,
  });
}

export async function addToCart(req, res) {
  const product = await Product.findOne({
    _id: req.body.productId,
    status: PRODUCT_STATUS.APPROVED,
  });

  if (!product) {
    throw new AppError('Product is not available.', 404);
  }

  if (product.availableStock < req.body.quantity) {
    throw new AppError('Requested quantity exceeds available stock.', 400);
  }

  const cart = await getOrCreateCart(req.user._id);
  const existingItem = cart.items.find((item) => item.productId.toString() === product._id.toString());

  if (existingItem) {
    const nextQuantity = existingItem.quantity + req.body.quantity;

    if (nextQuantity > product.availableStock) {
      throw new AppError('Requested quantity exceeds available stock.', 400);
    }

    existingItem.quantity = nextQuantity;
    existingItem.price = product.finalPrice;
  } else {
    cart.items.push({
      productId: product._id,
      quantity: req.body.quantity,
      price: product.finalPrice,
    });
  }

  await cart.save();

  const refreshedCart = await getOrCreateCart(req.user._id);
  const payload = await buildCartPayload(refreshedCart, req.user._id);

  return sendResponse(res, 200, true, 'Item added to cart successfully.', {
    cart: payload,
  });
}

export async function updateCartItem(req, res) {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);

  if (!item) {
    throw new AppError('Cart item not found.', 404);
  }

  const product = await Product.findById(item.productId);

  if (!product || product.status !== PRODUCT_STATUS.APPROVED) {
    throw new AppError('Product is no longer available.', 404);
  }

  if (req.body.quantity > product.availableStock) {
    throw new AppError('Requested quantity exceeds available stock.', 400);
  }

  item.quantity = req.body.quantity;
  item.price = product.finalPrice;
  await cart.save();

  const payload = await buildCartPayload(await getOrCreateCart(req.user._id), req.user._id);

  return sendResponse(res, 200, true, 'Cart item updated successfully.', {
    cart: payload,
  });
}

export async function removeCartItem(req, res) {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);

  if (!item) {
    throw new AppError('Cart item not found.', 404);
  }

  item.deleteOne();
  await cart.save();

  const payload = await buildCartPayload(await getOrCreateCart(req.user._id), req.user._id);

  return sendResponse(res, 200, true, 'Cart item removed successfully.', {
    cart: payload,
  });
}

export async function clearCart(req, res) {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  cart.couponCode = '';
  await cart.save();

  return sendResponse(res, 200, true, 'Cart cleared successfully.', {
    cart: await buildCartPayload(cart, req.user._id),
  });
}

export async function applyCoupon(req, res) {
  const cart = await getOrCreateCart(req.user._id);
  const payload = await buildCartPayload(cart, req.user._id);

  if (!payload.items.length) {
    throw new AppError('Add items to your cart before applying a coupon.', 400);
  }

  await validateCoupon({
    code: req.body.code,
    orderTotal: payload.subtotal,
    items: payload.items,
    userId: req.user._id,
  });

  cart.couponCode = normalizeCouponCode(req.body.code);
  await cart.save();

  return sendResponse(res, 200, true, 'Coupon applied successfully.', {
    cart: await buildCartPayload(await getOrCreateCart(req.user._id), req.user._id),
  });
}

export async function removeCoupon(req, res) {
  const cart = await getOrCreateCart(req.user._id);
  cart.couponCode = '';
  await cart.save();

  return sendResponse(res, 200, true, 'Coupon removed successfully.', {
    cart: await buildCartPayload(cart, req.user._id),
  });
}

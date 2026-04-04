import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { LISTING_STATUS } from '../constants/enums.js';
import { AppError, sendResponse } from '../utils/http.js';

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId }).populate({
    path: 'items.productId',
    populate: {
      path: 'sellerId',
      select: 'name profilePictureUrl',
    },
  });

  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [],
    });
    cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      populate: {
        path: 'sellerId',
        select: 'name profilePictureUrl',
      },
    });
  }

  return cart;
}

function serializeCart(cart) {
  return {
    id: cart._id,
    userId: cart.userId,
    updatedAt: cart.updatedAt,
    items: cart.items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.price,
        title: item.productId.title,
        imageUrl: item.productId.imageUrl,
        category: item.productId.category,
        stock: item.productId.stock,
        seller: item.productId.sellerId
          ? {
              id: item.productId.sellerId._id,
              name: item.productId.sellerId.name,
            }
          : null,
      })),
  };
}

export async function getCart(req, res) {
  const cart = await getOrCreateCart(req.user._id);
  return sendResponse(res, 200, true, 'Cart fetched successfully.', {
    cart: serializeCart(cart),
  });
}

export async function addToCart(req, res) {
  const product = await Product.findOne({
    _id: req.body.productId,
    status: LISTING_STATUS.APPROVED,
    isActive: true,
  });

  if (!product) {
    throw new AppError('Product is not available.', 404);
  }

  if (product.stock < req.body.quantity) {
    throw new AppError('Requested quantity exceeds available stock.', 400);
  }

  let cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      userId: req.user._id,
      items: [],
    });
  }

  const existingItem = cart.items.find((item) => item.productId.toString() === product._id.toString());

  if (existingItem) {
    const nextQuantity = existingItem.quantity + req.body.quantity;

    if (nextQuantity > product.stock) {
      throw new AppError('Requested quantity exceeds available stock.', 400);
    }

    existingItem.quantity = nextQuantity;
    existingItem.price = product.price;
  } else {
    cart.items.push({
      productId: product._id,
      quantity: req.body.quantity,
      price: product.price,
    });
  }

  await cart.save();
  const populatedCart = await getOrCreateCart(req.user._id);

  return sendResponse(res, 200, true, 'Item added to cart successfully.', {
    cart: serializeCart(populatedCart),
  });
}

export async function updateCartItem(req, res) {
  const product = await Product.findById(req.body.productId);

  if (!product || product.status !== LISTING_STATUS.APPROVED || !product.isActive) {
    throw new AppError('Product is not available.', 404);
  }

  if (req.body.quantity > product.stock) {
    throw new AppError('Requested quantity exceeds available stock.', 400);
  }

  const cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    throw new AppError('Cart not found.', 404);
  }

  const item = cart.items.find((cartItem) => cartItem.productId.toString() === req.body.productId);

  if (!item) {
    throw new AppError('Cart item not found.', 404);
  }

  item.quantity = req.body.quantity;
  item.price = product.price;
  await cart.save();

  const populatedCart = await getOrCreateCart(req.user._id);

  return sendResponse(res, 200, true, 'Cart item updated successfully.', {
    cart: serializeCart(populatedCart),
  });
}

export async function removeCartItem(req, res) {
  const cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    throw new AppError('Cart not found.', 404);
  }

  cart.items = cart.items.filter((item) => item.productId.toString() !== req.params.productId);
  await cart.save();

  const populatedCart = await getOrCreateCart(req.user._id);

  return sendResponse(res, 200, true, 'Cart item removed successfully.', {
    cart: serializeCart(populatedCart),
  });
}

export async function clearCart(req, res) {
  const cart = await Cart.findOneAndUpdate(
    { userId: req.user._id },
    { items: [] },
    { new: true },
  );

  if (!cart) {
    return sendResponse(res, 200, true, 'Cart cleared successfully.', {
      cart: {
        items: [],
      },
    });
  }

  const populatedCart = await getOrCreateCart(req.user._id);

  return sendResponse(res, 200, true, 'Cart cleared successfully.', {
    cart: serializeCart(populatedCart),
  });
}

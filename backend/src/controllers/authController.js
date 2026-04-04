import { Cart } from '../models/Cart.js';
import { SellerProfile } from '../models/SellerProfile.js';
import { User } from '../models/User.js';
import { ROLES } from '../constants/enums.js';
import { AppError, sendResponse } from '../utils/http.js';
import {
  compareRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  verifyRefreshToken,
} from '../utils/tokens.js';
import { serializeSellerProfile, serializeUser } from '../utils/serializers.js';

async function issueTokens(user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshTokenHash = await hashRefreshToken(refreshToken);
  await user.save();

  return {
    accessToken,
    refreshToken,
  };
}

async function buildAuthPayload(user) {
  const sellerProfile = await SellerProfile.findOne({ userId: user._id });

  return {
    user: serializeUser(user),
    sellerProfile: serializeSellerProfile(sellerProfile),
  };
}

export async function register(req, res) {
  const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });

  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const user = await User.create({
    ...req.body,
    email: req.body.email.toLowerCase(),
    role: ROLES.BUYER,
  });

  await Cart.create({
    userId: user._id,
    items: [],
  });

  const tokens = await issueTokens(user);
  const payload = await buildAuthPayload(user);

  return sendResponse(res, 201, true, 'Registration successful.', {
    ...payload,
    tokens,
  });
}

export async function login(req, res) {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select(
    '+password +refreshTokenHash',
  );

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.role === ROLES.ADMIN) {
    throw new AppError('Admin accounts must use the admin login page.', 403);
  }

  if (!user.isActive) {
    throw new AppError('Your account is deactivated.', 403);
  }

  const isMatch = await user.comparePassword(req.body.password);

  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const tokens = await issueTokens(user);
  const payload = await buildAuthPayload(user);

  return sendResponse(res, 200, true, 'Login successful.', {
    ...payload,
    tokens,
  });
}

export async function adminLogin(req, res) {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select(
    '+password +refreshTokenHash',
  );

  if (!user || user.role !== ROLES.ADMIN) {
    throw new AppError('Admin account not found.', 401);
  }

  if (!user.isActive) {
    throw new AppError('This admin account is deactivated.', 403);
  }

  const isMatch = await user.comparePassword(req.body.password);

  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const tokens = await issueTokens(user);

  return sendResponse(res, 200, true, 'Admin login successful.', {
    user: serializeUser(user),
    sellerProfile: null,
    tokens,
  });
}

export async function logout(req, res) {
  await User.updateOne(
    { _id: req.user._id },
    {
      $set: {
        refreshTokenHash: '',
      },
    },
  );

  return sendResponse(res, 200, true, 'Logged out successfully.', {});
}

export async function refreshToken(req, res) {
  let payload;

  try {
    payload = verifyRefreshToken(req.body.refreshToken);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHash');

  if (!user) {
    throw new AppError('User not found.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account is deactivated.', 403);
  }

  const isMatch = await compareRefreshToken(req.body.refreshToken, user.refreshTokenHash);

  if (!isMatch) {
    throw new AppError('Refresh token is not recognized.', 401);
  }

  const tokens = await issueTokens(user);
  const authPayload = await buildAuthPayload(user);

  return sendResponse(res, 200, true, 'Token refreshed successfully.', {
    ...authPayload,
    tokens,
  });
}

export async function getMe(req, res) {
  const payload = await buildAuthPayload(req.user);

  return sendResponse(res, 200, true, 'Current user fetched successfully.', payload);
}

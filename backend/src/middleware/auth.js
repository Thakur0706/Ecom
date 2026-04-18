import { ROLES, SUPPLIER_STATUS } from '../constants/enums.js';
import { SupplierProfile } from '../models/SupplierProfile.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/http.js';
import { verifyAccessToken } from '../utils/tokens.js';

export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');

    if (!token) {
      throw new AppError('Authentication required.', 401);
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      throw new AppError('User not found.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account is deactivated.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error.statusCode ? error : new AppError('Invalid or expired token.', 401));
  }
}

export function authorizeRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You are not allowed to access this resource.', 403));
    }

    return next();
  };
}

async function attachApprovedSupplierProfile(req) {
  const supplierProfile = await SupplierProfile.findOne({ userId: req.user._id });

  if (!supplierProfile || supplierProfile.status !== SUPPLIER_STATUS.APPROVED) {
    throw new AppError('Your supplier account is not approved yet.', 403);
  }

  req.supplierProfile = supplierProfile;
}

export async function requireApprovedSupplier(req, _res, next) {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    if (req.user.role !== ROLES.SUPPLIER) {
      throw new AppError('Only approved suppliers can access this resource.', 403);
    }

    await attachApprovedSupplierProfile(req);
    next();
  } catch (error) {
    next(error);
  }
}

export async function isAdmin(req, res, next) {
  return authorizeRoles(ROLES.ADMIN)(req, res, next);
}

export async function isBuyer(req, res, next) {
  return authorizeRoles(ROLES.BUYER)(req, res, next);
}

export async function isSupplier(req, res, next) {
  return requireApprovedSupplier(req, res, next);
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    env.accessTokenSecret,
    { expiresIn: env.accessTokenExpiry },
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    env.refreshTokenSecret,
    { expiresIn: env.refreshTokenExpiry },
  );
}

export async function hashRefreshToken(token) {
  return bcrypt.hash(token, 10);
}

export async function compareRefreshToken(token, tokenHash) {
  if (!tokenHash) {
    return false;
  }

  return bcrypt.compare(token, tokenHash);
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.accessTokenSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshTokenSecret);
}

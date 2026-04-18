import { Router } from 'express';
import {
  getMe,
  login,
  logout,
  refreshToken,
  register,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, refreshTokenSchema, registerSchema } from '../schemas/index.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/refresh-token', validate(refreshTokenSchema), asyncHandler(refreshToken));
router.post('/logout', authenticate, asyncHandler(logout));
router.get('/me', authenticate, asyncHandler(getMe));

export default router;

import type { RequestHandler } from 'express';
import * as authService from '../services/auth.service';
import { loginSchema, registerSchema } from '../validation/auth.schemas';
import { getAuthUser } from '../middleware/authenticate';

/** POST /api/auth/register */
export const register: RequestHandler = async (req, res) => {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  res.status(201).json(result);
};

/** POST /api/auth/login */
export const login: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.json(result);
};

/** GET /api/auth/me */
export const me: RequestHandler = async (_req, res) => {
  const user = await authService.getMe(getAuthUser(res).id);
  res.json({ user });
};

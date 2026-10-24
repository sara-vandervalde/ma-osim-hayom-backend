import type { RequestHandler } from 'express';
import * as userService from '../services/user.service';
import { getAuthUser } from '../middleware/authenticate';

/** GET /api/users/children – הילדים של ההורה המחובר */
export const children: RequestHandler = async (_req, res) => {
  const list = await userService.listChildren(getAuthUser(res).id);
  res.json({ children: list });
};

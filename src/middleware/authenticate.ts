import type { RequestHandler, Response } from 'express';
import { prisma } from '../db/prisma';
import { verifyToken } from '../auth/jwt';
import { unauthorized } from '../utils/httpError';
import type { AuthUser } from '../types/auth';

/**
 * Authentication: בודק שנשלח Bearer Token תקין ומזהה את המשתמש.
 * המשתמש נקבע אך ורק לפי ה־Token, ולא לפי מזהה שנשלח מהלקוח.
 */
export const authenticate: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw unauthorized('UNAUTHORIZED', 'נדרשת התחברות (Bearer Token)');
  }

  const token = header.slice('Bearer '.length).trim();
  let userId: number;
  try {
    userId = verifyToken(token).userId;
  } catch {
    throw unauthorized('INVALID_TOKEN', 'ה־Token לא תקין או שפג תוקפו');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, displayName: true, role: true, parentId: true },
  });
  if (!user) {
    throw unauthorized('INVALID_TOKEN', 'המשתמש של ה־Token לא קיים');
  }

  res.locals.user = user satisfies AuthUser;
  next();
};

/** מחזיר את המשתמש המחובר (אחרי authenticate). */
export function getAuthUser(res: Response): AuthUser {
  const user = res.locals.user as AuthUser | undefined;
  if (!user) {
    throw unauthorized('UNAUTHORIZED', 'נדרשת התחברות');
  }
  return user;
}

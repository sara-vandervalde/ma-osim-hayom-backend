import type { RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { getAuthUser } from './authenticate';
import { forbidden } from '../utils/httpError';

/** Authorization: מאפשר להמשיך רק לסוגי המשתמשים שהוגדרו. אחרת 403. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (_req, res, next) => {
    const user = getAuthUser(res);
    if (!roles.includes(user.role)) {
      throw forbidden('הפעולה מותרת רק להורה');
    }
    next();
  };
}

import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env';

export interface TokenPayload {
  userId: number;
  role: Role;
}

/** יוצר JWT עם תוקף מוגבל (JWT_EXPIRES_IN, ברירת מחדל: יום אחד). */
export function signToken(payload: TokenPayload): string {
  return jwt.sign({ role: payload.role }, env.jwtSecret, {
    subject: String(payload.userId),
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  });
}

/** מאמת JWT. זורק שגיאה אם הוא לא תקין או שפג תוקפו. */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('Invalid token payload');
  }
  const userId = Number(decoded.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Invalid token subject');
  }
  return { userId, role: decoded.role as Role };
}

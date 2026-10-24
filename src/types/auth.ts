import type { Role } from '@prisma/client';

/** המשתמש המחובר, כפי שהשרת מזהה אותו מתוך ה־Token. */
export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  role: Role;
  parentId: number | null;
}

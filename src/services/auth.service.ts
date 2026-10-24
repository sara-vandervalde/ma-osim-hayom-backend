import { prisma } from '../db/prisma';
import { hashPassword, verifyPassword } from '../auth/password';
import { signToken } from '../auth/jwt';
import { badRequest, conflict, unauthorized } from '../utils/httpError';
import type { LoginInput, RegisterInput } from '../validation/auth.schemas';

/** השדות של משתמש שמותר להחזיר ללקוח. לעולם לא מחזירים passwordHash. */
export const publicUserSelect = {
  id: true,
  username: true,
  displayName: true,
  role: true,
  parentId: true,
  createdAt: true,
} as const;

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { username: input.username } });
  if (existing) {
    throw conflict('USERNAME_TAKEN', 'שם המשתמש כבר תפוס');
  }

  let parentId: number | null = null;
  if (input.role === 'CHILD') {
    const parent = await prisma.user.findUnique({ where: { username: input.parentUsername!.toLowerCase() } });
    if (!parent || parent.role !== 'PARENT') {
      throw badRequest('PARENT_NOT_FOUND', 'לא נמצא הורה עם שם המשתמש הזה');
    }
    parentId = parent.id;
  }

  const user = await prisma.user.create({
    data: {
      username: input.username,
      passwordHash: await hashPassword(input.password),
      displayName: input.displayName,
      role: input.role,
      parentId,
    },
    select: publicUserSelect,
  });

  return { token: signToken({ userId: user.id, role: user.role }), user };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { username: input.username } });
  // אותה הודעה לשם משתמש שגוי ולסיסמה שגויה, כדי לא לחשוף אילו משתמשים קיימים
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw unauthorized('INVALID_CREDENTIALS', 'שם משתמש או סיסמה שגויים');
  }

  return {
    token: signToken({ userId: user.id, role: user.role }),
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      parentId: user.parentId,
      createdAt: user.createdAt,
    },
  };
}

export async function getMe(userId: number) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { ...publicUserSelect, parent: { select: { id: true, username: true, displayName: true } } },
  });
}

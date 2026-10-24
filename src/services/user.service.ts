import { prisma } from '../db/prisma';

/** רשימת הילדים של הורה (לתצוגת "הילדים שלי"). */
export function listChildren(parentId: number) {
  return prisma.user.findMany({
    where: { parentId },
    select: { id: true, username: true, displayName: true, createdAt: true },
    orderBy: { displayName: 'asc' },
  });
}

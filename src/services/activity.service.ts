import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { conflict, forbidden, notFound } from '../utils/httpError';
import type { AuthUser } from '../types/auth';
import type { ActivityBody, ActivityQuery, ApproveBody } from '../validation/activity.schemas';

/** השדות שמוחזרים ללקוח עבור כל פעילות. */
const activitySelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  location: true,
  minAge: true,
  maxAge: true,
  durationMinutes: true,
  cost: true,
  isPublic: true,
  status: true,
  familyId: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, displayName: true, role: true } },
} satisfies Prisma.ActivitySelect;

type ActivityDto = Prisma.ActivityGetPayload<{ select: typeof activitySelect }>;

/** מזהה המשפחה של המשתמש: להורה – המזהה שלו, לילד – המזהה של ההורה. */
function familyIdOf(user: AuthUser): number {
  return user.role === 'PARENT' ? user.id : (user.parentId ?? -1);
}

/**
 * מה המשתמש רשאי לראות:
 * - פעילויות מאושרות וציבוריות של כולם
 * - פעילויות מאושרות של המשפחה שלו
 * - רעיונות ממתינים: הורה רואה של ילדיו, ילד רואה רק את שלו
 */
function visibilityWhere(user: AuthUser): Prisma.ActivityWhereInput {
  const familyId = familyIdOf(user);
  return {
    OR: [
      { status: 'APPROVED', isPublic: true },
      { status: 'APPROVED', familyId },
      user.role === 'PARENT' ? { status: 'PENDING', familyId: user.id } : { status: 'PENDING', createdById: user.id },
    ],
  };
}

function canView(user: AuthUser, activity: ActivityDto): boolean {
  if (activity.status === 'APPROVED') {
    return activity.isPublic || activity.familyId === familyIdOf(user);
  }
  return user.role === 'PARENT' ? activity.familyId === user.id : activity.createdBy.id === user.id;
}

/** עריכה ומחיקה: הורה – כל פעילות של המשפחה שלו; ילד – רק רעיון שלו שעדיין ממתין. */
function canModify(user: AuthUser, activity: ActivityDto): boolean {
  if (user.role === 'PARENT') {
    return activity.familyId === user.id;
  }
  return activity.createdBy.id === user.id && activity.status === 'PENDING';
}

function filtersWhere(query: ActivityQuery): Prisma.ActivityWhereInput[] {
  const filters: Prisma.ActivityWhereInput[] = [];
  if (query.search) {
    filters.push({
      OR: [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ],
    });
  }
  if (query.category) filters.push({ category: query.category });
  if (query.location) filters.push({ location: query.location });
  if (query.cost) filters.push({ cost: query.cost });
  if (query.status) filters.push({ status: query.status });
  if (query.age !== undefined) filters.push({ minAge: { lte: query.age }, maxAge: { gte: query.age } });
  return filters;
}

function buildWhere(user: AuthUser, query: ActivityQuery): Prisma.ActivityWhereInput {
  return { AND: [visibilityWhere(user), ...filtersWhere(query)] };
}

async function findOrThrow(id: number): Promise<ActivityDto> {
  const activity = await prisma.activity.findUnique({ where: { id }, select: activitySelect });
  if (!activity) {
    throw notFound('הפעילות לא נמצאה');
  }
  return activity;
}

export async function listActivities(user: AuthUser, query: ActivityQuery) {
  const primarySort: Prisma.ActivityOrderByWithRelationInput =
    query.sort === 'duration' ? { durationMinutes: query.order } : { createdAt: query.order };
  return prisma.activity.findMany({
    where: buildWhere(user, query),
    select: activitySelect,
    orderBy: [primarySort, { id: query.order }],
  });
}

export async function randomActivity(user: AuthUser, query: ActivityQuery) {
  const where = buildWhere(user, query);
  const count = await prisma.activity.count({ where });
  if (count === 0) {
    throw notFound('לא נמצאו פעילויות שמתאימות לסינון');
  }
  const skip = Math.floor(Math.random() * count);
  const activity = await prisma.activity.findFirst({ where, select: activitySelect, orderBy: { id: 'asc' }, skip });
  if (!activity) {
    throw notFound('לא נמצאו פעילויות שמתאימות לסינון');
  }
  return activity;
}

export async function getActivity(user: AuthUser, id: number) {
  const activity = await findOrThrow(id);
  if (!canView(user, activity)) {
    throw forbidden('אין לך הרשאה לצפות בפעילות זו');
  }
  return activity;
}

export async function createActivity(user: AuthUser, body: ActivityBody) {
  const isParent = user.role === 'PARENT';
  return prisma.activity.create({
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      location: body.location,
      minAge: body.minAge,
      maxAge: body.maxAge,
      durationMinutes: body.durationMinutes,
      cost: body.cost,
      // רעיון של ילד נשמר כממתין ופרטי. פעילות של הורה מאושרת אוטומטית.
      status: isParent ? 'APPROVED' : 'PENDING',
      isPublic: isParent ? (body.isPublic ?? false) : false,
      createdById: user.id,
      familyId: familyIdOf(user),
    },
    select: activitySelect,
  });
}

export async function updateActivity(user: AuthUser, id: number, body: ActivityBody) {
  const existing = await findOrThrow(id);
  if (!canModify(user, existing)) {
    throw forbidden('אין לך הרשאה לערוך פעילות זו');
  }

  // רק הורה קובע ציבורי/פרטי, ורק לפעילות מאושרת
  const isPublic =
    user.role === 'PARENT' && existing.status === 'APPROVED' ? (body.isPublic ?? existing.isPublic) : false;

  return prisma.activity.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      location: body.location,
      minAge: body.minAge,
      maxAge: body.maxAge,
      durationMinutes: body.durationMinutes,
      cost: body.cost,
      isPublic,
    },
    select: activitySelect,
  });
}

export async function deleteActivity(user: AuthUser, id: number) {
  const existing = await findOrThrow(id);
  if (!canModify(user, existing)) {
    throw forbidden('אין לך הרשאה למחוק פעילות זו');
  }
  await prisma.activity.delete({ where: { id } });
}

export async function approveActivity(user: AuthUser, id: number, body: ApproveBody) {
  const existing = await findOrThrow(id);
  if (existing.familyId !== user.id) {
    throw forbidden('אפשר לאשר רק רעיונות של הילדים שלך');
  }
  if (existing.status === 'APPROVED') {
    throw conflict('ALREADY_APPROVED', 'הפעילות כבר מאושרת');
  }
  return prisma.activity.update({
    where: { id },
    data: { status: 'APPROVED', isPublic: body.isPublic ?? false },
    select: activitySelect,
  });
}

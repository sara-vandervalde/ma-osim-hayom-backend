import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/prisma';

export const app = createApp();
export const api = () => request(app);

/** מוחק את כל הנתונים במסד של הבדיקות */
export async function resetDatabase() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Activity", "User" RESTART IDENTITY CASCADE');
}

export const PASSWORD = 'secret123';

export async function registerParent(username: string) {
  const res = await api()
    .post('/api/auth/register')
    .send({ username, password: PASSWORD, displayName: `הורה ${username}`, role: 'PARENT' });
  if (res.status !== 201) throw new Error(`register parent failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as { token: string; user: { id: number } };
}

export async function registerChild(username: string, parentUsername: string) {
  const res = await api()
    .post('/api/auth/register')
    .send({ username, password: PASSWORD, displayName: `ילד ${username}`, role: 'CHILD', parentUsername });
  if (res.status !== 201) throw new Error(`register child failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as { token: string; user: { id: number } };
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export function activityInput(overrides: Record<string, unknown> = {}) {
  return {
    title: 'מגדל מקרטונים',
    description: 'בונים מגדל מקופסאות קרטון',
    category: 'CRAFT',
    location: 'HOME',
    minAge: 4,
    maxAge: 10,
    durationMinutes: 30,
    cost: 'FREE',
    ...overrides,
  };
}

export async function createActivity(token: string, overrides: Record<string, unknown> = {}) {
  const res = await api().post('/api/activities').set(auth(token)).send(activityInput(overrides));
  if (res.status !== 201) throw new Error(`create activity failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.activity as { id: number; status: string; isPublic: boolean };
}

export { prisma };

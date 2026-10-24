import type { RequestHandler } from 'express';
import { prisma } from '../db/prisma';

/** GET /api/health – בודק שהשרת ומסד הנתונים פעילים */
export const health: RequestHandler = async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'ok', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', database: 'error', time: new Date().toISOString() });
  }
};

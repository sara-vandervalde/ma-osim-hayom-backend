import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/httpError';
import { env } from '../config/env';

/** כתובת שלא קיימת → 404 */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `הכתובת ${req.method} ${req.path} לא קיימת` },
  });
};

/** טיפול מרוכז בכל השגיאות. כל שגיאה חוזרת במבנה { error: { code, message, details? } } */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'הנתונים שנשלחו לא תקינים',
        details: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      },
    });
    return;
  }

  // JSON לא תקין בגוף הבקשה
  if (typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'גוף הבקשה אינו JSON תקין' } });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'הערך כבר קיים במערכת' } });
    return;
  }

  if (!env.isTest) {
    console.error(err);
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'שגיאה פנימית בשרת' } });
};

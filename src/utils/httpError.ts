/**
 * שגיאה עם קוד HTTP. כל שגיאה כזו מגיעה ל־errorHandler ומוחזרת ללקוח במבנה:
 * { "error": { "code": "...", "message": "..." } }
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (code: string, message: string) => new HttpError(400, code, message);
export const unauthorized = (code: string, message: string) => new HttpError(401, code, message);
export const forbidden = (message = 'אין לך הרשאה לבצע פעולה זו') => new HttpError(403, 'FORBIDDEN', message);
export const notFound = (message = 'המשאב לא נמצא') => new HttpError(404, 'NOT_FOUND', message);
export const conflict = (code: string, message: string) => new HttpError(409, code, message);

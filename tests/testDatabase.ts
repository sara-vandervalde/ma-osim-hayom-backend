import 'dotenv/config';

/**
 * הבדיקות רצות על מסד נתונים נפרד (TEST_DATABASE_URL), כי הן מוחקות את כל הנתונים.
 * לעולם לא משתמשים כאן ב־DATABASE_URL הרגיל, כדי לא למחוק נתונים אמיתיים.
 */
export function getTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is not set. Add a separate, empty PostgreSQL database for tests to .env (see README).',
    );
  }
  if (url === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL must be different from DATABASE_URL – tests delete all data.');
  }
  return url;
}

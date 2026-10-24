import { getTestDatabaseUrl } from './testDatabase';

// רץ לפני כל קובץ בדיקות, לפני שהקוד של השרת נטען
if (process.env.TEST_DB_CONFIGURED !== '1') {
  process.env.DATABASE_URL = getTestDatabaseUrl();
  process.env.TEST_DB_CONFIGURED = '1';
}
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-123';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:5173';

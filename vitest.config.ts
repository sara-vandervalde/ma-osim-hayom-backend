import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/globalSetup.ts'],
    setupFiles: ['tests/setupEnv.ts'],
    // הבדיקות עובדות על אותו מסד נתונים, ולכן רצות אחת אחרי השנייה
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});

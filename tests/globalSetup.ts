import { execSync } from 'node:child_process';
import { getTestDatabaseUrl } from './testDatabase';

/** רץ פעם אחת לפני כל הבדיקות: יוצר את הטבלאות במסד הנתונים של הבדיקות. */
export default function setup() {
  const url = getTestDatabaseUrl();
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}

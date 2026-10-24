import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/** הופך סיסמה ל־Hash. הסיסמה עצמה לעולם לא נשמרת. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** בודק אם הסיסמה שהוקלדה מתאימה ל־Hash השמור. */
export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

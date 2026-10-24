import { z } from 'zod';

const usernameSchema = z
  .string({ required_error: 'שם משתמש הוא שדה חובה' })
  .trim()
  .regex(/^[a-zA-Z0-9_]{3,30}$/, 'שם משתמש: 3–30 תווים, אותיות באנגלית, ספרות וקו תחתון בלבד')
  .transform((value) => value.toLowerCase());

export const registerSchema = z
  .object({
    username: usernameSchema,
    password: z
      .string({ required_error: 'סיסמה היא שדה חובה' })
      .min(6, 'סיסמה: לפחות 6 תווים')
      .max(100, 'סיסמה: עד 100 תווים'),
    displayName: z
      .string({ required_error: 'שם תצוגה הוא שדה חובה' })
      .trim()
      .min(2, 'שם תצוגה: לפחות 2 תווים')
      .max(50, 'שם תצוגה: עד 50 תווים'),
    role: z.enum(['PARENT', 'CHILD'], { errorMap: () => ({ message: 'סוג משתמש חייב להיות PARENT או CHILD' }) }),
    parentUsername: z.string().trim().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'CHILD' && !data.parentUsername) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['parentUsername'],
        message: 'לילד חובה להזין את שם המשתמש של ההורה',
      });
    }
  });

export const loginSchema = z.object({
  username: z
    .string({ required_error: 'שם משתמש הוא שדה חובה' })
    .trim()
    .min(1, 'שם משתמש הוא שדה חובה')
    .transform((value) => value.toLowerCase()),
  password: z.string({ required_error: 'סיסמה היא שדה חובה' }).min(1, 'סיסמה היא שדה חובה'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

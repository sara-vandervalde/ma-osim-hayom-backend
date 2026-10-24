import { z } from 'zod';

export const CATEGORIES = ['CRAFT', 'GAME', 'MOVEMENT', 'THINKING', 'KITCHEN'] as const;
export const LOCATIONS = ['HOME', 'OUTDOOR'] as const;
export const COSTS = ['FREE', 'PAID'] as const;
export const STATUSES = ['PENDING', 'APPROVED'] as const;

const age = (field: string) =>
  z
    .number({ required_error: `${field} הוא שדה חובה`, invalid_type_error: `${field} חייב להיות מספר` })
    .int(`${field} חייב להיות מספר שלם`)
    .min(0, `${field}: מינימום 0`)
    .max(18, `${field}: מקסימום 18`);

/** גוף הבקשה להוספה ולעריכה של פעילות (אותו טופס בשני המקרים). */
export const activityBodySchema = z
  .object({
    title: z
      .string({ required_error: 'שם הפעילות הוא שדה חובה' })
      .trim()
      .min(2, 'שם הפעילות: לפחות 2 תווים')
      .max(100, 'שם הפעילות: עד 100 תווים'),
    description: z
      .string({ required_error: 'תיאור הוא שדה חובה' })
      .trim()
      .min(5, 'תיאור: לפחות 5 תווים')
      .max(2000, 'תיאור: עד 2000 תווים'),
    category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'קטגוריה לא תקינה' }) }),
    location: z.enum(LOCATIONS, { errorMap: () => ({ message: 'מקום חייב להיות HOME או OUTDOOR' }) }),
    minAge: age('גיל מינימלי'),
    maxAge: age('גיל מקסימלי'),
    durationMinutes: z
      .number({ required_error: 'משך הוא שדה חובה', invalid_type_error: 'משך חייב להיות מספר' })
      .int('משך חייב להיות מספר שלם')
      .min(1, 'משך: לפחות דקה אחת')
      .max(600, 'משך: עד 600 דקות'),
    cost: z.enum(COSTS, { errorMap: () => ({ message: 'עלות חייבת להיות FREE או PAID' }) }),
    isPublic: z.boolean({ invalid_type_error: 'isPublic חייב להיות true או false' }).optional(),
  })
  .refine((data) => data.minAge <= data.maxAge, {
    path: ['maxAge'],
    message: 'גיל מקסימלי חייב להיות גדול או שווה לגיל המינימלי',
  });

/** פרמטרים לחיפוש, סינון ומיון ברשימה ובהגרלה. */
export const activityQuerySchema = z.object({
  search: z.string().trim().max(100, 'חיפוש: עד 100 תווים').optional(),
  category: z.enum(CATEGORIES).optional(),
  location: z.enum(LOCATIONS).optional(),
  cost: z.enum(COSTS).optional(),
  age: z.coerce.number().int().min(0).max(18).optional(),
  status: z.enum(STATUSES).optional(),
  sort: z.enum(['duration', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const approveBodySchema = z
  .object({
    isPublic: z.boolean({ invalid_type_error: 'isPublic חייב להיות true או false' }).optional(),
  })
  .default({});

export const idParamSchema = z.object({
  id: z.coerce.number({ invalid_type_error: 'מזהה לא תקין' }).int('מזהה לא תקין').positive('מזהה לא תקין'),
});

export type ActivityBody = z.infer<typeof activityBodySchema>;
export type ActivityQuery = z.infer<typeof activityQuerySchema>;
export type ApproveBody = z.infer<typeof approveBodySchema>;

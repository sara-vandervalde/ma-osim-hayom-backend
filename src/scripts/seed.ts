/**
 * נתוני הדגמה (Seed).
 *
 * הרצה ידנית במחשב:   npm run db:seed
 * הרצה אוטומטית ב־Render: בכל הפעלה של השרת, רק אם SEED_ON_START=true.
 *
 * סיסמה: SEED_DEMO_PASSWORD. במחשב, אם לא הוגדרה, משתמשים ב־Demo1234.
 * ב־Production חובה להגדיר SEED_DEMO_PASSWORD, כדי שלא תהיה סיסמה ידועה לכולם.
 *
 * הסקריפט בטוח להרצה חוזרת: הוא מעדכן את משתמשי ההדגמה ויוצר מחדש רק את הפעילויות שלהם.
 */
import 'dotenv/config';
import { PrismaClient, type Prisma } from '@prisma/client';
import { hashPassword } from '../auth/password';

const isOnStart = process.argv.includes('--on-start');
const isProduction = process.env.NODE_ENV === 'production';

type DemoActivity = Omit<Prisma.ActivityCreateManyInput, 'createdById' | 'familyId'>;

const family1Activities: DemoActivity[] = [
  {
    title: 'מגדל מקרטונים',
    description: 'אוספים קופסאות קרטון ריקות ובונים מגדל גבוה ככל האפשר. אפשר לצבוע ולקשט.',
    category: 'CRAFT', location: 'HOME', minAge: 4, maxAge: 10, durationMinutes: 30, cost: 'FREE',
    status: 'APPROVED', isPublic: true,
  },
  {
    title: 'מחבואים בפארק',
    description: 'משחק מחבואים קלאסי בפארק הקרוב. מגדירים גבולות ברורים לפני שמתחילים.',
    category: 'GAME', location: 'OUTDOOR', minAge: 3, maxAge: 12, durationMinutes: 45, cost: 'FREE',
    status: 'APPROVED', isPublic: true,
  },
  {
    title: 'מרוץ שליחים בחצר',
    description: 'מתחלקים לשתי קבוצות ומעבירים מקל מאחד לשני. אפשר להוסיף מכשולים.',
    category: 'MOVEMENT', location: 'OUTDOOR', minAge: 5, maxAge: 12, durationMinutes: 30, cost: 'FREE',
    status: 'APPROVED', isPublic: true,
  },
  {
    title: 'אפיית עוגיות',
    description: 'מכינים יחד בצק עוגיות פשוט, מעצבים בעזרת חותכנים ואופים בתנור.',
    category: 'KITCHEN', location: 'HOME', minAge: 6, maxAge: 14, durationMinutes: 60, cost: 'PAID',
    status: 'APPROVED', isPublic: false,
  },
  {
    title: 'חידון חשבון בעל פה',
    description: 'שואלים תרגילים בעל פה לפי הגיל. מי שעונה נכון מקבל נקודה.',
    category: 'THINKING', location: 'HOME', minAge: 7, maxAge: 12, durationMinutes: 20, cost: 'FREE',
    status: 'APPROVED', isPublic: false,
  },
];

const childPendingIdea: DemoActivity = {
  title: 'תיאטרון בובות מגרביים',
  description: 'מכינים בובות מגרביים ישנות ומציגים הצגה קצרה לכל המשפחה.',
  category: 'CRAFT', location: 'HOME', minAge: 4, maxAge: 9, durationMinutes: 40, cost: 'FREE',
  status: 'PENDING', isPublic: false,
};

const family2Activities: DemoActivity[] = [
  {
    title: 'ציור בגירים על המדרכה',
    description: 'קונים גירים צבעוניים ומציירים על המדרכה ליד הבית. אפשר לצייר משחק קלאס.',
    category: 'CRAFT', location: 'OUTDOOR', minAge: 3, maxAge: 10, durationMinutes: 30, cost: 'PAID',
    status: 'APPROVED', isPublic: true,
  },
  {
    title: 'מבוך מכריות',
    description: 'בונים מבוך בסלון מכריות ושמיכות וזוחלים דרכו.',
    category: 'GAME', location: 'HOME', minAge: 3, maxAge: 8, durationMinutes: 25, cost: 'FREE',
    status: 'APPROVED', isPublic: false,
  },
];

async function main() {
  if (isOnStart && process.env.SEED_ON_START !== 'true') {
    return; // אין צורך ב־Seed בהפעלה הזו
  }

  const password = process.env.SEED_DEMO_PASSWORD ?? (isProduction ? undefined : 'Demo1234');
  if (!password || password.length < 6) {
    console.error('Seed skipped: set SEED_DEMO_PASSWORD (at least 6 characters) to create demo users in production.');
    return;
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await hashPassword(password);

    const parent1 = await prisma.user.upsert({
      where: { username: 'parent_demo' },
      update: { passwordHash, displayName: 'הורה לדוגמה', role: 'PARENT', parentId: null },
      create: { username: 'parent_demo', passwordHash, displayName: 'הורה לדוגמה', role: 'PARENT' },
    });
    const child1 = await prisma.user.upsert({
      where: { username: 'child_demo' },
      update: { passwordHash, displayName: 'יוסי', role: 'CHILD', parentId: parent1.id },
      create: { username: 'child_demo', passwordHash, displayName: 'יוסי', role: 'CHILD', parentId: parent1.id },
    });
    const parent2 = await prisma.user.upsert({
      where: { username: 'parent2_demo' },
      update: { passwordHash, displayName: 'הורה ממשפחה אחרת', role: 'PARENT', parentId: null },
      create: { username: 'parent2_demo', passwordHash, displayName: 'הורה ממשפחה אחרת', role: 'PARENT' },
    });

    await prisma.activity.deleteMany({ where: { familyId: { in: [parent1.id, parent2.id] } } });
    await prisma.activity.createMany({
      data: [
        ...family1Activities.map((a) => ({ ...a, createdById: parent1.id, familyId: parent1.id })),
        { ...childPendingIdea, createdById: child1.id, familyId: parent1.id },
        ...family2Activities.map((a) => ({ ...a, createdById: parent2.id, familyId: parent2.id })),
      ],
    });

    console.log('Seed completed: users parent_demo, child_demo, parent2_demo with demo activities.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  // בהפעלה אוטומטית לא עוצרים את השרת בגלל כשל ב־Seed
  process.exit(isOnStart ? 0 : 1);
});

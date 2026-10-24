# מה עושים היום? – Backend

שרת למאגר רעיונות לפעילויות פנאי לילדים. הורים מוסיפים רעיונות, וילדים מחפשים, מסננים ומגרילים פעילות. ילד יכול להציע רעיון, והוא ממתין לאישור ההורה שלו.

**להעלאה לאינטרנט:** קראי את [START-HERE.md](START-HERE.md).
**לכתיבת צד ה־React:** קראי את [docs/FRONTEND-API-GUIDE.md](docs/FRONTEND-API-GUIDE.md).

## טכנולוגיות

Node.js 20 ומעלה · Express 5 · TypeScript (strict) · PostgreSQL · Prisma 6 · Zod · JWT · bcrypt · Swagger (OpenAPI 3) · Vitest

## מבנה הפרויקט

```
backend-project/
├── prisma/
│   ├── schema.prisma          # הגדרת הטבלאות
│   └── migrations/            # יצירת הטבלאות במסד הנתונים
├── src/
│   ├── server.ts              # הפעלת השרת
│   ├── app.ts                 # הגדרת Express, CORS, Swagger
│   ├── config/env.ts          # משתני סביבה
│   ├── db/prisma.ts           # חיבור למסד הנתונים
│   ├── auth/                  # Hash לסיסמאות, יצירה ובדיקה של JWT
│   ├── middleware/            # authenticate (התחברות), authorize (הרשאות), errorHandler
│   ├── validation/            # סכמות Zod לבדיקת הנתונים שנשלחים
│   ├── routes/                # הנתיבים (URL) של ה־API
│   ├── controllers/           # מקבלים בקשה ומחזירים תשובה
│   ├── services/              # הלוגיקה: מי רואה מה, מי רשאי לערוך, שאילתות
│   ├── docs/openapi.json      # תיעוד Swagger (OpenAPI 3)
│   ├── scripts/seed.ts        # נתוני הדגמה
│   └── types/                 # טיפוסים משותפים
├── tests/                     # בדיקות אוטומטיות (Vitest + Supertest)
├── docs/FRONTEND-API-GUIDE.md # מדריך לצד ה־React
├── render.yaml                # הגדרות פריסה ל־Render
├── START-HERE.md              # הוראות העלאה לאינטרנט
└── .env.example               # דוגמה למשתני הסביבה
```

**הזרימה של בקשה:** route ← middleware (התחברות והרשאה) ← controller (ולידציה עם Zod) ← service (לוגיקה ומסד נתונים) ← תשובה. כל שגיאה מגיעה ל־errorHandler ומוחזרת במבנה אחיד.

## הרצה במחשב

1. התקיני Node.js בגרסה 20 ומעלה (מומלץ 22 LTS).
2. העתיקי את `.env.example` לקובץ חדש בשם `.env` ומלאי את `DATABASE_URL` ואת `JWT_SECRET`.
3. הריצי:

```bash
npm install
npx prisma migrate deploy   # יוצר את הטבלאות
npm run db:seed             # נתוני הדגמה (סיסמה: Demo1234)
npm run dev                 # מפעיל את השרת
```

4. פתחי בדפדפן את http://localhost:3000/api-docs

## משתמשי הדגמה

| שם משתמש | סוג | הערות |
|---|---|---|
| `parent_demo` | הורה | 5 פעילויות: 3 ציבוריות ו־2 פרטיות |
| `child_demo` | ילד של `parent_demo` | רעיון אחד שממתין לאישור |
| `parent2_demo` | הורה ממשפחה אחרת | פעילות ציבורית אחת ופעילות פרטית אחת |

במחשב הסיסמה היא `Demo1234`. ב־Render הסיסמה היא הערך של `SEED_DEMO_PASSWORD`. אין שם סיסמה קבועה.

## בדיקות

הבדיקות רצות על מסד נתונים **נפרד וריק** שמוגדר ב־`TEST_DATABASE_URL`, כי הן מוחקות בו את כל הנתונים. הן לא ירוצו אם הוא זהה ל־`DATABASE_URL`.

```bash
npm run check   # prisma validate + typecheck + build + כל הבדיקות
```

או כל שלב בנפרד: `npm run prisma:validate`, `npm run typecheck`, `npm run build`, `npm test`.

הבדיקות מכסות: התחברות תקינה ושגויה, Token חסר, לא תקין ושפג תוקפו, הרשאות הורה וילד, CRUD, ולידציה, חיפוש, סינון, מיון והגרלה, מניעת גישה לרשומות פרטיות, Prisma ו־Swagger.

## פקודות

| פקודה | מה היא עושה |
|---|---|
| `npm run dev` | מפעיל את השרת במצב פיתוח, עם רענון אוטומטי |
| `npm run build` | מקמפל ל־`dist/` |
| `npm start` | Migrations, ואז Seed (רק אם `SEED_ON_START=true`), ואז השרת. משמש ב־Render |
| `npm run db:migrate` | יוצר או מעדכן את הטבלאות |
| `npm run db:seed` | יוצר נתוני הדגמה |
| `npm test` | מריץ את הבדיקות |
| `npm run check` | בדיקה מלאה לפני הגשה |

## משתני סביבה

| משתנה | חובה | תיאור |
|---|---|---|
| `DATABASE_URL` | כן | כתובת מסד הנתונים |
| `JWT_SECRET` | כן | סוד לחתימת Token, לפחות 16 תווים |
| `JWT_EXPIRES_IN` | לא | תוקף ה־Token, ברירת מחדל `1d` |
| `CORS_ORIGIN` | לא | כתובות האתר שמותר להן לפנות לשרת, מופרדות בפסיקים. ברירת מחדל `*` |
| `PORT` | לא | ב־Render נקבע אוטומטית |
| `SEED_ON_START` | לא | `true` כדי ליצור נתוני הדגמה בהפעלה |
| `SEED_DEMO_PASSWORD` | ב־Production | הסיסמה למשתמשי ההדגמה |
| `TEST_DATABASE_URL` | לבדיקות | מסד נתונים נפרד לבדיקות |

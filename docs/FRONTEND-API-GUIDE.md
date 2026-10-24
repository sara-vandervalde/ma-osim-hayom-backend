# מדריך API לצד ה־React
פעל לפי הוראות של דוטנט - עפ חלוקה לשכבות

המסמך מסביר איך אתר ה־React מתקשר עם השרת. **אין בו קוד React**. את הקוד כותבים בעצמך, והמסמך מפרט מה לשלוח ומה מתקבל.

---

## 1. כתובת השרת (Base URL)

| סביבה | Base URL |
|---|---|
| במחשב | `http://localhost:3000` |
| ב־Render | `https://<שם-השירות>.onrender.com` |

כל הנתיבים מתחילים ב־`/api`. מומלץ לשמור את הכתובת במשתנה סביבה של React, למשל `VITE_API_URL`, ולא לכתוב אותה בתוך הקוד.

כל הבקשות והתשובות הן JSON. בבקשות עם גוף שולחים את הכותרת `Content-Type: application/json`.

---

## 2. התחברות (Authentication)

1. המשתמש נרשם (`POST /api/auth/register`) או מתחבר (`POST /api/auth/login`).
2. השרת מחזיר `token` (JWT) ואובייקט `user`.
3. שומרים את ה־`token` ואת ה־`user`. זה מקום טבעי ל־Context של המשתמש המחובר. אפשר לשמור גם ב־localStorage, כדי שההתחברות תישאר אחרי רענון.
4. **בכל בקשה מוגנת** שולחים כותרת:

```
Authorization: Bearer <token>
```

5. תוקף ה־Token: יום אחד (ברירת מחדל). כשהוא פג, השרת מחזיר **401**, ואז מוחקים את ה־Token ומעבירים למסך ההתחברות.
6. בטעינת האתר אפשר לקרוא ל־`GET /api/auth/me` כדי לבדוק שה־Token השמור עדיין תקף.

**סוג המשתמש** נמצא ב־`user.role`: `"PARENT"` או `"CHILD"`. לפיו מחליטים אילו כפתורים להציג. ההרשאות עצמן נבדקות בשרת, כך שגם אם כפתור יוצג בטעות, השרת יחזיר 403.

---

## 3. מבני הנתונים

### User – משתמש

| שדה | טיפוס | הערות |
|---|---|---|
| `id` | number | |
| `username` | string | תמיד באותיות קטנות |
| `displayName` | string | השם שמוצג באתר |
| `role` | `"PARENT"` \| `"CHILD"` | |
| `parentId` | number \| null | לילד: מזהה ההורה. להורה: `null` |
| `createdAt` | string (תאריך ISO) | |

### Activity – פעילות

| שדה | טיפוס | הערות |
|---|---|---|
| `id` | number | |
| `title` | string | שם הפעילות |
| `description` | string | תיאור |
| `category` | `"CRAFT"` \| `"GAME"` \| `"MOVEMENT"` \| `"THINKING"` \| `"KITCHEN"` | |
| `location` | `"HOME"` \| `"OUTDOOR"` | |
| `minAge`, `maxAge` | number | 0–18 |
| `durationMinutes` | number | משך בדקות |
| `cost` | `"FREE"` \| `"PAID"` | |
| `isPublic` | boolean | ציבורי או פרטי למשפחה |
| `status` | `"PENDING"` \| `"APPROVED"` | ממתין או מאושר |
| `familyId` | number | מזהה ההורה של המשפחה |
| `createdAt`, `updatedAt` | string (תאריך ISO) | |
| `createdBy` | `{ id, displayName, role }` | מי הוסיף את הפעילות. שימושי להצגת "נוסף על ידי: יוסי" |

### תרגום הערכים לעברית (לתצוגה)

| ערך | עברית |
|---|---|
| `CRAFT` | יצירה |
| `GAME` | משחק |
| `MOVEMENT` | תנועה |
| `THINKING` | חשיבה |
| `KITCHEN` | מטבח |
| `HOME` | בבית |
| `OUTDOOR` | בחוץ |
| `FREE` | חינם |
| `PAID` | בתשלום |
| `PENDING` | ממתין לאישור |
| `APPROVED` | מאושר |
| `PARENT` | הורה |
| `CHILD` | ילד |

---

## 4. Endpoints לפי מסך

### מסך התחברות (`/login`)

**`POST /api/auth/login`** (ללא Token)

שולחים:
```json
{ "username": "parent_demo", "password": "Demo1234" }
```
מקבלים (**200**):
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "username": "parent_demo", "displayName": "הורה לדוגמה", "role": "PARENT", "parentId": null, "createdAt": "2026-10-22T10:00:00.000Z" }
}
```
שגיאות: **400** (שדה ריק), **401** `INVALID_CREDENTIALS` (שם משתמש או סיסמה שגויים).

**שדות חובה בטופס:** `username`, `password`.

### מסך הרשמה (`/register`)

**`POST /api/auth/register`** (ללא Token)

הורה:
```json
{ "username": "dana_parent", "password": "secret123", "displayName": "דנה", "role": "PARENT" }
```
ילד (השדה `parentUsername` מוצג בטופס רק כשבוחרים "ילד"):
```json
{ "username": "noam_kid", "password": "secret123", "displayName": "נעם", "role": "CHILD", "parentUsername": "dana_parent" }
```
מקבלים (**201**): בדיוק כמו ב־login, `{ token, user }`. המשתמש מחובר מיד.

שגיאות: **400** `VALIDATION_ERROR`, **400** `PARENT_NOT_FOUND` (אין הורה בשם הזה), **409** `USERNAME_TAKEN`.

**חוקי הטופס** (כדאי לבדוק כבר בטופס, והשרת בודק שוב):

| שדה | חוק |
|---|---|
| `username` | חובה. 3–30 תווים: אותיות באנגלית, ספרות ו־`_` |
| `password` | חובה. 6–100 תווים |
| `displayName` | חובה. 2–50 תווים |
| `role` | חובה. `PARENT` או `CHILD` |
| `parentUsername` | חובה רק כש־`role` = `CHILD` |

### מסך רשימת פעילויות (`/activities`)

**`GET /api/activities`** (Token)

פרמטרים אופציונליים בכתובת:

| פרמטר | ערכים | דוגמה |
|---|---|---|
| `search` | טקסט לחיפוש בשם או בתיאור | `?search=עוגיות` |
| `category` | `CRAFT` / `GAME` / `MOVEMENT` / `THINKING` / `KITCHEN` | `?category=GAME` |
| `location` | `HOME` / `OUTDOOR` | `?location=HOME` |
| `cost` | `FREE` / `PAID` | `?cost=FREE` |
| `age` | מספר 0–18 | `?age=7` |
| `status` | `PENDING` / `APPROVED` (להצגה להורה) | `?status=PENDING` |
| `sort` | `duration` / `createdAt` (ברירת מחדל `createdAt`) | `?sort=duration` |
| `order` | `asc` / `desc` (ברירת מחדל `desc`) | `?order=asc` |

אפשר לשלב: `/api/activities?category=GAME&age=7&sort=duration&order=asc`
שולחים רק פרמטרים שיש להם ערך. פרמטר ריק כמו `?category=` מחזיר 400.

מקבלים (**200**):
```json
{ "activities": [ { "id": 7, "title": "מגדל מקרטונים", "...": "..." } ], "count": 1 }
```

**מה כל משתמש מקבל:** השרת כבר מסנן. הורה מקבל את הפעילויות המאושרות של המשפחה, את הציבוריות, ואת הרעיונות הממתינים של ילדיו. ילד מקבל את הפעילויות המאושרות של המשפחה, את הציבוריות, ואת הרעיונות הממתינים שלו בלבד.

**כפתור "תגריל לי": `GET /api/activities/random`** (Token)
מקבל את אותם פרמטרים של הרשימה, ומחזיר פעילות אחת (**200**): `{ "activity": { ... } }`.
אם אין פעילות שמתאימה לסינון: **404**.

**כפתור "אשר" (להורה): `PATCH /api/activities/:id/approve`** (Token)
שולחים (לא חובה): `{ "isPublic": true }`. בלי גוף בקשה, הפעילות מאושרת כפרטית.
מקבלים (**200**): `{ "activity": { ..., "status": "APPROVED" } }`.
שגיאות: **403** (ילד, או רעיון של ילד ממשפחה אחרת), **409** `ALREADY_APPROVED`.

**כפתור "מחק": `DELETE /api/activities/:id`** (Token)
מקבלים **204** בלי גוף בקשה. שגיאות: **403**, **404**.

**מתי להציג כל כפתור:**

| כפתור | להציג כאשר |
|---|---|
| ערוך / מחק | הורה: `activity.familyId === user.id`. ילד: `activity.createdBy.id === user.id` וגם `activity.status === "PENDING"` |
| אשר | הורה, וגם `activity.status === "PENDING"` |
| סינון לפי סטטוס | הורה |
| תיבת "ציבורי" בטופס | הורה |

אחרי הוספה, עריכה, מחיקה או אישור, צריך לרענן את הרשימה. למשל, לסמן את השאילתה של הרשימה כלא עדכנית ב־React Query.

### מסך טופס פעילות (`/activities/new`, `/activities/:id/edit`)

**טעינה לעריכה: `GET /api/activities/:id`** (Token) מחזיר (**200**) `{ "activity": { ... } }`. שגיאות: **403**, **404**.

**הוספה: `POST /api/activities`** (Token) מחזיר **201**.
**עריכה: `PUT /api/activities/:id`** (Token) מחזיר **200**. שולחים את **כל** השדות, כמו בטופס.

גוף הבקשה (זהה בשניהם):
```json
{
  "title": "מגדל מקרטונים",
  "description": "אוספים קופסאות קרטון ובונים מגדל",
  "category": "CRAFT",
  "location": "HOME",
  "minAge": 4,
  "maxAge": 10,
  "durationMinutes": 30,
  "cost": "FREE",
  "isPublic": true
}
```
מקבלים: `{ "activity": { ... } }`

**חשוב:** `minAge`, `maxAge` ו־`durationMinutes` נשלחים כ**מספרים** (`4`) ולא כטקסט (`"4"`). ב־React Hook Form יש לזה אפשרות `valueAsNumber`.

**חוקי הטופס:**

| שדה | חובה | חוק |
|---|---|---|
| `title` | כן | 2–100 תווים |
| `description` | כן | 5–2000 תווים |
| `category` | כן | אחד מ־5 הערכים |
| `location` | כן | `HOME` / `OUTDOOR` |
| `minAge` | כן | מספר שלם 0–18 |
| `maxAge` | כן | מספר שלם 0–18, גדול או שווה ל־`minAge` |
| `durationMinutes` | כן | מספר שלם 1–600 |
| `cost` | כן | `FREE` / `PAID` |
| `isPublic` | לא | true/false, משמעותי להורה בלבד |

**מה קורה בשרת:** הורה מוסיף, והפעילות מאושרת מיד. ילד מוסיף, והרעיון נשמר כ־`PENDING` ופרטי, ו־`isPublic` לא נלקח בחשבון.

### פרטי המשתמש המחובר

**`GET /api/auth/me`** (Token) מחזיר (**200**):
```json
{ "user": { "id": 2, "username": "child_demo", "displayName": "יוסי", "role": "CHILD", "parentId": 1, "createdAt": "...", "parent": { "id": 1, "username": "parent_demo", "displayName": "הורה לדוגמה" } } }
```

### לעתיד: "הילדים שלי"

**`GET /api/users/children`** (Token, להורה בלבד) מחזיר (**200**):
```json
{ "children": [ { "id": 2, "username": "child_demo", "displayName": "יוסי", "createdAt": "..." } ] }
```
לילד מוחזר **403**.

---

## 5. שגיאות

כל שגיאה חוזרת באותו מבנה:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "הנתונים שנשלחו לא תקינים", "details": [ { "field": "title", "message": "שם הפעילות: לפחות 2 תווים" } ] } }
```
- `message` כתוב בעברית, ואפשר להציג אותו למשתמש.
- `details` מופיע רק בשגיאות ולידציה. `field` הוא שם השדה, כך שאפשר להציג את ההודעה ליד השדה המתאים בטופס.

| קוד HTTP | `code` | משמעות | מה לעשות ב־React |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | שדה חסר או לא תקין | להציג את ההודעות ליד השדות |
| 400 | `INVALID_JSON` | גוף הבקשה לא JSON | לבדוק את `Content-Type` ואת הגוף |
| 400 | `PARENT_NOT_FOUND` | בהרשמת ילד: ההורה לא קיים | הודעה בטופס |
| 401 | `UNAUTHORIZED` / `INVALID_TOKEN` | לא מחובר, או Token לא תקין או שפג תוקפו | למחוק את ה־Token ולהעביר להתחברות |
| 401 | `INVALID_CREDENTIALS` | סיסמה או שם משתמש שגויים | הודעה בטופס ההתחברות |
| 403 | `FORBIDDEN` | אין הרשאה | הודעה "אין הרשאה" |
| 404 | `NOT_FOUND` | לא נמצא | הודעה, או חזרה לרשימה |
| 409 | `USERNAME_TAKEN` / `ALREADY_APPROVED` | התנגשות | הודעה |
| 500 | `INTERNAL_ERROR` | תקלה בשרת | הודעה כללית |

**מצב טעינה:** בזמן שבקשה בדרך, מציגים Loading. בשירות החינמי של Render, הבקשה הראשונה אחרי זמן ללא שימוש יכולה לקחת בערך דקה.

---

## 6. סיכום ההרשאות

| פעולה | הורה | ילד |
|---|---|---|
| צפייה בפעילויות מאושרות של המשפחה ובציבוריות | ✅ | ✅ |
| צפייה ברעיונות ממתינים | של ילדיו | רק שלו |
| הוספה | ✅ מאושרת מיד | ✅ ממתינה ופרטית |
| עריכה ומחיקה | כל פעילות של המשפחה | רק רעיון שלו, כל עוד הוא ממתין |
| אישור רעיון | של ילדיו | ❌ |
| קביעת ציבורי או פרטי | ✅ | ❌ |
| הילדים שלי | ✅ | ❌ |

---

## 7. הסבר קצר על השרת (לשאלות בהגשה)

- **לאיזה API ה־React פונה?** לשרת Express שלך, בכתובות שמתחילות ב־`/api`.
- **מה נשלח לשרת?** נתוני הטפסים כ־JSON, פרמטרים של חיפוש בכתובת, וה־Token בכותרת `Authorization`.
- **מה חוזר מהשרת?** JSON עם פעילויות או פרטי משתמש, או שגיאה עם קוד והודעה.
- **איך נשמר המידע?** במסד נתונים PostgreSQL, בשתי טבלאות: `User` ו־`Activity`. Prisma מתרגם את הקוד לפקודות SQL.
- **איך מתבצעות התחברות והרשאות?** בהתחברות השרת בודק את הסיסמה מול ה־Hash השמור, ומחזיר JWT חתום. בכל בקשה השרת מאמת את ה־JWT, מזהה מי המשתמש ומה התפקיד שלו, ובודק אם מותר לו לבצע את הפעולה.

תיעוד אינטראקטיבי מלא, עם אפשרות לנסות כל קריאה, נמצא ב־`/api-docs` (Swagger).

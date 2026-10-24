# 🚀 התחילי כאן – העלאת השרת לאינטרנט

המדריך הזה מוביל אותך צעד אחר צעד: מהקובץ ZIP ועד שרת שעובד באינטרנט, עם Swagger ומסד נתונים.

> **הערה חשובה:** אני לא יכול לראות את האתרים של GitHub, Neon ו־Render כפי שהם נראים היום. שמות הכפתורים כאן הם הנפוצים, אבל ייתכן שהשתנו מעט. אם כפתור נקרא קצת אחרת, חפשי את הכי דומה. **הערכים שצריך להקליד** (הפקודות ושמות המשתנים) **מדויקים** ומתאימים לפרויקט הזה.

**הסדר:** GitHub ← מסד נתונים ← Render ← בדיקה ← (בסוף) אתר ה־React.

---

## חלק א – GitHub

כבר יש לך חשבון, אז מתחילים מיצירת Repository.

### 1. יצירת Repository
1. היכנסי ל־github.com.
2. למעלה מימין לחצי על **+** ואז על **New repository**.
3. **Repository name:** `ma-osim-hayom-backend`
4. בחרי **Public** (או Private, שניהם עובדים עם Render).
5. **אל** תסמני "Add a README file". בפרויקט כבר יש README.
6. לחצי **Create repository**.

### 2. חילוץ ה־ZIP
1. במחשב, לחצי לחיצה ימנית על קובץ ה־ZIP ובחרי **חלץ הכל** (Extract All).
2. תיווצר תיקייה בשם `backend-project`. בתוכה יש `src`, `prisma`, `package.json` ועוד.

### 3. העלאת הקבצים דרך הדפדפן
1. בדף ה־Repository החדש לחצי על הקישור **uploading an existing file**.
2. פתחי את התיקייה `backend-project` במחשב, **סמני את כל מה שבתוכה** (Ctrl+A), וגררי לחלון הדפדפן.
   - חשוב: גוררים את **התוכן** של התיקייה, ולא את התיקייה עצמה. כך `package.json` יהיה בשורש ה־Repository.
3. **קבצים שמתחילים בנקודה** (`.gitignore`, `.env.example`): ב־Windows הם מוצגים כרגיל. ב־Mac לחצי Cmd+Shift+. כדי לראות אותם. אם הם לא עלו, זה לא מונע מהשרת לעבוד, אבל עדיף שיעלו.
4. למטה לחצי **Commit changes**.

### 4. בדיקה שהכל עלה
בדף הראשי של ה־Repository צריך לראות: `src`, `prisma`, `tests`, `docs`, `package.json`, `tsconfig.json`, `render.yaml`, `README.md`, `START-HERE.md`.
אסור שיופיעו `node_modules` או `.env`. הם לא אמורים להיות ב־ZIP בכלל.

---

## חלק ב – מסד נתונים (PostgreSQL)

**ההמלצה: Neon.** הוא נותן PostgreSQL חינמי שעובד עם Prisma.
יש גם אפשרות של PostgreSQL חינמי ב־Render עצמו, **אבל לפי התיעוד של Render, מסד חינמי שם פג אחרי 30 יום**, ואחרי תקופת חסד נמחק. אם ההגשה והבדיקה של הפרויקט יהיו אחרי יותר מחודש, עדיף Neon. לפני שמתחילים, בדקי באתר של Neon את תנאי המסלול החינמי.

### 1. פתיחת חשבון
1. היכנסי ל־neon.com ולחצי **Sign up**. הכי פשוט להירשם עם חשבון ה־GitHub שלך.

### 2. יצירת Database
1. צרי **פרויקט חדש** (New Project).
   - **Name:** `ma-osim-hayom`
   - **Region:** בחרי אזור באירופה (למשל Frankfurt). כדאי לבחור את אותו אזור גם ב־Render.
2. בסיום נוצר מסד נתונים מוכן לשימוש.

### 3. קבלת ה־Connection String
1. בלוח הבקרה של הפרויקט לחצי **Connect**.
2. אם יש אפשרות **Connection pooling**, כבי אותה. לשרת שלנו מתאים חיבור רגיל (ישיר).
3. העתיקי את הכתובת. היא נראית בערך כך:
   `postgresql://user:password@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

### 4. שמירה בבטחה
- הכתובת כוללת סיסמה. **אל** תשמרי אותה בקוד ואל תעלי אותה ל־GitHub.
- היא נכנסת רק לשני מקומות: משתני הסביבה ב־Render, וקובץ `.env` במחשב שלך (שלא עולה ל־GitHub).

### 5. קישור השרת למסד הנתונים
את זה עושים בחלק ג: מדביקים את הכתובת במשתנה `DATABASE_URL` ב־Render.

---

## חלק ג – Render

### 1. חשבון
כבר יש לך חשבון. ודאי שהוא מחובר ל־GitHub: בהגדרות החשבון, בחלק שמציג את החשבונות המקושרים, צריך להופיע GitHub. אם לא, Render יבקש לחבר אותו בשלב הבא.

### 2. יצירת Web Service
1. ב־dashboard.render.com לחצי **New +** ואז **Web Service**.
2. בחרי **Git Provider → GitHub**. אם Render מבקש הרשאה, אשרי גישה ל־Repository `ma-osim-hayom-backend`.
3. בחרי את ה־Repository ולחצי **Connect**.

### 3. ההגדרות (הקלידי בדיוק)

| שדה | ערך |
|---|---|
| **Name** | `ma-osim-hayom-api` |
| **Region** | אותו אזור כמו מסד הנתונים (למשל Frankfurt) |
| **Branch** | `main` |
| **Root Directory** | השאירי ריק |
| **Runtime / Language** | `Node` |
| **Build Command** | `npm install --include=dev && npx prisma generate && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 4. משתני סביבה (Environment Variables)
באותו מסך, באזור **Environment Variables**, לחצי **Add Environment Variable** והוסיפי:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |
| `DATABASE_URL` | הכתובת שהעתקת מ־Neon |
| `JWT_SECRET` | מחרוזת אקראית ארוכה, לפחות 32 תווים. אפשר להשתמש בכפתור **Generate** אם הוא מוצג. לא להשתמש בדוגמה מהמדריך! |
| `JWT_EXPIRES_IN` | `1d` |
| `CORS_ORIGIN` | בינתיים `*`. אחרי שתעלי את אתר ה־React, שני לכתובת שלו (חלק ו) |
| `SEED_ON_START` | `true` כדי ליצור משתמשי הדגמה, או `false` אם לא רוצים |
| `SEED_DEMO_PASSWORD` | סיסמה שתבחרי למשתמשי ההדגמה, לפחות 6 תווים |

אם יש באותו מסך שדה **Health Check Path** (לפעמים תחת Advanced), כתבי בו `/api/health`.

### 5. Prisma Migrations
אין צורך לעשות שום דבר ידני. `npm start` מריץ אוטומטית `prisma migrate deploy` לפני שהשרת עולה, וכך הטבלאות נוצרות בהפעלה הראשונה ומתעדכנות בכל Deploy.
(בשירות החינמי של Render אין Shell, ולכן הכל בנוי לרוץ אוטומטית.)

### 6. Deploy
1. לחצי **Deploy Web Service** (או **Create Web Service**).
2. ב־**Logs** יופיעו ההודעות. ה־Build הראשון לוקח כמה דקות.
3. בסוף צריך לראות שורות כמו:
   - `All migrations have been successfully applied` (או `No pending migrations to apply`)
   - `Seed completed...` (אם הגדרת `SEED_ON_START=true`)
   - `Server is running on port ...`
4. למעלה תופיע כתובת השרת, למשל `https://ma-osim-hayom-api.onrender.com`.

### 7. בדיקה שהשרת פעיל
פתחי בדפדפן: `https://<הכתובת-שלך>.onrender.com/api/health`
צריך לראות: `{"status":"ok","database":"ok", ...}`

> **שימי לב:** בשירות החינמי, השרת "נרדם" אחרי כרבע שעה בלי פניות. הפנייה הראשונה אחר כך יכולה לקחת בערך דקה. זה תקין, וכדאי לפתוח את האתר דקה לפני שמציגים אותו.

**אחרי שהכל עובד:** אם הגדרת `SEED_ON_START=true`, אפשר להחזיר אותו ל־`false`. משתמשי ההדגמה כבר נשמרו. אם תשאירי אותו `true`, פעילויות ההדגמה יאופסו בכל הפעלה מחדש.

---

## חלק ד – בדיקה מלאה דרך Swagger

1. **פתיחת health:** `https://<הכתובת-שלך>/api/health` – מוצג `status: ok`.
2. **פתיחת Swagger:** `https://<הכתובת-שלך>/api-docs`
3. **התחברות מתוך Swagger:**
   - פתחי `POST /api/auth/login` ולחצי **Try it out**.
   - בגוף הבקשה כתבי:
     ```json
     { "username": "parent_demo", "password": "<הסיסמה של SEED_DEMO_PASSWORD>" }
     ```
   - לחצי **Execute**.
4. **קבלת JWT:** בתשובה (קוד 200) העתיקי את הערך של `token`, בלי המירכאות.
5. **Authorize:** לחצי למעלה על הכפתור **Authorize** 🔒, הדביקי את ה־Token (**בלי** המילה Bearer), ולחצי **Authorize** ואז **Close**.
6. **קריאה מוגנת:** פתחי `GET /api/auth/me`, לחצי **Try it out** ואז **Execute**. אמורים להופיע הפרטים שלך.
7. **הוספת רשומה:** פתחי `POST /api/activities`, לחצי **Try it out** (הדוגמה כבר ממולאת) ואז **Execute**. אמור לחזור קוד **201**.
8. **שליפה ממסד הנתונים:** פתחי `GET /api/activities` ולחצי **Execute**. הפעילות החדשה מופיעה ברשימה, והיא נשמרה במסד הנתונים.

**בדיקת 401 ו־403:**
- לחצי **Authorize** ואז **Logout**, והריצי שוב את `GET /api/auth/me`. אמור לחזור **401**.
- התחברי כ־`child_demo`, עשי Authorize עם ה־Token שלו, והריצי `GET /api/users/children`. אמור לחזור **403**, כי הפעולה מותרת רק להורה.

---

## חלק ה – פתרון תקלות

| תקלה | מה רואים | פתרון |
|---|---|---|
| **Build Failed** | ה־Log נעצר ב־`npm install` או ב־`tsc` | ודאי שה־Build Command הוקלד בדיוק כמו בטבלה, ושב־GitHub `package.json` נמצא בשורש ולא בתוך תיקייה. |
| **`DATABASE_URL` שגוי** | `P1001: Can't reach database server` או `P1000: Authentication failed` | העתיקי שוב את הכתובת מ־Neon, בלי רווחים ובלי מירכאות, עם `?sslmode=require` בסוף. ודאי שהפרויקט ב־Neon פעיל. |
| **בעיית Prisma** | `@prisma/client did not initialize yet` או `P3009` | ודאי ש־`npx prisma generate` נמצא ב־Build Command. ב־P3009 (Migration שנכשלה), הכי פשוט ליצור מסד חדש ב־Neon ולעדכן את `DATABASE_URL`. |
| **`JWT_SECRET` חסר** | `JWT_SECRET is missing or too short` | הוסיפי ב־Environment את `JWT_SECRET`, באורך 16 תווים לפחות, ועשי **Manual Deploy**. |
| **שגיאת CORS** | בדפדפן של אתר ה־React: `blocked by CORS policy` | ב־`CORS_ORIGIN` צריכה להיות כתובת האתר המדויקת, עם `https://` ובלי `/` בסוף. אפשר כמה כתובות עם פסיק. אחרי שינוי משתנים, Render מפעיל מחדש את השרת. |
| **401** | `UNAUTHORIZED` או `INVALID_TOKEN` | לא נשלח Token, או שהוא לא תקין או שפג תוקפו. התחברי מחדש. ב־Swagger, Authorize בלי המילה Bearer. ב־React, הכותרת היא `Authorization: Bearer <token>`. |
| **403** | `FORBIDDEN` | המשתמש מחובר, אבל אין לו הרשאה. למשל: ילד שמנסה לאשר, או עריכת פעילות של משפחה אחרת. זו התנהגות נכונה. |
| **Swagger לא נפתח** | 404 או דף ריק | הכתובת היא `/api-docs` ולא `/swagger`. אם השרת "ישן", חכי דקה ורענני. |
| **שרת שלא עולה** | `Exited with status 1` או `Deploy failed` | קראי ב־Logs את השורה האדומה הראשונה. בדרך כלל חסר משתנה סביבה (`DATABASE_URL` או `JWT_SECRET`) או שמסד הנתונים לא זמין. |
| **הפנייה הראשונה איטית** | לוקח בערך דקה | זה תקין בשירות החינמי (השרת התעורר משינה). |
| **התחברות של משתמשי הדגמה נכשלת** | 401 עם `parent_demo` | ודאי ש־`SEED_ON_START=true` ו־`SEED_DEMO_PASSWORD` מוגדרים, ועשי Manual Deploy. אפשר גם פשוט להירשם דרך `POST /api/auth/register`. |

---

## חלק ו – אחרי שאתר ה־React מוכן (העלאה כ־Static Site)

1. העלי את פרויקט ה־React ל־Repository נפרד ב־GitHub, בלי `node_modules`.
2. ב־Render לחצי **New +** ואז **Static Site**, ובחרי את ה־Repository.
3. **Build Command:** `npm install && npm run build`
4. **Publish Directory:** `dist` (אם השתמשת ב־Vite. ב־Create React App זה `build`).
5. **Environment:** הוסיפי `VITE_API_URL` עם כתובת השרת, למשל `https://ma-osim-hayom-api.onrender.com`.
6. כדי ש־React Router יעבוד ברענון של דף, הוסיפי ב־**Redirects/Rewrites** כלל:
   **Source** `/*` ← **Destination** `/index.html` ← **Action** `Rewrite`.
7. אחרי שהאתר עלה, חזרי לשרת ב־Render ושני את `CORS_ORIGIN` לכתובת האתר, למשל `https://ma-osim-hayom.onrender.com`.

---

## הרצת הבדיקות במחשב (לא חובה, אבל מומלץ לפני הגשה)

1. התקיני Node.js 22 LTS מ־nodejs.org.
2. ב־Neon צרי **מסד נתונים נוסף וריק** לבדיקות, למשל בשם `activities_test`, והעתיקי את הכתובת שלו.
3. בתיקיית הפרויקט העתיקי את `.env.example` לקובץ בשם `.env`, ומלאי בו את `DATABASE_URL`, `TEST_DATABASE_URL` (הכתובת של מסד הבדיקות) ו־`JWT_SECRET`.
4. בטרמינל, בתוך התיקייה, הריצי:
   ```bash
   npm install
   npm run check
   ```
5. בסוף צריך לראות שכל הבדיקות עוברות (`passed`).

> אם יש לך Claude Code ב־VS Code, אפשר לפתוח את התיקייה ולבקש ממנו להריץ את `npm run check` ולתקן אם משהו נכשל.

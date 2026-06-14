# תמלול הקלטות בעברית

אפליקציית ווב עצמאית לתמלול הקלטות בעברית עם זיהוי דוברים — מחליפה את ה-workflow
של N8N. בנויה ב-Next.js 16, AssemblyAI, Postgres (Neon) ו-Vercel Blob.

## זרימה

```
העלאה ישירה מהדפדפן → Vercel Blob ─┐
                                    ├→ AssemblyAI (he + דוברים)
Google Drive → השרת ──────────────┘        │ webhook / סנכרון בסיום
                                            ▼
                                    Postgres → ממשק צפייה
```

- **העלאה**: הדפדפן מעלה את הקובץ **ישירות ל-Vercel Blob** (עם בר התקדמות),
  עוקף את מגבלת ה-4.5MB של פונקציות serverless — תומך בקבצים גדולים.
- **סיום תמלול**: AssemblyAI שולח webhook ל-`/api/webhook`. בנוסף יש **סנכרון
  fallback** שמושך סטטוס ישירות מ-AssemblyAI (עובד גם מקומית בלי כתובת ציבורית).
- **מחיקה**: מוחקת את הרשומה ואת הקובץ מ-Blob.

## הקמה

1. **התקנת תלויות:**
   ```bash
   npm install
   ```

2. **משתני סביבה** — העתיקו את `.env.example` ל-`.env.local` ומלאו:
   - `DATABASE_URL` — Neon Postgres (https://neon.tech או Vercel Marketplace)
   - `ASSEMBLYAI_API_KEY` — https://www.assemblyai.com/app/account
   - `BLOB_READ_WRITE_TOKEN` — נמשך אוטומטית עם
     `vercel blob create-store <name> --access public --yes`
   - `APP_URL` — כתובת ציבורית ל-webhook (בפיתוח: ngrok; בפרודקשן: כתובת Vercel)
   - `WEBHOOK_SECRET` — מחרוזת אקראית
   - (אופציונלי) `GOOGLE_SERVICE_ACCOUNT_JSON` או `GOOGLE_API_KEY` ל-Drive

3. **יצירת הטבלה ב-DB:**
   ```bash
   npm run db:push
   ```

4. **הרצה:**
   ```bash
   npm run dev
   ```

## הערה חשובה על ה-Webhook בפיתוח מקומי

AssemblyAI צריך לקרוא ל-`APP_URL/api/webhook` מהאינטרנט. ב-localhost זה לא נגיש,
לכן בפיתוח הריצו טאנל (למשל `ngrok http 3000`) והגדירו את ה-URL שלו כ-`APP_URL`.
בפרודקשן על Vercel — הכתובת נגישה אוטומטית.

## מבנה

| נתיב | תיאור |
|------|-------|
| `src/app/page.tsx` | עמוד הבית — העלאה/Drive + רשימה |
| `src/app/transcriptions/[id]/page.tsx` | עמוד צפייה בתמלול |
| `src/app/api/transcriptions/` | יצירה (POST), רשימה (GET), פריט, retry |
| `src/app/api/drive/route.ts` | שליפה מ-Google Drive |
| `src/app/api/webhook/route.ts` | קבלת סיום מ-AssemblyAI |
| `src/lib/service.ts` | לוגיקה משותפת (יצירה, התחלה, webhook) |
| `src/lib/transcription/` | אבסטרקציית ספק התמלול (קל להחליף ל-Whisper/ElevenLabs) |
| `src/lib/drive.ts` | הורדה מ-Google Drive |
| `src/lib/schema.ts` | סכמת בסיס הנתונים (Drizzle) |

## החלפת ספק תמלול

הספק הפעיל מוגדר ב-`src/lib/transcription/index.ts`. כדי לעבור ל-ElevenLabs Scribe
או Whisper — יישמו את ממשק `TranscriptionProvider` (`src/lib/transcription/types.ts`)
ושנו את ה-export. שאר הקוד לא משתנה.

## פריסה ל-Vercel

```bash
vercel
```
חברו Neon ו-Blob דרך ה-Marketplace, הגדירו את משתני הסביבה, ו-`APP_URL` יהיה כתובת
הפרודקשן. הריצו `npm run db:push` מול ה-DATABASE_URL של הפרודקשן.

# 🔗 חיבור Google Drive ל-MeetScribe

האפליקציה יכולה לשלוף הקלטות ישירות מ-Google Drive ולתמלל אותן. יש שתי שיטות אימות:

- **Service Account (חשבון שירות) — מומלץ.** עובד גם לקבצים פרטיים וגם ל-Shared Drives.
- **API Key.** פשוט יותר, אבל עובד **רק** לקבצים ציבוריים ("כל מי שיש לו קישור").

המדריך הזה מתמקד ב-Service Account.

---

## חלק א' — יצירת Service Account ב-Google Cloud

1. **היכנסו ל-Google Cloud Console:** https://console.cloud.google.com
2. **צרו פרויקט חדש** (למעלה, ליד הלוגו → "New Project"). תנו לו שם, למשל `MeetScribe`.
3. **הפעילו את Google Drive API:**
   - תפריט ☰ → **APIs & Services** → **Library**
   - חפשו **"Google Drive API"** → לחצו עליו → **Enable**
4. **צרו חשבון שירות:**
   - תפריט ☰ → **IAM & Admin** → **Service Accounts** → **Create Service Account**
   - תנו שם (למשל `meetscribe-drive`) → **Create and Continue** → **Done**
     (אפשר לדלג על שלבי ההרשאות)
5. **צרו מפתח JSON:**
   - לחצו על חשבון השירות שיצרתם → לשונית **Keys** → **Add Key** →
     **Create new key** → בחרו **JSON** → **Create**
   - יירד קובץ `.json` למחשב. **שמרו אותו — זה הסוד שלכם.**
   - ⚠️ **אסור להעלות אותו ל-GitHub!** (הוא כבר מכוסה ב-`.gitignore`, אבל אל
     תשימו אותו בתוך הקוד.)

## חלק ב' — הכנסת המפתח ל-`.env.local`

הכי נוח להמיר את ה-JSON ל-**base64** (נמנע מבעיות מרכאות בקובץ הסביבה).

ב-Windows PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\נתיב\לקובץ\key.json"))
```

ב-macOS / Linux:

```bash
base64 -i /path/to/key.json
```

העתיקו את הפלט (מחרוזת ארוכה) ושימו ב-`.env.local`:

```
GOOGLE_SERVICE_ACCOUNT_JSON="<המחרוזת_base64_כאן>"
```

> הקוד תומך גם ב-JSON גולמי וגם ב-base64 — אבל base64 הכי בטוח.

## חלק ג' — לשתף את הקובץ עם חשבון השירות 🔑

זה השלב שהכי שוכחים. חשבון השירות הוא "משתמש" נפרד עם כתובת אימייל משלו:

1. פתחו את קובץ ה-JSON שהורדתם ומצאו את השדה `client_email` — משהו כמו:
   `meetscribe-drive@PROJECT-ID.iam.gserviceaccount.com`
2. ב-Google Drive, לחצו **Share / שיתוף** על הקובץ (או על כל התיקייה) → הדביקו
   את הכתובת הזו → תנו הרשאת **Viewer / צופה**.

בלי השיתוף הזה האפליקציה תקבל שגיאת הרשאה — חשבון השירות פשוט לא "רואה" את הקובץ.

## חלק ד' — שימוש באפליקציה

בעמוד הבית, בקלט של Drive, מדביקים את **קישור השיתוף** או את ה-`file_id`:

- `https://drive.google.com/file/d/FILE_ID/view` ✅
- `https://drive.google.com/open?id=FILE_ID` ✅
- או רק ה-`FILE_ID` עצמו ✅

האפליקציה מחלצת אוטומטית את ה-id, מורידה את הקובץ ושולחת לתמלול.

---

## אפשרות חלופית — API Key (רק לקבצים ציבוריים)

אם הקבצים מוגדרים "כל מי שיש לו קישור יכול לצפות", אפשר לדלג על Service Account:

1. ב-Google Cloud Console → **APIs & Services** → **Credentials** →
   **Create Credentials** → **API key**.
2. ודאו ש-Google Drive API מופעל (חלק א' שלב 3).
3. שימו ב-`.env.local`:
   ```
   GOOGLE_API_KEY="..."
   ```

זה לא יעבוד לקבצים פרטיים — לשם כך צריך Service Account.

---

## בעיות נפוצות

| שגיאה | פתרון |
|--------|--------|
| `שליפת מטא-דאטה מ-Drive נכשלה (404)` | הקובץ לא משותף עם כתובת חשבון השירות (חלק ג') |
| `שליפת מטא-דאטה נכשלה (403)` | Google Drive API לא הופעל (חלק א' שלב 3) |
| `לא הוגדר אימות ל-Google Drive` | `GOOGLE_SERVICE_ACCOUNT_JSON` ריק/חסר ב-`.env.local` |
| קובץ ב-**Shared Drive** | עובד — צריך לשתף את חשבון השירות כחבר ב-Shared Drive |

---

> 💡 הקוד הרלוונטי: [`src/lib/drive.ts`](src/lib/drive.ts) (שליפה + אימות) ו-
> [`src/app/api/drive/route.ts`](src/app/api/drive/route.ts) (הזרמה ל-Vercel Blob → תמלול).

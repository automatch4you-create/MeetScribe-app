import { JWT } from "google-auth-library";
import { fetchLarge } from "./http";

/**
 * שולף קובץ מ-Google Drive לפי file_id או קישור שיתוף.
 *
 * אימות (לפי סדר עדיפות):
 * 1. GOOGLE_SERVICE_ACCOUNT_JSON — תוכן מפתח ה-service account (JSON).
 *    הקובץ ב-Drive חייב להיות משותף עם כתובת ה-service account.
 * 2. GOOGLE_API_KEY — עובד רק לקבצים ציבוריים ("כל מי שיש לו קישור").
 */

const DRIVE_API = "https://www.googleapis.com/drive/v3/files";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

/** מחלץ file_id מתוך מזהה גולמי או קישור Drive */
export function extractFileId(input: string): string | null {
  const trimmed = input.trim();
  // קישור מסוג /file/d/FILE_ID/
  const pathMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (pathMatch) return pathMatch[1];
  // קישור מסוג ?id=FILE_ID
  const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch) return queryMatch[1];
  // מזהה גולמי
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;
  return null;
}

/**
 * טוען את מפתח ה-Service Account מ-GOOGLE_SERVICE_ACCOUNT_JSON.
 * תומך גם ב-JSON גולמי וגם ב-base64 (מומלץ — נמנע מבעיות ציטוט ב-.env),
 * ומנרמל את ה-private_key (\\n → שורות חדשות).
 */
function loadServiceAccount(): {
  client_email: string;
  private_key: string;
} | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;

  const jsonStr = raw.startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");

  const creds = JSON.parse(jsonStr) as {
    client_email: string;
    private_key: string;
  };
  creds.private_key = creds.private_key.replace(/\\n/g, "\n");
  return creds;
}

async function getServiceAccountToken(): Promise<string | null> {
  const creds = loadServiceAccount();
  if (!creds) return null;

  const client = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [DRIVE_SCOPE],
  });
  const { access_token } = await client.authorize();
  return access_token ?? null;
}

export type DriveFile = {
  fileName: string;
  contentType: string;
  /** זרם התוכן של הקובץ (להזרמה ישירה ל-Blob ללא אגירה בזיכרון) */
  stream: ReadableStream<Uint8Array>;
};

/** מוריד את הקובץ ואת שמו מ-Drive (מחזיר זרם, מתאים לקבצים גדולים) */
export async function downloadFromDrive(fileId: string): Promise<DriveFile> {
  const token = await getServiceAccountToken();
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!token && !apiKey) {
    throw new Error(
      "לא הוגדר אימות ל-Google Drive. הגדר GOOGLE_SERVICE_ACCOUNT_JSON או GOOGLE_API_KEY",
    );
  }

  const authQuery = !token && apiKey ? `&key=${apiKey}` : "";
  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  // שליפת מטא-דאטה (שם הקובץ). supportsAllDrives — לתמיכה ב-Shared Drives
  const metaRes = await fetch(
    `${DRIVE_API}/${fileId}?fields=name,mimeType&supportsAllDrives=true${authQuery}`,
    { headers },
  );
  if (!metaRes.ok) {
    const body = await metaRes.text();
    throw new Error(`שליפת מטא-דאטה מ-Drive נכשלה (${metaRes.status}): ${body}`);
  }
  const meta = (await metaRes.json()) as { name: string; mimeType: string };

  // הורדת התוכן (timeout מורחב — קבצים גדולים)
  const fileRes = await fetchLarge(
    `${DRIVE_API}/${fileId}?alt=media&supportsAllDrives=true${authQuery}`,
    { headers },
  );
  if (!fileRes.ok) {
    const body = await fileRes.text();
    throw new Error(`הורדת הקובץ מ-Drive נכשלה (${fileRes.status}): ${body}`);
  }
  if (!fileRes.body) {
    throw new Error("תגובת Drive ללא גוף");
  }

  return {
    fileName: meta.name,
    contentType: meta.mimeType,
    stream: fileRes.body,
  };
}

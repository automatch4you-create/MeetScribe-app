import { eq, desc } from "drizzle-orm";
import { del } from "@vercel/blob";
import { getDb } from "./db";
import { transcriptions, type Transcription } from "./schema";
import { provider } from "./transcription";
import { summarizeTranscript } from "./summarize";

const WEBHOOK_AUTH_HEADER = "x-webhook-secret";

function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

function webhookSecret(): string {
  return process.env.WEBHOOK_SECRET ?? "";
}

/**
 * מעלה בייטים של אודיו לספק התמלול, יוצר רשומה, ומתחיל תמלול.
 * משמש גם להעלאה ישירה (File) וגם ל-Google Drive (Buffer שהורד).
 */
export async function createFromAudio(params: {
  source: "upload" | "drive";
  fileName: string;
  data: ArrayBuffer;
  language?: string;
}): Promise<Transcription> {
  const { url } = await provider.uploadAudio(params.data);
  return createAndStart({
    source: params.source,
    fileName: params.fileName,
    audioUrl: url,
    language: params.language,
  });
}

/**
 * יוצר רשומת תמלול חדשה (status: queued) ומתחיל מיד את התמלול.
 * משמש גם להעלאה ישירה וגם למקור Google Drive.
 */
export async function createAndStart(params: {
  source: "upload" | "drive";
  fileName: string;
  audioUrl: string;
  language?: string;
}): Promise<Transcription> {
  const db = getDb();

  const [record] = await db
    .insert(transcriptions)
    .values({
      source: params.source,
      fileName: params.fileName,
      audioUrl: params.audioUrl,
      language: params.language ?? "he",
      status: "queued",
    })
    .returning();

  return startTranscription(record);
}

/**
 * שולח רשומה קיימת לתמלול אצל הספק ומעדכן את הסטטוס ל-processing.
 * אם נכשל — מעדכן ל-error. משמש גם ל-retry.
 */
export async function startTranscription(
  record: Transcription,
): Promise<Transcription> {
  const db = getDb();

  if (!record.audioUrl) {
    throw new Error("לרשומה אין audioUrl — לא ניתן לתמלל");
  }

  try {
    const { providerId } = await provider.startTranscription({
      audioUrl: record.audioUrl,
      languageCode: record.language,
      webhookUrl: `${appUrl()}/api/webhook`,
      webhookAuthHeaderName: WEBHOOK_AUTH_HEADER,
      webhookAuthHeaderValue: webhookSecret(),
    });

    const [updated] = await db
      .update(transcriptions)
      .set({
        assemblyaiId: providerId,
        status: "processing",
        error: null,
      })
      .where(eq(transcriptions.id, record.id))
      .returning();

    return updated;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const [updated] = await db
      .update(transcriptions)
      .set({ status: "error", error: message })
      .where(eq(transcriptions.id, record.id))
      .returning();
    return updated;
  }
}

/**
 * מטפל בהודעת webhook מהספק. מאמת את הסוד, שולף את התוצאה המלאה,
 * ומעדכן את הרשומה התואמת.
 */
export async function handleWebhook(params: {
  providerId: string;
  secret: string | null;
}): Promise<void> {
  if (webhookSecret() && params.secret !== webhookSecret()) {
    throw new Error("Unauthorized webhook");
  }

  const db = getDb();
  const result = await provider.fetchResult(params.providerId);

  if (result.status === "completed") {
    await db
      .update(transcriptions)
      .set({
        status: "completed",
        text: result.text,
        speakers: result.speakers,
        error: null,
        completedAt: new Date(),
      })
      .where(eq(transcriptions.assemblyaiId, params.providerId));
  } else if (result.status === "error") {
    await db
      .update(transcriptions)
      .set({ status: "error", error: result.error ?? "תמלול נכשל" })
      .where(eq(transcriptions.assemblyaiId, params.providerId));
  }
  // queued/processing — לא משנים, ממתינים ל-webhook הבא
}

/**
 * סנכרון יזום מול הספק — שולף את הסטטוס הנוכחי מ-AssemblyAI ומעדכן את הרשומה.
 * משמש כ-fallback ל-webhook (למשל בפיתוח מקומי בלי כתובת ציבורית,
 * או אם ה-webhook נכשל). לא עושה כלום אם הרשומה כבר הסתיימה.
 */
export async function syncFromProvider(
  id: string,
): Promise<Transcription | null> {
  const db = getDb();
  const record = await getTranscription(id);
  if (!record || !record.assemblyaiId) return record;
  if (record.status === "completed" || record.status === "error") {
    return record;
  }

  const result = await provider.fetchResult(record.assemblyaiId);

  if (result.status === "completed") {
    const [updated] = await db
      .update(transcriptions)
      .set({
        status: "completed",
        text: result.text,
        speakers: result.speakers,
        error: null,
        completedAt: new Date(),
      })
      .where(eq(transcriptions.id, id))
      .returning();
    return updated;
  }
  if (result.status === "error") {
    const [updated] = await db
      .update(transcriptions)
      .set({ status: "error", error: result.error ?? "תמלול נכשל" })
      .where(eq(transcriptions.id, id))
      .returning();
    return updated;
  }
  return record;
}

export async function listTranscriptions(): Promise<Transcription[]> {
  const db = getDb();
  const items = await db
    .select()
    .from(transcriptions)
    .orderBy(desc(transcriptions.createdAt));

  // סנכרון יזום של פריטים פעילים מול הספק (fallback ל-webhook)
  const active = items.filter(
    (i) => i.status === "queued" || i.status === "processing",
  );
  if (active.length === 0) return items;

  const synced = await Promise.all(
    active.map((i) => syncFromProvider(i.id).catch(() => null)),
  );
  const byId = new Map(synced.filter(Boolean).map((r) => [r!.id, r!]));
  return items.map((i) => byId.get(i.id) ?? i);
}

export async function getTranscription(
  id: string,
): Promise<Transcription | null> {
  const db = getDb();
  const [record] = await db
    .select()
    .from(transcriptions)
    .where(eq(transcriptions.id, id))
    .limit(1);
  return record ?? null;
}

export async function retryTranscription(
  id: string,
): Promise<Transcription | null> {
  const record = await getTranscription(id);
  if (!record) return null;
  return startTranscription(record);
}

/**
 * מייצר סיכום פגישה לתמלול שהושלם ושומר אותו ב-DB.
 * מחזיר את הרשומה המעודכנת, או null אם לא נמצאה / לא מוכנה.
 */
export async function generateSummary(
  id: string,
): Promise<Transcription | null> {
  const db = getDb();
  const record = await getTranscription(id);
  if (!record) return null;
  if (record.status !== "completed") {
    throw new Error("ניתן לסכם רק תמלול שהושלם");
  }

  const summary = await summarizeTranscript(record.text, record.speakers);

  const [updated] = await db
    .update(transcriptions)
    .set({ summary })
    .where(eq(transcriptions.id, id))
    .returning();
  return updated;
}

/**
 * מוחק רשומת תמלול. אם הקובץ אוחסן ב-Vercel Blob — מוחק גם אותו (best-effort).
 * מחזיר true אם נמחק, false אם לא נמצא.
 */
export async function deleteTranscription(id: string): Promise<boolean> {
  const db = getDb();
  const record = await getTranscription(id);
  if (!record) return false;

  if (record.audioUrl?.includes(".blob.vercel-storage.com")) {
    try {
      await del(record.audioUrl);
    } catch {
      // לא חוסם מחיקה אם מחיקת הקובץ נכשלה
    }
  }

  await db.delete(transcriptions).where(eq(transcriptions.id, id));
  return true;
}

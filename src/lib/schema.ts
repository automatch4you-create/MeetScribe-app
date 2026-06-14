import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * קטע דיבור בודד מתוך התמלול (utterance) — לפי דובר.
 */
export type SpeakerSegment = {
  speaker: string; // למשל "A", "B"
  text: string;
  start: number; // אלפיות שנייה
  end: number; // אלפיות שנייה
};

/**
 * סטטוסים אפשריים של תמלול לאורך מחזור החיים.
 * queued     – נוצרה רשומה, ממתין לשליחה
 * processing – נשלח ל-AssemblyAI, בתהליך תמלול
 * completed  – הושלם, הטקסט זמין
 * error      – נכשל
 */
export const TRANSCRIPTION_STATUSES = [
  "queued",
  "processing",
  "completed",
  "error",
] as const;

export type TranscriptionStatus = (typeof TRANSCRIPTION_STATUSES)[number];

export const transcriptions = pgTable("transcriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** מקור הקובץ: העלאה ישירה או Google Drive */
  source: text("source").notNull().default("upload"), // 'upload' | 'drive'
  fileName: text("file_name").notNull(),
  /** כתובת ציבורית של קובץ האודיו (Vercel Blob) שממנה AssemblyAI מושך */
  audioUrl: text("audio_url"),
  /** מזהה התמלול אצל AssemblyAI */
  assemblyaiId: text("assemblyai_id"),
  status: text("status").notNull().default("queued"),
  language: text("language").notNull().default("he"),
  /** הטקסט המלא של התמלול */
  text: text("text"),
  /** סיכום הפגישה (נוצר לפי דרישה ע"י Claude/LeMUR) */
  summary: text("summary"),
  /** קטעים מופרדים לפי דובר */
  speakers: jsonb("speakers").$type<SpeakerSegment[]>(),
  /** הודעת שגיאה אם הסטטוס הוא error */
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type Transcription = typeof transcriptions.$inferSelect;
export type NewTranscription = typeof transcriptions.$inferInsert;

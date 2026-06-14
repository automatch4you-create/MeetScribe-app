import type { SpeakerSegment } from "../schema";

/**
 * ממשק אחיד לכל ספק תמלול. מאפשר להחליף בין AssemblyAI / ElevenLabs / Whisper
 * בלי לגעת בשאר הקוד של האפליקציה.
 */
export interface TranscriptionProvider {
  /**
   * מעלה קובץ אודיו לספק ומחזיר כתובת שממנה ניתן לתמלל.
   * (ב-AssemblyAI: endpoint ה-upload שמחזיר upload_url פרטי.)
   */
  uploadAudio(data: ArrayBuffer): Promise<{ url: string }>;

  /**
   * מתחיל תמלול אסינכרוני. מקבל כתובת אודיו ומחזיר מזהה אצל הספק.
   * הספק יקרא ל-webhookUrl כשהתמלול יסתיים.
   */
  startTranscription(input: StartTranscriptionInput): Promise<{ providerId: string }>;

  /**
   * שולף את תוצאת התמלול לפי מזהה הספק (נקרא מתוך ה-webhook).
   */
  fetchResult(providerId: string): Promise<TranscriptionResult>;
}

export interface StartTranscriptionInput {
  audioUrl: string;
  languageCode: string; // למשל "he"
  webhookUrl: string;
  /** שם וערך כותרת לאימות שה-webhook הגיע מהספק */
  webhookAuthHeaderName?: string;
  webhookAuthHeaderValue?: string;
}

export interface TranscriptionResult {
  status: "completed" | "processing" | "queued" | "error";
  text: string | null;
  speakers: SpeakerSegment[] | null;
  error: string | null;
}

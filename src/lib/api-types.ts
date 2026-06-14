import type { SpeakerSegment, TranscriptionStatus } from "./schema";

/**
 * צורת רשומת תמלול כפי שהיא מגיעה ל-client דרך JSON
 * (תאריכים כמחרוזות ISO).
 */
export type TranscriptionDTO = {
  id: string;
  source: "upload" | "drive";
  fileName: string;
  audioUrl: string | null;
  assemblyaiId: string | null;
  status: TranscriptionStatus;
  language: string;
  text: string | null;
  summary: string | null;
  speakers: SpeakerSegment[] | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
};

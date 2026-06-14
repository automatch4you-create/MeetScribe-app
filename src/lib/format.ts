import type { TranscriptionStatus } from "./schema";

export const STATUS_LABELS: Record<TranscriptionStatus, string> = {
  queued: "בתור",
  processing: "מתמלל...",
  completed: "הושלם",
  error: "שגיאה",
};

export const STATUS_COLORS: Record<TranscriptionStatus, string> = {
  queued: "bg-slate-200 text-slate-700",
  processing: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  error: "bg-red-100 text-red-800",
};

/** ממיר אלפיות שנייה לפורמט HH:MM:SS,mmm (לקבצי SRT) */
export function msToSrtTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const millis = ms % 1000;
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(millis, 3)}`;
}

/** ממיר אלפיות שנייה לפורמט קריא MM:SS לתצוגה */
export function msToClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

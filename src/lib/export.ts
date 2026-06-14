import type { SpeakerSegment } from "./schema";
import { msToSrtTime } from "./format";

/** בונה תוכן TXT — טקסט מלא, ואם יש דוברים אז מופרד לפי דובר */
export function buildTxt(text: string | null, speakers: SpeakerSegment[] | null): string {
  if (speakers && speakers.length > 0) {
    return speakers
      .map((s) => `דובר ${s.speaker}: ${s.text}`)
      .join("\n\n");
  }
  return text ?? "";
}

/** בונה תוכן SRT מתוך קטעי הדוברים */
export function buildSrt(speakers: SpeakerSegment[] | null): string {
  if (!speakers || speakers.length === 0) return "";
  return speakers
    .map((s, i) => {
      const index = i + 1;
      const time = `${msToSrtTime(s.start)} --> ${msToSrtTime(s.end)}`;
      return `${index}\n${time}\nדובר ${s.speaker}: ${s.text}`;
    })
    .join("\n\n");
}

/** מפעיל הורדת קובץ בדפדפן */
export function downloadFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

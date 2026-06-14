import { generateText } from "ai";
import type { SpeakerSegment } from "./schema";

/**
 * סיכום פגישה באמצעות Claude דרך Vercel AI Gateway.
 *
 * מזהה המודל הוא מחרוזת "provider/model" שעוברת דרך ה-Gateway.
 * אימות: בפרודקשן על Vercel — אוטומטי דרך OIDC. מקומית — VERCEL_OIDC_TOKEN
 * (נמשך ע"י Vercel CLI) או AI_GATEWAY_API_KEY.
 */
const MODEL = process.env.SUMMARY_MODEL ?? "anthropic/claude-opus-4-8";

const SYSTEM_PROMPT = [
  "אתה עוזר שמסכם פגישות בעברית. כתוב את הסיכום בעברית תקנית בלבד,",
  "תמציתי וברור. כלול את החלקים הבאים רק אם הם רלוונטיים, עם כותרות ונקודות:",
  "1. נושאים עיקריים שנדונו",
  "2. החלטות שהתקבלו",
  "3. משימות ומעקב (action items) — כולל אחראי אם צוין",
  "אל תמציא מידע שלא נאמר בתמלול. אם משהו לא ברור, אל תכלול אותו.",
].join("\n");

export async function summarizeTranscript(
  text: string | null,
  speakers: SpeakerSegment[] | null,
): Promise<string> {
  const body =
    speakers && speakers.length > 0
      ? speakers.map((s) => `דובר ${s.speaker}: ${s.text}`).join("\n")
      : (text ?? "");

  if (!body.trim()) {
    throw new Error("אין תוכן תמלול לסיכום");
  }

  const { text: summary } = await generateText({
    model: MODEL,
    system: SYSTEM_PROMPT,
    prompt: `סכם את הפגישה הבאה:\n\n${body}`,
  });

  return summary.trim();
}

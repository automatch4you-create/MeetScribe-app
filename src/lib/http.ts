import { Agent, fetch as undiciFetch } from "undici";

/**
 * Dispatcher עם timeout מורחב לפעולות על קבצים גדולים —
 * הורדת וידאו/אודיו מ-Google Drive והעלאתו ל-AssemblyAI.
 * ברירת המחדל של undici (5 דק') קצרה מדי לקבצים כבדים.
 *
 * חשוב: משתמשים ב-fetch של undici (ולא ב-fetch הגלובלי של Node) כדי שה-Agent
 * יהיה תואם — ערבוב בין הגרסאות גורם ל-UND_ERR_INVALID_ARG.
 */
const largeFileDispatcher = new Agent({
  headersTimeout: 30 * 60 * 1000, // 30 דקות
  bodyTimeout: 30 * 60 * 1000, // 30 דקות
  connectTimeout: 60 * 1000,
});

/**
 * כמו fetch רגיל, אך עם timeout מורחב לקבצים גדולים.
 */
export async function fetchLarge(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const res = await undiciFetch(url, {
    ...(init as Record<string, unknown>),
    dispatcher: largeFileDispatcher,
  } as Parameters<typeof undiciFetch>[1]);
  return res as unknown as Response;
}

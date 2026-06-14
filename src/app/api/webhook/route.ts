import { NextRequest } from "next/server";
import { handleWebhook } from "@/lib/service";

export const runtime = "nodejs";

/**
 * נקודת קצה ש-AssemblyAI קורא לה כשתמלול מסתיים.
 * גוף הבקשה: { transcript_id, status }
 * אימות: כותרת x-webhook-secret (מוגדרת בעת יצירת התמלול).
 */
export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-webhook-secret");
    const body = (await request.json()) as {
      transcript_id?: string;
      status?: string;
    };

    const providerId = body.transcript_id;
    if (!providerId) {
      return new Response("Missing transcript_id", { status: 400 });
    }

    await handleWebhook({ providerId, secret });
    return new Response("OK", { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "webhook error";
    console.error("[/api/webhook]", err);
    const status = message === "Unauthorized webhook" ? 401 : 400;
    return new Response(message, { status });
  }
}

import { listTranscriptions } from "@/lib/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await listTranscriptions();
    return Response.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה לא ידועה";
    console.error("[/api/transcriptions]", err);
    return Response.json({ error: message }, { status: 500 });
  }
}

import { NextRequest } from "next/server";
import { retryTranscription } from "@/lib/service";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<"/api/transcriptions/[id]/retry">,
) {
  try {
    const { id } = await ctx.params;
    const record = await retryTranscription(id);
    if (!record) {
      return Response.json({ error: "לא נמצא" }, { status: 404 });
    }
    return Response.json({ record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה לא ידועה";
    return Response.json({ error: message }, { status: 500 });
  }
}

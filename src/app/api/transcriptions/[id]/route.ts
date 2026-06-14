import { NextRequest } from "next/server";
import {
  getTranscription,
  syncFromProvider,
  deleteTranscription,
} from "@/lib/service";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/transcriptions/[id]">,
) {
  try {
    const { id } = await ctx.params;
    let record = await getTranscription(id);
    if (!record) {
      return Response.json({ error: "לא נמצא" }, { status: 404 });
    }
    // סנכרון יזום מול הספק כ-fallback ל-webhook
    if (record.status === "queued" || record.status === "processing") {
      record = (await syncFromProvider(id)) ?? record;
    }
    return Response.json({ record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה לא ידועה";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/transcriptions/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const ok = await deleteTranscription(id);
    if (!ok) {
      return Response.json({ error: "לא נמצא" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה לא ידועה";
    return Response.json({ error: message }, { status: 500 });
  }
}

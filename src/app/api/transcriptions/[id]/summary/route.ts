import { NextRequest } from "next/server";
import { generateSummary } from "@/lib/service";

export const runtime = "nodejs";
// סיכום LeMUR עשוי לקחת זמן — מאריכים את חלון הריצה
export const maxDuration = 120;

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<"/api/transcriptions/[id]/summary">,
) {
  try {
    const { id } = await ctx.params;
    const record = await generateSummary(id);
    if (!record) {
      return Response.json({ error: "לא נמצא" }, { status: 404 });
    }
    return Response.json({ record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "יצירת הסיכום נכשלה";
    console.error("[/api/transcriptions/[id]/summary]", err);
    return Response.json({ error: message }, { status: 500 });
  }
}

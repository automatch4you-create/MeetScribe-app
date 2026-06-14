import { NextRequest } from "next/server";
import { createAndStart } from "@/lib/service";

export const runtime = "nodejs";

/**
 * יוצר רשומת תמלול מתוך כתובת אודיו (לאחר העלאה ישירה ל-Blob)
 * ומתחיל תמלול. AssemblyAI ימשוך את הקובץ מהכתובת.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { url?: string; fileName?: string };
    if (!body.url || !body.fileName) {
      return Response.json(
        { error: "חסר url או fileName" },
        { status: 400 },
      );
    }

    const record = await createAndStart({
      source: "upload",
      fileName: body.fileName,
      audioUrl: body.url,
    });

    return Response.json({ record }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה לא ידועה";
    console.error("[/api/transcriptions/from-url]", err);
    return Response.json({ error: message }, { status: 500 });
  }
}

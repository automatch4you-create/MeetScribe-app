import { put } from "@vercel/blob";
import { NextRequest } from "next/server";
import { createAndStart } from "@/lib/service";
import { downloadFromDrive, extractFileId } from "@/lib/drive";

export const runtime = "nodejs";
// קבצים גדולים (וידאו) — מאריכים את חלון הריצה בפרודקשן
export const maxDuration = 800;

/**
 * מקבל file_id או קישור Drive, מזרים את הקובץ ל-Vercel Blob,
 * ומתחיל תמלול (source: drive). AssemblyAI מושך מכתובת ה-Blob.
 * הזרמה ישירה (Drive → Blob) מונעת אגירה בזיכרון והעלאה כבדה ישירה ל-AAI.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { input?: string };
    if (!body.input) {
      return Response.json({ error: "לא סופק מזהה או קישור" }, { status: 400 });
    }

    const fileId = extractFileId(body.input);
    if (!fileId) {
      return Response.json(
        { error: "לא זוהה file_id תקין מהקלט" },
        { status: 400 },
      );
    }

    const file = await downloadFromDrive(fileId);

    const blob = await put(`drive/${Date.now()}-${file.fileName}`, file.stream, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.contentType,
      multipart: true, // לקבצים גדולים
    });

    const record = await createAndStart({
      source: "drive",
      fileName: file.fileName,
      audioUrl: blob.url,
    });

    return Response.json({ record }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה לא ידועה";
    console.error("[/api/drive]", err);
    return Response.json({ error: message }, { status: 500 });
  }
}

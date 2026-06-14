import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = 500 * 1024 * 1024; // 500MB

/**
 * נקודת קצה שמנפיקה token להעלאה ישירה מהדפדפן ל-Vercel Blob.
 * הדפדפן מעלה ישירות ל-Blob (עוקף את מגבלת ה-4.5MB של פונקציות),
 * ומקבל בחזרה כתובת ציבורית ש-AssemblyAI ימשוך ממנה.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["audio/*", "video/*"],
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
      }),
      // לא יוצרים כאן את הרשומה — onUploadCompleted לא נקרא בפיתוח מקומי
      // (localhost לא נגיש ל-Blob). הדפדפן יוצר את הרשומה דרך /api/transcriptions/from-url.
      onUploadCompleted: async () => {},
    });

    return Response.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאת העלאה";
    return Response.json({ error: message }, { status: 400 });
  }
}

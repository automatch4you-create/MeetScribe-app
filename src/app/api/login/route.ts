import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const u = process.env.APP_USERNAME;
    const p = process.env.APP_PASSWORD;
    const token = process.env.AUTH_TOKEN;

    if (!u || !p || !token) {
      return NextResponse.json(
        { error: "האימות לא הוגדר בשרת (חסרים משתני סביבה)" },
        { status: 500 },
      );
    }

    if (username !== u || password !== p) {
      return NextResponse.json(
        { error: "שם משתמש או סיסמה שגויים" },
        { status: 401 },
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("ms_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 ימים
    });
    return res;
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }
}

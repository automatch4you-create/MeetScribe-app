import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * שער הגנה לכל האפליקציה: דורש התחברות (cookie תקין) כדי לגשת לכל דף/‏API,
 * חוץ מדף ההתחברות, ה-API של ההתחברות, וה-webhook של AssemblyAI
 * (שמאומת בנפרד עם x-webhook-secret).
 */

const AUTH_COOKIE = "ms_auth";

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/logout") ||
    pathname.startsWith("/api/webhook")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const expected = process.env.AUTH_TOKEN;

  if (expected && token === expected) {
    return NextResponse.next();
  }

  // לא מאומת
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // רץ על כל הנתיבים פרט לקבצים סטטיים ולנכסי Next הפנימיים
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|txt|xml)$).*)",
  ],
};

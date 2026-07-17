import { NextRequest, NextResponse } from "next/server";

async function sha256(value: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}

async function expectedToken() {
  const password = process.env.VEMO_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "";
  const secret = process.env.VEMO_ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";

  if (!password || !secret) return null;

  return sha256(`${password}:${secret}`);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/fr/admin") ||
    pathname.startsWith("/en/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAuthApi = pathname.startsWith("/api/admin/auth");
  const isLoginPage =
    pathname === "/admin/connexion" ||
    pathname === "/fr/admin/login" ||
    pathname === "/en/admin/login";

  if (isAuthApi || isLoginPage) {
    return NextResponse.next();
  }

  if (isAdminPage || isAdminApi) {
    const token = request.cookies.get("vemo_admin_session")?.value || "";
    const expected = await expectedToken();

    if (!expected || !token || token !== expected) {
      if (isAdminApi) {
        return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
      }

      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = pathname.startsWith("/en") ? "/en/admin/login" : "/fr/admin/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/fr/admin/:path*",
    "/en/admin/:path*",
    "/api/admin/:path*",
  ],
};

import { NextRequest, NextResponse } from "next/server";

async function validToken(token: string) {
  const secret = process.env.VEMO_ADMIN_SECRET || "";
  const [issuedAtRaw, signature = ""] = token.split(".");
  const issuedAt = Number(issuedAtRaw);
  const age = Math.floor(Date.now() / 1000) - issuedAt;
  if (secret.length < 32 || !Number.isSafeInteger(issuedAt) || age < 0 || age > 60 * 60 * 12) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(issuedAtRaw));
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return signature === expected;
}

export async function proxy(request: NextRequest) {
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

  if (isAuthApi || isLoginPage) return NextResponse.next();

  if (isAdminPage || isAdminApi) {
    const token = request.cookies.get("vemo_admin_session")?.value || "";
    if (!token || !(await validToken(token))) {
      if (isAdminApi) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = pathname.startsWith("/en") ? "/en/admin/login" : "/fr/admin/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/fr/admin/:path*", "/en/admin/:path*", "/api/admin/:path*"],
};

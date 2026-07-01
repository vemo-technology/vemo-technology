import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const email = url.searchParams.get("email") || "";
  const lang = url.searchParams.get("lang") === "en" ? "en" : "fr";

  const fallback = lang === "fr" ? "/fr/connexion" : "/en/connexion";
  const redirectParam = url.searchParams.get("redirect") || fallback;
  const safeRedirect = redirectParam.startsWith("/") ? redirectParam : fallback;

  const res = NextResponse.redirect(new URL(safeRedirect, url.origin));

  res.cookies.set("vemo_client_verified", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  if (email) {
    res.cookies.set("vemo_client_email", email, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return res;
}

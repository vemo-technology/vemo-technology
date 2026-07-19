import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "fr";
  return NextResponse.redirect(new URL(`/${lang}/connexion`, request.url), 303);
}

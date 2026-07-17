import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const referer = request.headers.get("referer") || "";
  const isEnglish = /\/en(?:\/|$)/i.test(referer);

  const target = isEnglish
    ? "/en/start?payment=transfer&legacy=1"
    : "/fr/commencer?payment=transfer&legacy=1";

  return NextResponse.redirect(new URL(target, request.url), 303);
}

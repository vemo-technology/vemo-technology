import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);

  if (auth.ok === false) {
    const status = auth.response.status >= 500 ? auth.response.status : 200;

    return NextResponse.json(
      { ok: false },
      { status }
    );
  }

  return NextResponse.json({ ok: true });
}

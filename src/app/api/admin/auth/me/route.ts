import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const auth = await verifyAdminRequest(request);

  if (auth.ok === false) {
    return auth.response;
  }

  return NextResponse.json({
    ok: true,
    admin: true,
  });
}

import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const adminCheck = await verifyAdminRequest(request);

  if (adminCheck.ok === false) {
    return adminCheck.response;
  }

  return NextResponse.json({
    ok: true,
    email: adminCheck.email,
  });
}

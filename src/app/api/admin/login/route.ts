import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Legacy admin login disabled." }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: "Use /api/admin/auth/login." }, { status: 410 });
}

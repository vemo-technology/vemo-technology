import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Legacy payment flow disabled. Use /api/llc/checkout." }, { status: 410 });
}

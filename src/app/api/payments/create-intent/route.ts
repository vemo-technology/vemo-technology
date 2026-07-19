import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Legacy client-priced payment endpoint disabled. Use /api/llc/checkout." },
    { status: 410 },
  );
}

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Legacy bank-transfer flow disabled. Use the LLC order flow." },
    { status: 410 }
  );
}

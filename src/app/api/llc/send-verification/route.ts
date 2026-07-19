import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Legacy verification flow disabled." },
    { status: 410 }
  );
}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Stripe sends the receipt to the verified payment email." },
    { status: 410 }
  );
}

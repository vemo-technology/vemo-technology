import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Client-side payment marking is disabled. Stripe webhooks confirm payments." }, { status: 410 });
}

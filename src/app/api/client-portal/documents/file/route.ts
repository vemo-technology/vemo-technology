import { NextResponse } from "next/server";

function disabled() {
  return NextResponse.json({ error: "Legacy client endpoint disabled. Use the authenticated consolidated order API." }, { status: 410 });
}

export const GET = disabled;
export const POST = disabled;

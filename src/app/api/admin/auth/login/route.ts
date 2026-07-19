import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createPasswordSessionToken } from "@/lib/adminAuth";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/requestSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminConfiguration() {
  const password = process.env.VEMO_ADMIN_PASSWORD || "";
  const secret = process.env.VEMO_ADMIN_SECRET || "";

  if (!password || secret.length < 32) return null;

  return {
    password,
    token: createPasswordSessionToken(),
  };
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) return false;

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(request: NextRequest) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;
  const rateError = enforceRateLimit(request, "admin-login", 8, 15 * 60 * 1000);
  if (rateError) return rateError;
  const configuration = adminConfiguration();

  if (!configuration) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_AUTH_CONFIG_MISSING" },
      { status: 500 }
    );
  }

  if (!configuration.token) {
    return NextResponse.json({ ok: false, error: "ADMIN_AUTH_CONFIG_MISSING" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const password = String(body.password || "");

  if (!password || !safeEqual(password, configuration.password)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_PASSWORD" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set("vemo_admin_session", configuration.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}

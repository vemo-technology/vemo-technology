import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

type AdminOk = {
  ok: true;
  email: string;
  user: any;
};

type AdminFail = {
  ok: false;
  response: NextResponse;
};

const ADMIN_COOKIE_NAME = "vemo_admin_session";

function getAdminSecret() {
  const secret = process.env.VEMO_ADMIN_SECRET || "";
  return secret;
}

function hasValidPasswordSession(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(ADMIN_COOKIE_NAME.length + 1);

  return verifyPasswordSessionToken(token || "");
}

export function createPasswordSessionToken(now = Date.now()) {
  const secret = getAdminSecret();
  if (secret.length < 32) return "";
  const issuedAt = Math.floor(now / 1000).toString();
  const signature = crypto.createHmac("sha256", secret).update(issuedAt).digest("base64url");
  return `${issuedAt}.${signature}`;
}

export function verifyPasswordSessionToken(token: string, now = Date.now()) {
  const secret = getAdminSecret();
  const [issuedAtRaw, signature = ""] = token.split(".");
  const issuedAt = Number(issuedAtRaw);
  const age = Math.floor(now / 1000) - issuedAt;
  if (secret.length < 32 || !Number.isSafeInteger(issuedAt) || age < 0 || age > 60 * 60 * 12) return false;
  const expected = crypto.createHmac("sha256", secret).update(issuedAtRaw).digest("base64url");
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";

  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return "";
}

function getAllowedAdminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function verifyAdminRequest(
  request: Request
): Promise<AdminOk | AdminFail> {
  if (hasValidPasswordSession(request)) {
    return {
      ok: true,
      email: "password-admin",
      user: null,
    };
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Configuration Supabase admin manquante : NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 }
      ),
    };
  }

  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Session admin manquante." },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Session admin invalide ou expirée." },
        { status: 401 }
      ),
    };
  }

  const email = user.email.trim().toLowerCase();
  const allowedEmails = getAllowedAdminEmails();

  if (!allowedEmails.includes(email)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Accès admin refusé.",
          email,
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    email,
    user,
  };
}

/**
 * Compatibilité avec les anciennes routes /api/admin/auth/login et logout.
 * La sécurité principale admin utilise maintenant Supabase Bearer token.
 */
export function createAdminSessionToken(email: string) {
  const payload = {
    email: email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  };

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function setAdminCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

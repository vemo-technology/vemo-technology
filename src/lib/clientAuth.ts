import { createClient, type User } from "@supabase/supabase-js";

type ClientAuthResult =
  | { ok: true; user: User; email: string; accessToken: string }
  | { ok: false; status: 401 | 500; error: string };

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

export async function verifyClientRequest(request: Request): Promise<ClientAuthResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const accessToken = bearerToken(request);

  if (!url || !anonKey) {
    return { ok: false, status: 500, error: "Supabase authentication is not configured." };
  }

  if (!accessToken) {
    return { ok: false, status: 401, error: "Authentication required." };
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(accessToken);
  const email = String(data.user?.email || "").trim().toLowerCase();

  if (error || !data.user || !email) {
    return { ok: false, status: 401, error: "Invalid or expired session." };
  }

  return { ok: true, user: data.user, email, accessToken };
}

export function isOwnEmail(authenticatedEmail: string, requestedEmail: unknown) {
  return authenticatedEmail === String(requestedEmail || "").trim().toLowerCase();
}

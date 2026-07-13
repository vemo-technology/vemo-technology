"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseBrowser";

export default function EnglishLoginPage() {
  const router = useRouter();
  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    try {
      setLoading(true);
      setMessage("");

      const supabase = createBrowserSupabaseClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        throw error;
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (data.session?.access_token) {
        await fetch("/api/client-portal/mark-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ email: normalizedEmail }),
        }).catch(() => null);
      }

      router.push(`/en/client-portal?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "";
      setMessage(
        rawMessage.toLowerCase().includes("fetch failed")
          ? "Unable to reach the authentication service. Please try again."
          : rawMessage || "Email or password is incorrect."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7fa] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6">
          <a href="/en" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br  to-[#0f2a4f] text-xl font-black text-white">
              V
            </div>

            <div>
              <p className="text-2xl font-black tracking-[-0.04em]">
                Vemo Technology
              </p>
              <p className="-mt-1 text-xs font-bold text-slate-500">
                US LLC for non-residents
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-black lg:flex">
            <a href="/en" className="text-slate-950">Home</a>
            <a href="/en#pricing" className="text-slate-950">Pricing</a>
            <a href="/en#faq" className="text-slate-950">FAQ</a>
            <a href="/en#contact" className="text-slate-950">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex rounded-2xl border border-slate-200 bg-white p-1">
              <a href="/fr/connexion" className="rounded-xl px-3 py-2 text-xs font-black text-slate-700">
                FR
              </a>
              <a href="/en/connexion" className="rounded-xl bg-[#F15A24] px-3 py-2 text-xs font-black text-white">
                EN
              </a>
            </div>

            <a
              href="/en/commencer"
              className="rounded-2xl bg-[#F15A24] px-6 py-3 text-sm font-black text-white"
            >
              Start →
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-xl items-center px-6 py-16">
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F15A24]">
            Client sign in
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950">
            Access your client portal.
          </h1>

          <p className="mt-4 text-sm font-semibold leading-7 text-slate-500">
            Use the same email and password in French or English.
          </p>

          <div className="mt-8 grid gap-5">
            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">
                Email
              </span>
              <input
                type="email"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold outline-none focus:border-[#F15A24]/10"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@domain.com"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">
                Password
              </span>
              <input
                type="password"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold outline-none focus:border-[#F15A24]/10"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") login();
                }}
                placeholder="Your password"
              />
            </label>

            <button
              type="button"
              onClick={login}
              disabled={loading}
              className="rounded-2xl bg-[#F15A24] px-6 py-4 text-sm font-black text-white disabled:bg-slate-300"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl bg-red-50 p-5 text-sm font-bold leading-7 text-red-700">
              {message}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

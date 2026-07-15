"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

function emailIsValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

export default function ClientLoginPage() {
  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function login() {
    setError("");
    setMessage("");

    if (!emailIsValid(email)) {
      setError("Email invalide.");
      return;
    }

    if (!password) {
      setError("Mot de passe obligatoire.");
      return;
    }

    const supabase = getSupabase();

    if (!supabase) {
      setError("Configuration Supabase manquante.");
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        const msg = String(error.message || "").toLowerCase();

        if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
          setError("Merci de confirmer votre email avant de vous connecter.");
          return;
        }

        setError("Email ou mot de passe incorrect.");
        return;
      }

      const user = data?.user;

      if (!user?.email_confirmed_at && !user?.confirmed_at) {
        await supabase.auth.signOut();
        setError("Merci de confirmer votre email avant de vous connecter.");
        return;
      }

      await fetch("/api/client-portal/mark-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token || ""}`,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      }).catch(() => null);

      window.location.href = `/fr/espace-client?email=${encodeURIComponent(email.trim().toLowerCase())}`;
    } catch (e: any) {
      const message = String(e?.message || "");
      setError(
        message.toLowerCase().includes("fetch failed")
          ? "Impossible de joindre le service d’authentification. Réessayez dans quelques instants."
          : message || "Erreur de connexion."
      );
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    setError("");
    setMessage("");

    if (!emailIsValid(email)) {
      setError("Renseigne d’abord ton email.");
      return;
    }

    setResending(true);

    try {
      const res = await fetch("/api/client-portal/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.ok === false) {
        setError(data?.error || "Impossible de renvoyer l’email.");
        return;
      }

      setMessage("Email de confirmation renvoyé.");
    } catch (e: any) {
      setError(e?.message || "Erreur pendant l’envoi.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F8FB] px-6 py-10 text-[#111827]">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] border border-[#E6EDF5] bg-white p-8">
            <a href="/fr" className="inline-flex flex-col">
              <div className="text-[30px] font-black uppercase leading-none tracking-[-0.06em]">
                <span className="text-[#123A63]">VEMO</span>
                <span className="text-[#F15A24]">TECH</span>
              </div>
              <div className="mt-2 text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                US LLC POUR NON-RÉSIDENTS
              </div>
            </a>

            <p className="mt-10 text-[12px] font-black uppercase tracking-[0.18em] text-[#F15A24]">
              Espace client
            </p>

            <h1 className="mt-3 text-[46px] font-black leading-tight tracking-[-0.07em] text-[#111827]">
              Connectez-vous à votre dossier
            </h1>

            <p className="mt-5 max-w-xl text-[16px] font-semibold leading-8 text-slate-600">
              Suivez votre paiement, vos documents, vos messages et l’avancement de votre création LLC.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {["Paiement", "Dossier", "Documents"].map((item) => (
                <div key={item} className="rounded-[1.3rem] border border-[#E6EDF5] bg-[#F8FAFC] p-5">
                  <p className="text-sm font-black text-[#123A63]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#E6EDF5] bg-white p-8">
            <h2 className="text-[32px] font-black tracking-[-0.06em] text-[#111827]">
              Se connecter
            </h2>

            <div className="mt-7 space-y-4">
              <label className="block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Email
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domaine.com"
                  className="h-[54px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-bold text-[#123A63] outline-none transition focus:border-[#F15A24]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Mot de passe
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="h-[54px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-bold text-[#123A63] outline-none transition focus:border-[#F15A24]"
                />
              </label>
            </div>

            {error ? (
              <div className="mt-5 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="mt-5 rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                {message}
              </div>
            ) : null}

            
            <div className="flex justify-end">
              <a
                href="/fr/mot-de-passe-oublie"
                className="text-sm font-black text-[#F15A24] transition hover:text-[#DB4F1C]"
              >
                Mot de passe oublié ?
              </a>
            </div>

<button
              type="button"
              onClick={login}
              disabled={busy}
              className="mt-6 h-[56px] w-full rounded-[18px] bg-[#F15A24] text-sm font-black text-white transition hover:bg-[#DB4F1C] disabled:opacity-60"
            >
              {busy ? "Connexion..." : "Se connecter"}
            </button>

            <button
              type="button"
              onClick={resendConfirmation}
              disabled={resending}
              className="mt-4 h-[52px] w-full rounded-[18px] border border-[#E6EDF5] bg-white text-sm font-black text-[#123A63] transition hover:border-[#F15A24] disabled:opacity-60"
            >
              {resending ? "Envoi..." : "Renvoyer l’email de confirmation"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

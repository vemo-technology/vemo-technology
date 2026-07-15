"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !key) return null;

  return createClient(url, key);
}

export default function ResetPasswordPage() {
  const supabase = useMemo(() => supabaseClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setMessage("Configuration Supabase manquante.");
      return;
    }

    let active = true;

    async function initializeRecovery() {
      const code = new URL(window.location.href).searchParams.get("code");

      if (code) {
        const { error } = await supabase!.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) setMessage("Lien de réinitialisation invalide ou expiré.");
          return;
        }
      }

      const { data } = await supabase!.auth.getSession();
      if (active) {
        setSessionReady(Boolean(data.session));
        if (!data.session) {
          setMessage("Ouvrez cette page depuis le lien reçu par email.");
        }
      }
    }

    void initializeRecovery();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function updatePassword() {
    setMessage("");

    if (password.length < 8) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    if (!supabase) {
      setMessage("Configuration Supabase manquante.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(error.message || "Erreur pendant la réinitialisation.");
        return;
      }

      setMessage("Mot de passe réinitialisé. Tu peux maintenant te connecter.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#111827]">
      <section className="mx-auto flex min-h-screen max-w-[560px] items-center px-6 py-10">
        <div className="w-full rounded-[2rem] bg-white p-7">
          <div className="text-[30px] font-black uppercase leading-none tracking-[-0.06em]">
            <span className="text-[#123A63]">VEMO</span>
            <span className="text-[#F15A24]">TECH</span>
          </div>

          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.30em] text-slate-400">
            Espace client
          </p>

          <h1 className="mt-8 text-[34px] font-black tracking-[-0.06em]">
            Nouveau mot de passe
          </h1>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Choisis un nouveau mot de passe pour accéder à ton espace client.
          </p>

          <div className="mt-6 space-y-4">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Nouveau mot de passe"
              className="h-[54px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-bold text-[#123A63] outline-none focus:border-[#F15A24]"
            />

            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Confirmer le mot de passe"
              className="h-[54px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-bold text-[#123A63] outline-none focus:border-[#F15A24]"
            />

            <button
              type="button"
              onClick={updatePassword}
              disabled={loading || !sessionReady}
              className="h-[54px] w-full rounded-[16px] bg-[#F15A24] text-sm font-black text-white transition hover:bg-[#DB4F1C] disabled:opacity-60"
            >
              {loading ? "Mise à jour..." : "Réinitialiser"}
            </button>

            {message ? (
              <div className="rounded-[16px] border border-[#E6EDF5] bg-[#F8FAFC] px-4 py-3 text-sm font-black text-[#123A63]">
                {message}
              </div>
            ) : null}

            <a
              href="/fr/connexion"
              className="inline-flex h-[50px] w-full items-center justify-center rounded-[16px] border border-[#E6EDF5] bg-white text-sm font-black text-[#123A63] transition hover:border-[#F15A24]"
            >
              Retour connexion
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

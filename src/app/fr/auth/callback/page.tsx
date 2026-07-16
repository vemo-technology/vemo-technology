"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/SiteChrome";

function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Confirmation de votre email...");

  useEffect(() => {
    async function run() {
      try {
        const supabase = getSupabaseBrowser();

        if (!supabase) {
          setMessage("Configuration Supabase manquante.");
          return;
        }

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const requestedNext = url.searchParams.get("next");
        const next =
          requestedNext &&
          requestedNext.startsWith("/fr/") &&
          !requestedNext.startsWith("//")
            ? requestedNext
            : "/fr/espace-client";

        let email = "";
        let accessToken = "";

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            setMessage(`Confirmation impossible : ${error.message}`);
            return;
          }

          email = data?.session?.user?.email || "";
          accessToken = data?.session?.access_token || "";
        } else {
          const { data } = await supabase.auth.getSession();
          email = data?.session?.user?.email || "";
          accessToken = data?.session?.access_token || "";
        }

        if (!email) {
          setMessage("Email confirmé. Connectez-vous pour accéder à votre espace client.");
          window.setTimeout(() => {
            window.location.href = "/fr/connexion";
          }, 1400);
          return;
        }

        await fetch("/api/client-portal/mark-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            email,
          }),
        }).catch(() => null);

        setMessage("Email confirmé. Redirection vers votre espace client...");

        window.setTimeout(() => {
          const destination = new URL(next, window.location.origin);
          destination.searchParams.set("email", email);
          window.location.href = `${destination.pathname}${destination.search}${destination.hash}`;
        }, 900);
      } catch (error: any) {
        setMessage(error?.message || "Erreur pendant la confirmation email.");
      }
    }

    run();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader lang="fr" />

      <section className="px-6 py-24">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-[#E8E2DC] bg-white p-8 text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F15A24]">
            Confirmation email
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#111827]">
            {message}
          </h1>
        </div>
      </section>
    </main>
  );
}

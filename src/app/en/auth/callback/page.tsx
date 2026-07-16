"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseBrowser";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext &&
    requestedNext.startsWith("/en/") &&
    !requestedNext.startsWith("//")
      ? requestedNext
      : "/en/client-portal";
  const [message, setMessage] = useState("Confirming your account...");

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createBrowserSupabaseClient();
        const code = searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data } = await supabase.auth.getSession();
        const email = data.session?.user?.email || "";

        if (data.session?.access_token) {
          await fetch("/api/client-portal/mark-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.session.access_token}`,
            },
            body: JSON.stringify({ email }),
          });
        }

        setMessage("Account confirmed. Redirecting...");
        const destination = new URL(next, window.location.origin);
        if (email) destination.searchParams.set("email", email);
        router.replace(
          `${destination.pathname}${destination.search}${destination.hash}`
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to confirm the account."
        );
      }
    }

    handleCallback();
  }, [router, searchParams, next]);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F15A24]">
            Email confirmation
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950">
            {message}
          </h1>
        </div>
      </div>
    </section>
  );
}

export default function AuthCallbackPage() {
  return (
    <main className="min-h-screen bg-[#f4f7fa] text-slate-950">
      <SiteHeader lang="en" active="start" />

      <Suspense fallback={<section className="p-10">Loading...</section>}>
        <CallbackContent />
      </Suspense>

      <SiteFooter lang="en" />
    </main>
  );
}

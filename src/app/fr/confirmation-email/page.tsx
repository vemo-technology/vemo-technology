"use client";

import { Suspense, useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

function ConfirmationEmailContent() {
  const [email, setEmail] = useState("");
  const [payment, setPayment] = useState("");
  const [mailStatus, setMailStatus] = useState("");
  const [reason, setReason] = useState("");
  const [resendError, setResendError] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") || "");
    setPayment(params.get("payment") || "");
    setMailStatus(params.get("mail") || "");
    setReason(params.get("reason") || "");
  }, []);

  const isBankPending = payment === "verification_justificatif" || payment === "bank_transfer_pending";
  const hasMailError =
    mailStatus === "signup_failed" ||
    mailStatus === "resend_failed" ||
    mailStatus === "supabase_anon_missing" ||
    resendStatus === "error";

  async function resendEmail() {
    if (!email) return;

    setResendStatus("loading");
    setResendError("");

    const res = await fetch("/api/client-portal/resend-confirmation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    }).catch(() => null);

    const data = await res?.json().catch(() => ({}));

    if (res?.ok) {
      setResendStatus("sent");
    } else {
      setResendStatus("error");
      setResendError(data?.error || "Erreur inconnue.");
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader lang="fr" />

      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#E8E2DC] bg-white p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF7F2] text-2xl">
            ✉️
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#F15A24]">
            Confirmation email
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-[#111827]">
            Vérifiez votre boîte mail
          </h1>

          <div className="mx-auto mt-6 rounded-[18px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-black text-[#123A63]">
            {email || "Votre adresse email"}
          </div>

          {isBankPending && (
            <div className="mt-6 rounded-[1.5rem] border border-[#F5D6C9] bg-[#FFF7F2] p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#F15A24]">
                Paiement en attente de vérification
              </p>
            </div>
          )}

          {hasMailError && (
            <div className="mt-6 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-left text-sm font-bold leading-7 text-red-700">
              <p className="font-black">L’email de confirmation n’a pas pu être envoyé.</p>
              <p className="mt-2 text-xs">
                Détail technique : {resendError || reason || mailStatus || "Erreur Supabase non précisée."}
              </p>
            </div>
          )}

          {resendStatus === "sent" && (
            <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-sm font-bold leading-7 text-emerald-700">
              Email de confirmation renvoyé.
            </div>
          )}

          <button
            type="button"
            onClick={resendEmail}
            disabled={!email || resendStatus === "loading"}
            className="mt-7 inline-flex rounded-[18px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white transition hover:bg-[#D94A1B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendStatus === "loading" ? "Envoi en cours..." : "Renvoyer l’email de confirmation"}
          </button>

          <div className="mt-5">
            <a href="/fr/connexion" className="text-sm font-black text-[#F15A24]">
              J’ai déjà confirmé mon email →
            </a>
          </div>
        </div>
      </section>

      <SiteFooter lang="fr" />
    </main>
  );
}

export default function ConfirmationEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationEmailContent />
    </Suspense>
  );
}

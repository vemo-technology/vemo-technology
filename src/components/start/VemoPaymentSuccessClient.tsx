"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VemoPaymentSuccessClient({ lang }: { lang: "fr" | "en" }) {
  const params = useSearchParams();
  const [sent, setSent] = useState(false);

  const sessionId = params.get("session_id") || "";
  const email = params.get("email") || "";

  const clientUrl = lang === "fr" ? "/fr/client" : "/en/client";

  const payload = useMemo(() => ({ email, lang }), [email, lang]);

  useEffect(() => {
    if (!email || sent) return;

    fetch("/api/llc/send-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).finally(() => setSent(true));
  }, [email, payload, sent]);

  return (
    <main className="vemo-payment-success">
      <section>
        <span>{lang === "fr" ? "PAIEMENT VALIDÉ" : "PAYMENT CONFIRMED"}</span>
        <h1>{lang === "fr" ? "Paiement accepté" : "Payment accepted"}</h1>
        <p>
          {lang === "fr"
            ? "Un email de confirmation vient d’être envoyé. Confirmez votre adresse email pour accéder à votre espace client."
            : "A confirmation email has just been sent. Confirm your email address to access your client portal."}
        </p>

        <div className="vemo-payment-success-actions">
          {sessionId && (
            <a href={`/api/llc/receipt?session_id=${encodeURIComponent(sessionId)}`} target="_blank" rel="noopener noreferrer">
              {lang === "fr" ? "Télécharger le reçu Stripe" : "Download Stripe receipt"}
            </a>
          )}

          <a href={clientUrl} className="primary">
            {lang === "fr" ? "J’ai confirmé mon email" : "I confirmed my email"}
          </a>
        </div>
      </section>
    </main>
  );
}

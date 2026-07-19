"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VemoPaymentSuccessClient({ lang }: { lang: "fr" | "en" }) {
  const params = useSearchParams();
  const [status, setStatus] = useState<"checking" | "confirmed" | "activation_error" | "error">("checking");
  const [error, setError] = useState("");

  const sessionId = params.get("session_id") || "";
  const clientUrl = lang === "fr" ? "/fr/connexion" : "/en/connexion";

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setError(lang === "fr" ? "Session Stripe manquante." : "Missing Stripe session.");
      return;
    }
    fetch("/api/stripe/confirm-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Payment verification failed.");
        setStatus(data.activationEmailSent ? "confirmed" : "activation_error");
      })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Payment verification failed.");
        setStatus("error");
      });
  }, [lang, sessionId]);

  if (status === "checking") {
    return <main className="vemo-payment-success"><section><h1>{lang === "fr" ? "Vérification du paiement…" : "Verifying payment…"}</h1></section></main>;
  }

  if (status === "error") {
    return <main className="vemo-payment-success"><section><h1>{lang === "fr" ? "Paiement non confirmé" : "Payment not confirmed"}</h1><p>{error}</p></section></main>;
  }

  if (status === "activation_error") {
    return (
      <main className="vemo-payment-success">
        <section>
          <span>{lang === "fr" ? "PAIEMENT VALIDÉ" : "PAYMENT CONFIRMED"}</span>
          <h1>{lang === "fr" ? "Paiement accepté" : "Payment accepted"}</h1>
          <p>
            {lang === "fr"
              ? "Votre commande est enregistrée, mais l’email d’accès n’a pas pu être envoyé. Contactez le support avec votre référence de paiement."
              : "Your order is recorded, but the access email could not be sent. Contact support with your payment reference."}
          </p>
        </section>
      </main>
    );
  }

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
          <a href={clientUrl} className="primary">
            {lang === "fr" ? "J’ai confirmé mon email" : "I confirmed my email"}
          </a>
        </div>
      </section>
    </main>
  );
}

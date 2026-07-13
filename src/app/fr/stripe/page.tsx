"use client";

import { useEffect, useState } from "react";
import { PaymentHero, VemoCard, VemoInput, VemoPaymentShell } from "@/components/VemoPaymentShell";

export default function StripePaymentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [packName, setPackName] = useState("New Mexico Standard");
  const [amount, setAmount] = useState("149");
  const [currency, setCurrency] = useState("USD");
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pack = params.get("pack");
    const amountParam = params.get("amount");
    const currencyParam = params.get("currency");
    const emailParam = params.get("email");
    const nameParam = params.get("name");

    if (pack) setPackName(pack);
    if (amountParam) setAmount(amountParam);
    if (currencyParam) setCurrency(currencyParam);
    if (emailParam) setEmail(emailParam);
    if (nameParam) setClientName(nameParam);
  }, []);

  async function startStripe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        package_name: form.get("package_name"),
        amount: form.get("amount"),
        email: form.get("email"),
        client_name: form.get("client_name"),
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      setLoading(false);
      setError(data.message || "Erreur Stripe. Vérifie STRIPE_SECRET_KEY dans .env.local.");
      return;
    }

    window.location.assign(data.url);
  }

  return (
    <VemoPaymentShell lang="fr">
      <PaymentHero
        eyebrow="Paiement carte"
        title="Paiement sécurisé"
        text="Confirmez votre pack, votre email de commande et continuez vers le paiement en ligne."
      />

      <main className="px-6 pb-20">
        <VemoCard className="mx-auto grid max-w-5xl gap-8 p-8 lg:grid-cols-[1fr_.85fr]">
          <div>
            <h2 className="text-3xl font-black text-[#123A63]">Activation rapide</h2>
            <p className="mt-4 text-base font-semibold leading-8 text-slate-600">
              Après paiement, vous serez redirigé vers la page de création ou vérification du compte client.
            </p>

            <div className="mt-8 rounded-[18px] border border-[#FFD2C2] bg-[#FFF7F1] p-6">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#F15A24]">
                Pack sélectionné
              </div>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <div className="text-2xl font-black text-[#202838]">{packName}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-500">
                    Frais de dépôt inclus
                  </div>
                </div>
                <div className="whitespace-nowrap text-4xl font-black text-[#F15A24]">
                  ${amount}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={startStripe} className="rounded-[18px] bg-[#F6F8FB] p-6">
            <div className="grid gap-4">
              <VemoInput name="client_name" required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nom complet" />
              <VemoInput name="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email de commande" />
              <VemoInput name="package_name" value={packName} onChange={(e) => setPackName(e.target.value)} placeholder="Pack" />
              <VemoInput name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant USD" />
              <input type="hidden" name="currency" value={currency} />

              {error ? (
                <div className="rounded-[14px] border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                disabled={loading}
                className="mt-2 h-13 min-h-[52px] rounded-[14px] bg-[#F15A24] text-sm font-black text-white transition hover:bg-[#D94A1B] disabled:opacity-60"
              >
                {loading ? "Redirection..." : "Payer par carte →"}
              </button>
            </div>
          </form>
        </VemoCard>
      </main>
    </VemoPaymentShell>
  );
}

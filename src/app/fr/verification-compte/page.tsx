"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

function AccountCreationContent() {
  const [email, setEmail] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [payment, setPayment] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setEmail(params.get("email") || "");
    setReceiptUrl(params.get("receipt_url") || "");
    setPayment(params.get("payment") || "");
    setStatus(params.get("status") || "");
  }, []);

  const isBankPending = payment === "verification_justificatif" || payment === "bank_transfer_pending";
  const isStripePaid =
    payment === "stripe_success" ||
    payment === "stripe" ||
    status === "paid" ||
    status === "success";

  const pageTitle = useMemo(() => {
    if (isBankPending) return "Création de compte";
    if (isStripePaid) return "Paiement confirmé";
    return "Création de compte";
  }, [isBankPending, isStripePaid]);

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader lang="fr" />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div className="inline-flex rounded-full border border-[#E8E2DC] bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#F15A24]">
              Espace client
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-[-0.06em] text-[#111827] md:text-5xl">
              {pageTitle}
            </h1>

            {isBankPending ? (
              <div className="mx-auto mt-6 max-w-2xl rounded-[1.5rem] border border-[#F5D6C9] bg-[#FFF7F2] p-5 text-left">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#F15A24]">
                  Paiement en attente de vérification
                </p>
                <p className="mt-2 text-sm font-bold leading-7 text-slate-600">
                  Votre justificatif de virement a été envoyé. Créez maintenant votre compte client.
                  Votre espace affichera le statut du paiement en attente de vérification par Vemo.
                </p>
              </div>
            ) : (
              <div className="mx-auto mt-6 max-w-2xl rounded-[1.5rem] border border-[#E8E2DC] bg-white p-5 text-left">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#F15A24]">
                  Paiement par carte confirmé
                </p>
                <p className="mt-2 text-sm font-bold leading-7 text-slate-600">
                  Téléchargez votre reçu de paiement, puis créez votre compte client pour accéder à votre espace.
                </p>

                {receiptUrl ? (
                  <a
                    href={receiptUrl}
                    target="_self"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex rounded-[16px] border border-[#F15A24] bg-white px-5 py-3 text-sm font-black text-[#F15A24] transition hover:bg-[#FFF7F2]"
                  >
                    Télécharger le reçu de paiement →
                  </a>
                ) : (
                  <div className="mt-4 rounded-[16px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-bold text-slate-500">
                    Le reçu Stripe sera disponible après confirmation complète du paiement.
                  </div>
                )}
              </div>
            )}
          </div>

          <form
            method="post"
            action="/api/client-portal/verify-account"
            className="mx-auto mt-10 max-w-2xl rounded-[2rem] border border-[#E8E2DC] bg-white p-7"
          >
            <input type="hidden" name="payment" value={payment} />
            <input type="hidden" name="status" value={isBankPending ? "pending_verification" : "paid"} />

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#123A63]">
                  Email
                </span>
                <input
                  name="client_email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@domain.com"
                  className="w-full rounded-[18px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-bold outline-none transition focus:border-[#F15A24]/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#123A63]">
                  Mot de passe
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Au moins 8 caractères"
                  className="w-full rounded-[18px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-bold outline-none transition focus:border-[#F15A24]/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#123A63]">
                  Confirmation du mot de passe
                </span>
                <input
                  name="password_confirm"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Confirmer le mot de passe"
                  className="w-full rounded-[18px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-bold outline-none transition focus:border-[#F15A24]/10"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-[18px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white transition hover:bg-[#D94A1B]"
            >
              Créer mon compte et accéder à l’espace client →
            </button>

            <p className="mt-4 text-center text-xs font-bold leading-6 text-slate-500">
              Votre email sera utilisé comme identifiant de connexion à l’espace client.
            </p>
          </form>
        </div>
      </section>

      <SiteFooter lang="fr" />
    </main>
  );
}

export default function VerificationComptePage() {
  return (
    <Suspense fallback={null}>
      <AccountCreationContent />
    </Suspense>
  );
}

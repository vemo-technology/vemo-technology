"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Locale = "fr" | "en";

type Props = {
  locale: Locale;
  email: string;
  companyName: string;
  fullName: string;
  stateName: string;
};

const copy = {
  fr: {
    back: "← Retour",
    steps: ["Commande", "Contact", "Société", "Propriétaire", "Validation", "Paiement"],
    stepLabel: "Étape paiement",
    title: "Paiement sécurisé",
    subtitle: "Finalisez votre service EIN en choisissant votre mode de paiement. La carte bancaire est sélectionnée par défaut.",
    billingName: "Nom de facturation",
    billingEmail: "Email de facturation",
    paymentMethod: "Méthode de paiement",
    cardMethod: "Carte bancaire",
    bankMethod: "Virement bancaire",
    cardTitle: "Paiement sécurisé",
    cardSubtitle: "Saisissez les informations de facturation et votre carte directement dans cette page.",
    cardInfo: "Informations carte",
    cardBrands: "Visa, Mastercard, American Express...",
    cardNumber: "Numéro de carte",
    expiry: "MM / AA",
    cvc: "CVC",
    pay: "Payer $29",
    bankTitle: "Envoi du justificatif",
    bankSubtitle: "Contactez VEMO sur WhatsApp puis envoyez le justificatif. Votre dossier passera ensuite en attente de vérification.",
    whatsapp: "WhatsApp",
    bankStep1: "Contacter VEMO",
    bankStep2: "Uploader justificatif",
    bankStep3: "Vérification admin",
    upload: "Uploader le justificatif et continuer →",
    summary: "Résumé",
    summarySub: "Votre service EIN",
    company: "Société",
    service: "Service",
    amount: "Montant",
    total: "Total estimé",
    note: "Le dossier EIN sera disponible dans l’espace client après création du compte et vérification du paiement.",
    serviceName: "EIN seul",
    defaultCompany: "Votre société LLC",
  },
  en: {
    back: "← Back",
    steps: ["Order", "Contact", "Company", "Owner", "Review", "Payment"],
    stepLabel: "Payment step",
    title: "Secure payment",
    subtitle: "Finalize your EIN service by choosing your payment method. Card payment is selected by default.",
    billingName: "Billing name",
    billingEmail: "Billing email",
    paymentMethod: "Payment method",
    cardMethod: "Card payment",
    bankMethod: "Bank transfer",
    cardTitle: "Secure payment",
    cardSubtitle: "Enter billing details and card information directly on this page.",
    cardInfo: "Card information",
    cardBrands: "Visa, Mastercard, American Express...",
    cardNumber: "Card number",
    expiry: "MM / YY",
    cvc: "CVC",
    pay: "Pay $29",
    bankTitle: "Send payment proof",
    bankSubtitle: "Contact VEMO on WhatsApp and upload proof. Your file will then wait for admin verification.",
    whatsapp: "WhatsApp",
    bankStep1: "Contact VEMO",
    bankStep2: "Upload proof",
    bankStep3: "Admin review",
    upload: "Upload proof and continue →",
    summary: "Summary",
    summarySub: "Your EIN service",
    company: "Company",
    service: "Service",
    amount: "Amount",
    total: "Estimated total",
    note: "The EIN file will be available in the client portal after account creation and payment review.",
    serviceName: "EIN only",
    defaultCompany: "Your LLC company",
  },
};

export default function EinPaymentLikeLlc({
  locale,
  email,
  companyName,
  fullName,
  stateName,
}: Props) {
  const t = copy[locale];
  const [method, setMethod] = useState<"card" | "bank">("card");

  const cleanCompanyName = companyName || t.defaultCompany;
  const cleanEmail = email || "facturation@domaine.com";
  const cleanName = fullName || cleanCompanyName;

  const accountUrl = useMemo(() => {
    const query = new URLSearchParams({
      email,
      companyName: cleanCompanyName,
      payment: method,
      service: "ein",
      amount: "29",
    });

    return `/${locale}/ein-account?${query.toString()}`;
  }, [locale, email, cleanCompanyName, method]);

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#111827]">
      <header className="border-b border-[#E6EDF5] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href={`/${locale}`} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F15A24] text-sm font-black text-white">
              V
            </span>
            <span>
              <span className="block text-lg font-black text-[#123A63]">
                VEMO<span className="text-[#F15A24]">TECH</span>
              </span>
              <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                {locale === "fr" ? "US LLC pour non-résidents" : "US LLC for non-residents"}
              </span>
            </span>
          </Link>

          <Link
            href={`/${locale}/order-ein`}
            className="rounded-[14px] border border-[#E6EDF5] bg-white px-4 py-3 text-sm font-black text-[#123A63] hover:border-[#F15A24] hover:text-[#F15A24]"
          >
            {t.back}
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-2 md:grid-cols-6">
          {t.steps.map((item, index) => (
            <div
              key={item}
              className={[
                "rounded-[14px] border bg-white p-3",
                index === 5
                  ? "border-[#F15A24] text-[#F15A24]"
                  : "border-[#E6EDF5] text-[#123A63]",
              ].join(" ")}
            >
              <p className="text-[9px] font-black">{String(index + 1).padStart(2, "0")}</p>
              <p className="mt-1 text-[11px] font-black">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.7fr]">
          <div className="rounded-[28px] border border-[#E6EDF5] bg-white p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#F15A24]">
                  {t.stepLabel}
                </p>
                <h1 className="mt-3 text-[38px] font-black tracking-[-0.06em] text-[#111827]">
                  {t.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-slate-500">
                  {t.subtitle}
                </p>
              </div>

              <div className="rounded-[18px] border border-[#E6EDF5] bg-white px-5 py-4 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Total
                </p>
                <p className="text-3xl font-black text-[#F15A24]">$29</p>
              </div>
            </div>

            <div className="mt-8 rounded-[24px] border border-[#E6EDF5] bg-white p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    {t.billingName}
                  </span>
                  <input
                    defaultValue={cleanName}
                    className="rounded-[14px] border border-[#E6EDF5] bg-white px-4 py-4 text-sm font-bold text-[#123A63] outline-none focus:border-[#F15A24]"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    {t.billingEmail}
                  </span>
                  <input
                    defaultValue={cleanEmail}
                    className="rounded-[14px] border border-[#E6EDF5] bg-white px-4 py-4 text-sm font-bold text-[#123A63] outline-none focus:border-[#F15A24]"
                  />
                </label>
              </div>

              <label className="mt-5 grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  {t.paymentMethod}
                </span>
                <select
                  value={method}
                  onChange={(event) => setMethod(event.target.value as "card" | "bank")}
                  className="rounded-[14px] border border-[#E6EDF5] bg-white px-4 py-4 text-sm font-black text-[#123A63] outline-none focus:border-[#F15A24]"
                >
                  <option value="card">{t.cardMethod}</option>
                  <option value="bank">{t.bankMethod}</option>
                </select>
              </label>

              {method === "card" ? (
                <div className="mt-6 rounded-[22px] border border-[#E6EDF5] bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#F15A24]">
                        {locale === "fr" ? "Paiement par carte" : "Card payment"}
                      </p>
                      <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#123A63]">
                        {t.cardTitle}
                      </h2>
                      <p className="mt-3 max-w-xl text-sm font-bold leading-7 text-slate-500">
                        {t.cardSubtitle}
                      </p>
                    </div>

                    <div className="rounded-[16px] border border-[#E6EDF5] bg-white px-4 py-3 text-right">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Montant
                      </p>
                      <p className="text-2xl font-black text-[#F15A24]">$29</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[22px] border border-[#E6EDF5] bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F15A24]">
                          Stripe Checkout
                        </p>
                        <p className="mt-2 text-sm font-black text-[#123A63]">
                          {t.cardBrands}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-[9px] border border-[#E6EDF5] bg-white px-2.5 py-1.5 text-[10px] font-black text-[#123A63]">
                          VISA
                        </span>
                        <span className="rounded-[9px] border border-[#E6EDF5] bg-white px-2.5 py-1.5 text-[10px] font-black text-[#123A63]">
                          MC
                        </span>
                        <span className="rounded-[9px] border border-[#E6EDF5] bg-white px-2.5 py-1.5 text-[10px] font-black text-[#123A63]">
                          AMEX
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[20px] border border-[#E6EDF5] bg-white p-4">
                      <label className="grid gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          {t.cardNumber}
                        </span>
                        <div className="flex items-center gap-3 rounded-[16px] border border-[#E6EDF5] bg-white px-4 py-4 focus-within:border-[#F15A24]">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[#E6EDF5] bg-white text-sm">
                            💳
                          </span>
                          <input
                            inputMode="numeric"
                            placeholder="4242 4242 4242 4242"
                            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#123A63] outline-none placeholder:text-slate-400"
                          />
                        </div>
                      </label>

                      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
                        <label className="grid gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            {t.expiry}
                          </span>
                          <input
                            inputMode="numeric"
                            placeholder={locale === "fr" ? "MM / AA" : "MM / YY"}
                            className="rounded-[16px] border border-[#E6EDF5] bg-white px-4 py-4 text-sm font-bold text-[#123A63] outline-none placeholder:text-slate-400 focus:border-[#F15A24]"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            {t.cvc}
                          </span>
                          <input
                            inputMode="numeric"
                            placeholder="123"
                            className="rounded-[16px] border border-[#E6EDF5] bg-white px-4 py-4 text-sm font-bold text-[#123A63] outline-none placeholder:text-slate-400 focus:border-[#F15A24]"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[18px] border border-[#E6EDF5] bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            {locale === "fr" ? "Paiement sécurisé par Stripe" : "Secured by Stripe"}
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-500">
                            {locale === "fr"
                              ? "Le module réel Stripe sera connecté avec les clés Stripe."
                              : "The real Stripe module will be connected using Stripe keys."}
                          </p>
                        </div>

                        <span className="rounded-[12px] bg-[#F15A24] px-3 py-2 text-xs font-black text-white">
                          SSL
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={accountUrl}
                    className="mt-6 flex justify-center rounded-[16px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white hover:bg-[#DB4F1C]"
                  >
                    {t.pay}
                  </Link>
                </div>
              ) : (
                <div className="mt-6 rounded-[22px] border border-[#E6EDF5] bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#F15A24]">
                        {locale === "fr" ? "Paiement par virement" : "Bank transfer"}
                      </p>
                      <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#123A63]">
                        {t.bankTitle}
                      </h2>
                      <p className="mt-3 max-w-xl text-sm font-bold leading-7 text-slate-500">
                        {t.bankSubtitle}
                      </p>
                    </div>

                    <a
                      href="https://wa.me/212708069471"
                      target="_self"
                      rel="noopener noreferrer"
                      className="rounded-[14px] bg-[#F15A24] px-5 py-3 text-sm font-black text-white hover:bg-[#DB4F1C]"
                    >
                      {t.whatsapp}
                    </a>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {[t.bankStep1, t.bankStep2, t.bankStep3].map((item, index) => (
                      <div key={item} className="rounded-[14px] border border-[#E6EDF5] bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          {locale === "fr" ? "Étape" : "Step"} {String(index + 1).padStart(2, "0")}
                        </p>
                        <p className="mt-2 text-sm font-black text-[#123A63]">{item}</p>
                      </div>
                    ))}
                  </div>

                  <label className="mt-5 block">
                    <input
                      type="file"
                      className="block w-full cursor-pointer rounded-[14px] border border-[#E6EDF5] bg-white px-4 py-4 text-sm font-bold text-[#123A63] file:mr-4 file:rounded-[12px] file:border-0 file:bg-[#F15A24] file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                    />
                  </label>

                  <Link
                    href={accountUrl}
                    className="mt-6 flex justify-center rounded-[16px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white hover:bg-[#DB4F1C]"
                  >
                    {t.upload}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-[28px] border border-[#E6EDF5] bg-white p-7">
            <h2 className="text-3xl font-black tracking-[-0.06em] text-[#111827]">
              {t.summary}
            </h2>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              {t.summarySub}
            </p>

            <div className="mt-5 h-2 rounded-full bg-[#F15A24]" />

            <div className="mt-6 space-y-4 text-sm font-bold text-[#123A63]">
              <div className="flex justify-between gap-4">
                <span>{t.company}</span>
                <span className="text-right">{cleanCompanyName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>État</span>
                <span>{stateName || "-"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>{t.service}</span>
                <span>{t.serviceName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>{t.amount}</span>
                <span>$29</span>
              </div>
            </div>

            <div className="mt-8 rounded-[20px] border border-[#F15A24] bg-white p-5">
              <div className="flex justify-between text-xl font-black">
                <span>{t.total}</span>
                <span className="text-[#F15A24]">$29</span>
              </div>
            </div>

            <p className="mt-5 text-xs font-bold leading-6 text-slate-500">
              {t.note}
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}

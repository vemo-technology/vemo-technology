"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  locale?: "fr" | "en";
  email?: string;
  billingName?: string;
  amount?: number;
};

export default function BankTransferProofPanel({
  locale = "fr",
  email = "",
  billingName = "",
  amount = 179,
}: Props) {
  const isFr = locale === "fr";

  const [manualEmail, setManualEmail] = useState(email || "");
  const [manualName, setManualName] = useState(billingName || "");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (email && !manualEmail) setManualEmail(email);
    if (billingName && !manualName) setManualName(billingName);
  }, [email, billingName, manualEmail, manualName]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const params = new URLSearchParams(window.location.search);
      const urlEmail = params.get("email") || "";
      const urlName = params.get("name") || "";

      if (urlEmail && !manualEmail) setManualEmail(urlEmail);
      if (urlName && !manualName) setManualName(urlName);
    } catch {}
  }, [manualEmail, manualName]);

  const whatsappUrl = useMemo(() => {
    return (
      "https://wa.me/212708069471?text=" +
      encodeURIComponent(
        isFr
          ? "Bonjour Vemo Technology, je souhaite recevoir vos coordonnées bancaires pour finaliser le paiement de mon dossier LLC."
          : "Hello Vemo Technology, I would like to receive your bank details to complete my LLC order payment."
      )
    );
  }, [isFr]);

  return (
    <div className="rounded-[2rem] border border-[#E8E2DC] bg-white p-7 shadow-[0_22px_60px_rgba(18,58,99,0.08)]">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#F15A24]">
        {isFr ? "Paiement par virement" : "Bank transfer payment"}
      </p>

      <h3 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#111827]">
        {isFr ? "Contactez-nous via WhatsApp" : "Contact Vemo on WhatsApp"}
      </h3>

      <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-slate-600">
        {isFr
          ? "Recevez nos coordonnées bancaires via WhatsApp, puis ajoutez votre justificatif de paiement pour continuer vers la création de votre compte client."
          : "Receive our bank details via WhatsApp, then upload your payment proof to continue to client account creation."}
      </p>

      <div className="mt-5 rounded-[1.5rem] border border-[#E8E2DC] bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              {isFr ? "Montant à régler" : "Amount due"}
            </p>
            <p className="mt-1 text-4xl font-black tracking-[-0.08em] text-[#F15A24]">
              ${amount}
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_self"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 rounded-[18px] border border-[#25D366]/25 bg-white px-5 py-4 text-sm font-black text-[#111827] shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(37,211,102,0.15)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white">
              <svg viewBox="0 0 32 32" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                <path d="M16.04 3.2A12.72 12.72 0 0 0 5.1 22.37L3.2 29l6.78-1.78A12.72 12.72 0 1 0 16.04 3.2Zm0 2.31a10.4 10.4 0 1 1 0 20.8 10.54 10.54 0 0 1-5.3-1.45l-.38-.23-4.02 1.05 1.08-3.91-.25-.4A10.4 10.4 0 0 1 16.04 5.51Zm-4.4 5.55c-.22 0-.58.08-.89.42-.3.34-1.17 1.14-1.17 2.78 0 1.64 1.2 3.22 1.36 3.44.17.22 2.33 3.74 5.75 5.09 2.84 1.12 3.42.9 4.04.84.62-.06 2-.82 2.28-1.61.28-.8.28-1.48.2-1.62-.08-.14-.3-.22-.64-.39-.34-.17-2-.98-2.3-1.1-.31-.11-.53-.17-.75.17-.22.34-.86 1.1-1.05 1.32-.2.22-.39.25-.73.08-.34-.17-1.44-.53-2.75-1.7-1.01-.9-1.7-2.02-1.9-2.36-.2-.34-.02-.52.15-.69.15-.15.34-.39.5-.58.17-.2.22-.34.34-.56.11-.22.06-.42-.03-.59-.08-.17-.75-1.8-1.03-2.47-.27-.65-.55-.56-.75-.57h-.64Z" />
              </svg>
            </span>
            {isFr ? "Contacter Vemo via WhatsApp" : "Contact Vemo on WhatsApp"}
            <span className="text-[#25D366]">→</span>
          </a>
        </div>

        <p className="mt-4 text-xs font-bold leading-6 text-slate-500">
          {isFr
            ? "Le numéro WhatsApp n’est pas affiché sur la page. Le message est déjà préparé."
            : "The WhatsApp number is not displayed on the page. The message is already prepared."}
        </p>
      </div>

      <form
        method="post"
        action="/api/payments/bank-transfer"
        encType="multipart/form-data"
        className="mt-5 rounded-[1.5rem] border border-[#E8E2DC] bg-white p-5"
      >
        <input type="hidden" name="lang" value={locale} />
        <input type="hidden" name="client_email" value={manualEmail} />
        <input type="hidden" name="client_name" value={manualName} />
        <input type="hidden" name="amount" value={amount} />
        <input type="hidden" name="package_name" value="New Mexico Standard" />
        <input type="hidden" name="reference" value={manualEmail ? `VEMO-${manualEmail}` : "VEMO-BANK"} />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#123A63]">
              {isFr ? "Email de commande" : "Order email"}
            </span>
            <input
              name="manual_email"
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              required
              placeholder="email@domain.com"
              className="w-full rounded-[16px] border border-[#E8E2DC] bg-white px-4 py-4 text-sm font-bold text-[#111827] outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#123A63]">
              {isFr ? "Nom de facturation" : "Billing name"}
            </span>
            <input
              name="manual_name"
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              required
              placeholder={isFr ? "Nom complet" : "Full name"}
              className="w-full rounded-[16px] border border-[#E8E2DC] bg-white px-4 py-4 text-sm font-bold text-[#111827] outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
            />
          </label>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-black text-[#123A63]">
            {isFr ? "Justificatif de virement" : "Bank transfer proof"}
          </label>

          <p className="mt-2 text-xs font-bold leading-6 text-slate-500">
            {isFr
              ? "Ajoutez le reçu ou la capture du virement. Formats acceptés : PDF, PNG, JPG, JPEG ou WEBP."
              : "Upload the receipt or payment screenshot. Accepted formats: PDF, PNG, JPG, JPEG or WEBP."}
          </p>

          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[18px] border border-dashed border-[#F15A24]/45 bg-white px-5 py-6 text-center transition hover:bg-[#FFF7F2]">
            <input
              name="proof_file"
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
            />
            <span className="text-sm font-black text-[#F15A24]">
              {isFr ? "Parcourir le justificatif" : "Browse payment proof"}
            </span>
            <span className="mt-2 text-xs font-bold text-slate-500">
              {fileName || (isFr ? "Aucun fichier sélectionné" : "No file selected")}
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="mt-5 w-full rounded-[18px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(241,90,36,.22)] transition hover:bg-[#D94A1B]"
        >
          {isFr
            ? "Valider le justificatif et créer mon compte →"
            : "Submit proof and create my account →"}
        </button>
      </form>
    </div>
  );
}

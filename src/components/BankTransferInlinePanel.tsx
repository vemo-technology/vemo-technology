"use client";

export default function BankTransferInlinePanel() {
  const whatsappUrl =
    "https://wa.me/212708069471?text=" +
    encodeURIComponent(
      "Bonjour Vemo Technology, je souhaite recevoir vos coordonnées bancaires pour finaliser le paiement de mon dossier LLC."
    );

  return (
    <div className="mt-5 rounded-[1.5rem] border border-[#E8E2DC] bg-white p-6 shadow-[0_18px_45px_rgba(18,58,99,0.06)]">
      <div className="inline-flex rounded-full border border-[#E8E2DC] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#F15A24]">
        Virement bancaire
      </div>

      <h3 className="mt-4 text-2xl font-black tracking-[-0.04em] text-[#111827]">
        WhatsApp + justificatif de paiement
      </h3>

      <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-slate-600">
        Contactez-nous via WhatsApp pour recevoir nos coordonnées bancaires, puis ajoutez votre justificatif de paiement pour continuer vers la création du compte client.
      </p>

      <a
        href={whatsappUrl}
        target="_self"
        rel="noopener noreferrer"
        className="mt-5 flex items-center justify-between rounded-[18px] border border-[#D8F3DC] bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(34,197,94,0.14)]"
      >
        <span className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_24px_rgba(37,211,102,0.25)]">
            <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
              <path d="M16.04 3.2A12.72 12.72 0 0 0 5.1 22.37L3.2 29l6.78-1.78A12.72 12.72 0 1 0 16.04 3.2Zm0 2.31a10.4 10.4 0 1 1 0 20.8 10.54 10.54 0 0 1-5.3-1.45l-.38-.23-4.02 1.05 1.08-3.91-.25-.4A10.4 10.4 0 0 1 16.04 5.51Zm-4.4 5.55c-.22 0-.58.08-.89.42-.3.34-1.17 1.14-1.17 2.78 0 1.64 1.2 3.22 1.36 3.44.17.22 2.33 3.74 5.75 5.09 2.84 1.12 3.42.9 4.04.84.62-.06 2-.82 2.28-1.61.28-.8.28-1.48.2-1.62-.08-.14-.3-.22-.64-.39-.34-.17-2-.98-2.3-1.1-.31-.11-.53-.17-.75.17-.22.34-.86 1.1-1.05 1.32-.2.22-.39.25-.73.08-.34-.17-1.44-.53-2.75-1.7-1.01-.9-1.7-2.02-1.9-2.36-.2-.34-.02-.52.15-.69.15-.15.34-.39.5-.58.17-.2.22-.34.34-.56.11-.22.06-.42-.03-.59-.08-.17-.75-1.8-1.03-2.47-.27-.65-.55-.56-.75-.57h-.64Z" />
            </svg>
          </span>

          <span>
            <span className="block text-sm font-black text-[#111827]">
              Contacter Vemo via WhatsApp
            </span>
            <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">
              Le numéro n’est pas affiché sur la page.
            </span>
          </span>
        </span>

        <span className="text-xl font-black text-[#25D366]">→</span>
      </a>

      <form
        method="post"
        action="/api/payments/bank-transfer"
        encType="multipart/form-data"
        className="mt-5 rounded-[18px] border border-[#E8E2DC] bg-white p-5"
      >
        <input type="hidden" name="lang" value="fr" />
        <input type="hidden" name="package_name" value="New Mexico Standard" />
        <input type="hidden" name="amount" value="179" />
        <input type="hidden" name="reference" value="VEMO-BANK" />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#123A63]">
              Email de commande
            </span>
            <input
              name="manual_email"
              type="email"
              required
              placeholder="email@domain.com"
              className="w-full rounded-[16px] border border-[#E8E2DC] bg-white px-4 py-4 text-sm font-bold text-[#111827] outline-none focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#123A63]">
              Nom de facturation
            </span>
            <input
              name="manual_name"
              type="text"
              required
              placeholder="Nom complet"
              className="w-full rounded-[16px] border border-[#E8E2DC] bg-white px-4 py-4 text-sm font-bold text-[#111827] outline-none focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
            />
          </label>
        </div>

        <label className="mt-5 block text-sm font-black text-[#123A63]">
          Justificatif de virement
        </label>

        <p className="mt-2 text-xs font-bold leading-6 text-slate-500">
          Ajoutez le reçu ou la capture du virement. Formats acceptés : PDF, PNG, JPG, JPEG ou WEBP.
        </p>

        <input
          name="proof_file"
          type="file"
          required
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          className="mt-4 block w-full rounded-[16px] border border-dashed border-[#F15A24]/45 bg-white p-4 text-sm font-bold text-slate-600 file:mr-4 file:rounded-[12px] file:border-0 file:bg-[#F15A24] file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
        />

        <button
          type="submit"
          className="mt-5 w-full rounded-[16px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(241,90,36,.22)] transition hover:bg-[#D94A1B]"
        >
          Valider le justificatif et créer mon compte →
        </button>
      </form>
    </div>
  );
}

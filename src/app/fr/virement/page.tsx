"use client";

import { useEffect, useState } from "react";
import { PaymentHero, VemoCard, VemoInput, VemoPaymentShell, VemoTextarea } from "@/components/VemoPaymentShell";

export default function BankTransferPage() {
  const [packName, setPackName] = useState("New Mexico Standard");
  const [amount, setAmount] = useState("149");
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pack = params.get("pack");
    const amountParam = params.get("amount");
    const emailParam = params.get("email");
    const nameParam = params.get("name");

    if (pack) setPackName(pack);
    if (amountParam) setAmount(amountParam);
    if (emailParam) setEmail(emailParam);
    if (nameParam) setClientName(nameParam);
  }, []);

  return (
    <VemoPaymentShell lang="fr">
      <PaymentHero
        eyebrow="Virement bancaire"
        title="Uploader votre justificatif de virement"
        text="Le client envoie la preuve de paiement avant de continuer vers la création ou vérification du compte client."
      />

      <main className="px-6 pb-20">
        <VemoCard className="mx-auto grid max-w-6xl gap-8 p-8 lg:grid-cols-[.9fr_1.1fr]">
          <aside>
            <div className="rounded-[18px] border border-[#FFD2C2] bg-[#FFF7F1] p-6">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#F15A24]">
                Pack sélectionné
              </div>
              <h2 className="mt-4 text-2xl font-black text-[#123A63]">{packName}</h2>
              <p className="mt-2 text-4xl font-black text-[#F15A24]">${amount}</p>
              <p className="mt-3 text-sm font-bold text-slate-600">Frais de dépôt inclus.</p>
            </div>

            <div className="mt-6 rounded-[18px] border border-[#E8E2DC] bg-white p-6">
              <h3 className="text-xl font-black text-[#202838]">Coordonnées bancaires</h3>
              <p className="mt-3 text-sm font-bold leading-7 text-slate-600">
                Contactez VEMO via WhatsApp pour recevoir les coordonnées de virement adaptées à votre dossier.
              </p>
              <a
                href="https://wa.me/212708069471"
                target="_self"
                className="mt-5 inline-flex rounded-[14px] bg-[#25D366] px-5 py-4 text-sm font-black text-white"
              >
                Contacter via WhatsApp →
              </a>
            </div>
          </aside>

          <form
            method="post"
            action="/api/payments/bank-transfer"
            encType="multipart/form-data"
            className="rounded-[20px] bg-[#F6F8FB] p-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <VemoInput name="client_name" required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nom complet" />
              <VemoInput name="client_email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email de commande" />
              <VemoInput name="package_name" value={packName} onChange={(e) => setPackName(e.target.value)} placeholder="Pack choisi" />
              <VemoInput name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant USD" />
              <VemoInput name="reference" required placeholder="Référence du virement" />
              <VemoInput name="phone" placeholder="Téléphone / WhatsApp" />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-black text-[#123A63]">
                  Justificatif de virement
                </label>
                <input
                  name="proof_file"
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="block w-full rounded-[14px] border border-dashed border-[#F15A24]/45 bg-white p-4 text-sm font-bold text-slate-600 file:mr-4 file:rounded-[10px] file:border-0 file:bg-[#F15A24] file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <VemoTextarea name="notes" placeholder="Message ou précision sur le paiement..." />
              </div>

              <input type="hidden" name="lang" value="fr" />

              <button className="md:col-span-2 min-h-[54px] rounded-[14px] bg-[#F15A24] text-sm font-black text-white">
                Envoyer le justificatif et continuer →
              </button>
            </div>
          </form>
        </VemoCard>
      </main>
    </VemoPaymentShell>
  );
}

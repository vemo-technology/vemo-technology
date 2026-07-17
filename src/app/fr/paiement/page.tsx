import Link from "next/link";
import { PaymentHero, VemoCard, VemoPaymentShell } from "@/components/VemoPaymentShell";

export default function PaymentChoicePage() {
  return (
    <VemoPaymentShell lang="fr">
      <PaymentHero
        eyebrow="Étape paiement"
        title="Choisissez votre mode de paiement"
        text="Payez par Stripe pour une activation rapide, ou par virement bancaire avec upload du justificatif avant vérification."
      />

      <main className="px-6 pb-20">
        <section className="mx-auto grid max-w-6xl gap-7 md:grid-cols-2">
          <VemoCard className="p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-white text-2xl">💳</div>
            <h2 className="mt-6 text-3xl font-black tracking-[-0.04em] text-[#123A63]">Paiement Stripe</h2>
            <p className="mt-4 text-base font-semibold leading-8 text-slate-600">
              Paiement en ligne sécurisé par carte. Après validation, vous passez directement à la création / vérification du compte client.
            </p>
            <ul className="mt-6 space-y-3 text-sm font-bold text-slate-700">
              <li>✓ Carte bancaire</li>
              <li>✓ Confirmation immédiate</li>
              <li>✓ Redirection vers vérification compte</li>
            </ul>
            <Link href="/fr/stripe" className="mt-8 inline-flex rounded-[12px] bg-[#F15A24] px-7 py-4 text-sm font-black text-white">
              Continuer avec Stripe →
            </Link>
          </VemoCard>

          <VemoCard className="p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-white text-2xl">🏦</div>
            <h2 className="mt-6 text-3xl font-black tracking-[-0.04em] text-[#123A63]">Virement bancaire</h2>
            <p className="mt-4 text-base font-semibold leading-8 text-slate-600">
              Envoyez votre preuve de virement. Votre dossier reste en attente jusqu’à validation par l’admin Vemo Technology.
            </p>
            <ul className="mt-6 space-y-3 text-sm font-bold text-slate-700">
              <li>✓ Upload justificatif</li>
              <li>✓ Référence de virement</li>
              <li>✓ Vérification admin avant activation</li>
            </ul>
            <Link href="/fr/commencer?payment=transfer" className="mt-8 inline-flex rounded-[12px] border border-[#F15A24] bg-white px-7 py-4 text-sm font-black text-[#F15A24]">
              Payer par virement →
            </Link>
          </VemoCard>
        </section>
      </main>
    </VemoPaymentShell>
  );
}

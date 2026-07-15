import Link from "next/link";

type Props = {
  searchParams?: Promise<{
    session_id?: string;
    email?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const sessionId = params?.session_id || "";
  const receiptHref = sessionId
    ? `/api/llc/receipt?session_id=${encodeURIComponent(sessionId)}`
    : "/fr/tarifs";

  return (
    <main style={{ minHeight: "100vh", background: "#F4F7FA", fontFamily: "Arial, sans-serif", color: "#0F172A" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #DDE7F2" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto", height: "86px", padding: "0 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/fr" style={{ textDecoration: "none" }}>
            <div style={{ fontSize: "25px", fontWeight: 950, letterSpacing: "-1px", color: "#123A63" }}>
              VEMO<span style={{ color: "#F15A24" }}>TECH</span>
            </div>
            <div style={{ marginTop: "5px", fontSize: "9px", letterSpacing: "7px", fontWeight: 900, color: "#7D93B4" }}>
              US LLC POUR NON-RÉSIDENTS
            </div>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "14px", fontWeight: 900 }}>
            <Link href="/fr" style={{ color: "#0F172A", textDecoration: "none" }}>Accueil</Link>
            <Link href="/fr/tarifs" style={{ color: "#0F172A", textDecoration: "none" }}>Tarifs</Link>
            <Link href="/fr/faq" style={{ color: "#0F172A", textDecoration: "none" }}>FAQ</Link>
            <Link href="/fr/contact" style={{ color: "#0F172A", textDecoration: "none" }}>Contact</Link>
          </nav>
        </div>
      </header>

      <section style={{ maxWidth: "1080px", margin: "0 auto", padding: "76px 22px 96px" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto", background: "#fff", border: "1px solid #DDE7F2", borderRadius: "32px", padding: "50px 46px", textAlign: "center" }}>
          <div style={{ width: "70px", height: "70px", margin: "0 auto 24px", borderRadius: "22px", background: "#FFF3EE", border: "1px solid #FFD7C9", display: "flex", alignItems: "center", justifyContent: "center", color: "#F15A24", fontSize: "34px", fontWeight: 950 }}>
            ✓
          </div>

          <div style={{ color: "#F15A24", fontSize: "12px", fontWeight: 950, letterSpacing: "7px", textTransform: "uppercase", marginBottom: "18px" }}>
            Paiement validé
          </div>

          <h1 style={{ margin: 0, color: "#0F172A", fontSize: "44px", lineHeight: 1.05, letterSpacing: "-1.8px" }}>
            Paiement accepté
          </h1>

          <p style={{ margin: "20px auto 0", maxWidth: "600px", color: "#5B6F91", fontSize: "17px", fontWeight: 800, lineHeight: 1.65 }}>
            Un email de confirmation vient d’être envoyé. Confirmez votre adresse email pour accéder à votre espace client.
          </p>

          <div style={{ marginTop: "34px", display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
            <a
              href={receiptHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                minHeight: "52px",
                padding: "0 22px",
                borderRadius: "16px",
                border: "1px solid #DDE7F2",
                color: "#123A63",
                background: "#fff",
                fontWeight: 950,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Télécharger le reçu Stripe
            </a>

            <Link
              href="/fr/connexion"
              style={{
                minHeight: "52px",
                padding: "0 24px",
                borderRadius: "16px",
                background: "#F15A24",
                color: "#fff",
                fontWeight: 950,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              J’ai confirmé mon email
            </Link>
          </div>

          <div style={{ marginTop: "30px", border: "1px solid #DDE7F2", borderRadius: "20px", background: "#F8FBFF", padding: "18px", color: "#123A63", fontWeight: 850, lineHeight: 1.55, textAlign: "left" }}>
            Votre dossier est maintenant enregistré. L’accès à l’espace client sera disponible après confirmation de votre email.
          </div>
        </div>
      </section>

      <footer style={{ background: "#123A63", color: "#DCE8F6", padding: "42px 22px" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "32px" }}>
          <div>
            <div style={{ fontWeight: 950, color: "#fff", fontSize: "18px" }}>VEMO</div>
            <div style={{ marginTop: "14px", color: "#F15A24", fontWeight: 950, fontSize: "20px" }}>TECH</div>
            <p style={{ marginTop: "16px", maxWidth: "260px", lineHeight: 1.6, fontWeight: 750 }}>
              Accompagnement professionnel pour créer, structurer et suivre votre LLC US à distance.
            </p>
          </div>

          <div>
            <div style={{ color: "#fff", fontWeight: 950, letterSpacing: "4px", fontSize: "12px", marginBottom: "18px" }}>NAVIGATION</div>
            <div style={{ display: "grid", gap: "12px", fontWeight: 800 }}>
              <Link href="/fr" style={{ color: "#DCE8F6", textDecoration: "none" }}>Accueil</Link>
              <Link href="/fr/tarifs" style={{ color: "#DCE8F6", textDecoration: "none" }}>Tarifs</Link>
              <Link href="/fr/faq" style={{ color: "#DCE8F6", textDecoration: "none" }}>FAQ</Link>
            </div>
          </div>

          <div>
            <div style={{ color: "#fff", fontWeight: 950, letterSpacing: "4px", fontSize: "12px", marginBottom: "18px" }}>SERVICES</div>
            <div style={{ display: "grid", gap: "12px", fontWeight: 800 }}>
              <span>LLC Formation</span>
              <span>EIN</span>
              <span>Banking Guidance</span>
            </div>
          </div>

          <div>
            <div style={{ color: "#fff", fontWeight: 950, letterSpacing: "4px", fontSize: "12px", marginBottom: "18px" }}>LÉGAL</div>
            <div style={{ display: "grid", gap: "12px", fontWeight: 800 }}>
              <span>Terms</span>
              <span>Privacy</span>
              <span>Refund Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

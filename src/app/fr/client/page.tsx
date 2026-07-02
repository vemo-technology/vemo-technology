import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<{
    sent?: string;
    email?: string;
  }>;
};

function decodeEmail(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function ClientEmailConfirmationPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const sent = params?.sent === "1";
  const email = params?.email ? decodeEmail(params.email) : "";

  const cookieStore = await cookies();
  const verified = cookieStore.get("vemo_client_verified")?.value === "1";

  if (verified && !sent) {
    redirect("/fr/connexion");
  }

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

          <Link
            href="/fr/connexion"
            style={{
              height: "44px",
              padding: "0 18px",
              borderRadius: "14px",
              border: "1px solid #DDE7F2",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#123A63",
              fontWeight: 900,
              textDecoration: "none",
              background: "#fff",
            }}
          >
            Connexion
          </Link>
        </div>
      </header>

      <section style={{ maxWidth: "1080px", margin: "0 auto", padding: "72px 22px" }}>
        <div style={{ maxWidth: "880px", margin: "0 auto", background: "#fff", border: "1px solid #DDE7F2", borderRadius: "30px", padding: "46px", overflow: "hidden" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <span style={{ width: "11px", height: "11px", borderRadius: "999px", background: "#F15A24", display: "inline-block" }} />
            <span style={{ color: "#F15A24", fontSize: "12px", fontWeight: 950, letterSpacing: "7px", textTransform: "uppercase" }}>
              Confirmation email
            </span>
          </div>

          <h1 style={{ margin: 0, fontSize: "42px", lineHeight: 1.08, letterSpacing: "-1.6px", color: "#0F172A" }}>
            Votre dossier est bien reçu.
          </h1>

          <p style={{ margin: "18px 0 0", maxWidth: "760px", color: "#5B6F91", fontSize: "17px", fontWeight: 800, lineHeight: 1.65 }}>
            Un email de confirmation vient d’être envoyé{email ? " à " : ""}
            {email ? <strong style={{ color: "#123A63" }}>{email}</strong> : null}. Confirmez votre adresse email pour activer votre compte et accéder à votre espace client.
          </p>

          <div style={{ marginTop: "30px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px" }}>
            {[
              ["01", "Dossier créé", "Votre demande a été enregistrée."],
              ["02", "Email envoyé", "Cliquez sur le lien de confirmation."],
              ["03", "Espace client", "Connectez-vous après confirmation."],
            ].map((item) => (
              <div key={item[0]} style={{ border: "1px solid #DDE7F2", borderRadius: "20px", padding: "18px", background: "#F8FBFF" }}>
                <div style={{ color: "#F15A24", fontWeight: 950, fontSize: "12px", letterSpacing: "3px" }}>{item[0]}</div>
                <div style={{ marginTop: "10px", color: "#123A63", fontWeight: 950, fontSize: "16px" }}>{item[1]}</div>
                <div style={{ marginTop: "7px", color: "#5B6F91", fontWeight: 700, fontSize: "13px", lineHeight: 1.45 }}>{item[2]}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "30px", border: "1px solid #DDE7F2", borderRadius: "22px", background: "#F8FBFF", padding: "22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "18px", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#123A63", fontWeight: 950, fontSize: "17px" }}>
                Après confirmation, vous serez redirigé vers la connexion.
              </div>
              <div style={{ marginTop: "6px", color: "#5B6F91", fontWeight: 750, fontSize: "14px", lineHeight: 1.5 }}>
                Si vous ne voyez pas l’email, vérifiez le dossier spam ou courrier indésirable.
              </div>
            </div>

            <Link
              href="/fr/connexion"
              style={{
                height: "50px",
                padding: "0 22px",
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
        </div>
      </section>
    </main>
  );
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<{
    sent?: string;
    email?: string;
  }>;
};

export default async function ClientEmailConfirmationPage({ searchParams }: Props) {
  const params = await searchParams;
  const sent = params?.sent === "1";
  const email = params?.email || "";

  const cookieStore = await cookies();
  const verified = cookieStore.get("vemo_client_verified")?.value === "1";

  if (verified && !sent) {
    redirect("/fr/connexion");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4F7FA",
        padding: "64px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: "920px",
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #DDE7F2",
          borderRadius: "24px",
          padding: "48px 42px",
        }}
      >
        <p
          style={{
            margin: "0 0 16px",
            color: "#F15A24",
            fontSize: "12px",
            fontWeight: 900,
            letterSpacing: "7px",
            textTransform: "uppercase",
          }}
        >
          Confirmation email
        </p>

        <h1
          style={{
            margin: "0 0 16px",
            color: "#0F172A",
            fontSize: "38px",
            lineHeight: 1.1,
          }}
        >
          Confirmez votre adresse email
        </h1>

        <p
          style={{
            margin: "0 0 26px",
            color: "#5B6F91",
            fontSize: "16px",
            fontWeight: 800,
            lineHeight: 1.6,
            maxWidth: "760px",
          }}
        >
          Nous venons de vous envoyer un email de confirmation
          {email ? ` à ${decodeURIComponent(email)}` : ""}. Cliquez sur le lien reçu
          pour activer votre compte.
        </p>

        <div
          style={{
            border: "1px solid #DDE7F2",
            borderRadius: "16px",
            background: "#F8FBFF",
            padding: "18px",
            color: "#123A63",
            fontWeight: 900,
          }}
        >
          Après confirmation, vous serez redirigé vers la page de connexion à votre espace client.
        </div>
      </section>
    </main>
  );
}

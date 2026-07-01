"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/vemo/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const text = await res.text();
      let data: { error?: string } = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text };
      }

      if (!res.ok) {
        setMessage(data?.error || `Erreur ${res.status}`);
        return;
      }

      setMessage("Un lien de réinitialisation vient d’être envoyé à votre adresse email.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4F7FA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#fff",
          borderRadius: "28px",
          padding: "42px 28px",
        }}
      >
        <Link href="/fr/connexion" style={{ color: "#0F172A", fontWeight: 800, textDecoration: "none" }}>
          ← Retour connexion
        </Link>

        <div style={{ marginTop: "32px", marginBottom: "32px" }}>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "#123A63" }}>
            VEMO<span style={{ color: "#F15A24" }}>TECH</span>
          </div>
          <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: 900, letterSpacing: "6px", color: "#8AA0BF" }}>
            ESPACE CLIENT
          </div>
        </div>

        <h1 style={{ margin: "0 0 16px", color: "#0F172A", fontSize: "34px", lineHeight: 1.1 }}>
          Mot de passe oublié
        </h1>

        <p style={{ margin: "0 0 26px", color: "#5B6F91", fontWeight: 800, lineHeight: 1.6 }}>
          Saisis ton email. Tu recevras un lien sécurisé pour choisir un nouveau mot de passe.
        </p>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="adresse@email.com"
          type="email"
          style={{
            width: "100%",
            boxSizing: "border-box",
            height: "54px",
            border: "1px solid #DDE7F2",
            borderRadius: "16px",
            padding: "0 16px",
            color: "#123A63",
            fontWeight: 800,
            fontSize: "15px",
            outline: "none",
          }}
        />

        <button
          onClick={submit}
          disabled={loading || !email}
          style={{
            marginTop: "16px",
            width: "100%",
            height: "54px",
            border: 0,
            borderRadius: "16px",
            background: "#F15A24",
            color: "#fff",
            fontWeight: 900,
            cursor: loading ? "default" : "pointer",
            opacity: loading || !email ? 0.65 : 1,
          }}
        >
          {loading ? "Envoi en cours..." : "Envoyer le lien"}
        </button>

        {message && (
          <div
            style={{
              marginTop: "16px",
              border: "1px solid #DDE7F2",
              borderRadius: "14px",
              padding: "14px 16px",
              color: "#123A63",
              background: "#F8FBFF",
              fontWeight: 800,
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        )}
      </section>
    </main>
  );
}

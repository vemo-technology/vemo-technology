"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

function AdminLogo() {
  return (
    <div>
      <div className="text-[24px] font-black tracking-[-0.04em]">
        <span className="text-[#123A63]">VEMO</span>
        <span className="text-[#F15A24]">TECH</span>
      </div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[0.38em] text-[#64748B]">
        ADMIN
      </div>
    </div>
  );
}

export default function AdminPasswordGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isFr = pathname.startsWith("/fr");

  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const t = useMemo(() => {
    return isFr
      ? {
          lang: "EN",
          secure: "ADMIN SÉCURISÉ",
          title: "Connexion administrateur",
          subtitle: "Entrez le mot de passe admin pour accéder à l’espace de gestion.",
          placeholder: "Mot de passe admin",
          button: "Se connecter",
          error: "Mot de passe incorrect.",
        }
      : {
          lang: "FR",
          secure: "SECURE ADMIN",
          title: "Admin login",
          subtitle: "Enter the admin password to access the management area.",
          placeholder: "Admin password",
          button: "Sign in",
          error: "Incorrect password.",
        };
  }, [isFr]);

  useEffect(() => {
    fetch("/api/admin/auth/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => setAuthenticated(result.ok === true))
      .catch(() => setAuthenticated(false))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button,a") as HTMLElement | null;

      if (!button) return;

      const text = (button.textContent || "").trim().toLowerCase();

      if (text === "se déconnecter" || text === "sign out" || text === "logout") {
        event.preventDefault();
        event.stopPropagation();

        fetch("/api/admin/auth/logout", { method: "POST" }).finally(() => {
          setAuthenticated(false);
          router.push(isFr ? "/fr/admin" : "/en/admin");
        });
      }
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [authenticated, isFr, router]);

  function switchLang() {
    if (pathname.startsWith("/fr/admin/client-portal")) {
      router.push("/en/admin/client-portal");
      return;
    }

    if (pathname.startsWith("/en/admin/client-portal")) {
      router.push("/fr/admin/client-portal");
      return;
    }

    router.push(isFr ? "/en/admin" : "/fr/admin");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      setError(t.error);
      return;
    }

    setAuthenticated(true);
    setPassword("");
    setError("");
  }

  if (!ready) {
    return <main className="min-h-screen bg-[#F3F7FB]" />;
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#F3F7FB] text-[#111827]">
        <header className="border-b border-[#E6EDF5] bg-white">
          <div className="mx-auto flex h-[86px] max-w-7xl items-center justify-between px-6">
            <AdminLogo />

            <button
              type="button"
              onClick={switchLang}
              className="rounded-[14px] border border-[#DDE7F2] bg-white px-5 py-3 text-sm font-black text-[#123A63]"
            >
              {t.lang}
            </button>
          </div>
        </header>

        <section className="mx-auto flex min-h-[calc(100vh-86px)] max-w-7xl items-center justify-center px-6 py-12">
          <form
            onSubmit={submit}
            className="w-full max-w-xl rounded-[32px] border border-[#DDE7F2] bg-white p-10"
          >
            <AdminLogo />

            <p className="mt-10 text-[10px] font-black uppercase tracking-[0.45em] text-[#F15A24]">
              {t.secure}
            </p>

            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] text-[#111827]">
              {t.title}
            </h1>

            <p className="mt-5 text-sm font-bold leading-6 text-[#64748B]">
              {t.subtitle}
            </p>

            <input
              type="password"
              autoFocus
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder={t.placeholder}
              className="mt-8 h-14 w-full rounded-[16px] border border-[#D8E2EF] bg-white px-5 text-sm font-black text-[#123A63] outline-none focus:border-[#F15A24]"
            />

            {error ? (
              <p className="mt-4 rounded-[14px] border border-[#FBD2C4] bg-[#FFF3EF] px-4 py-3 text-sm font-black text-[#F15A24]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-5 h-14 w-full rounded-[16px] bg-[#F15A24] text-sm font-black text-white transition hover:bg-[#DB4F1C]"
            >
              {t.button}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}

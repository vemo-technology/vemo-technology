"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type AdminTab = "home" | "documents" | "payments" | "messages";

type ClientAccount = {
  email: string;
  name?: string;
  company_name?: string;
  payment_status?: string;
  account_status?: string;
  portal_enabled?: boolean;
  updated_at?: string;
  created_at?: string;
};

type ClientDocument = {
  id: string;
  client_email: string;
  title?: string;
  document_type?: string;
  file_name?: string;
  file_url?: string;
  storage_path?: string;
  status?: string;
  created_at?: string;
};

type ClientMessage = {
  id: string;
  client_email: string;
  sender?: string;
  message?: string;
  created_at?: string;
};

type DashboardData = {
  clients: ClientAccount[];
  documents: ClientDocument[];
  messages: ClientMessage[];
};


function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("timeout"));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

function VemoLogo() {
  return (
    <div className="inline-flex flex-col leading-none">
      <div className="text-[28px] font-black tracking-[-0.06em] text-[#123A63]">
        VEMO <span className="text-[#F15A24]">TECH</span>
      </div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.34em] text-slate-400">
        ADMIN SPACE
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value?: string }) {
  const v = value || "non défini";

  const tone =
    v.includes("paid") || v.includes("") || v.includes("termine")
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : v.includes("pending") || v.includes("attente") || v.includes("verification")
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : v.includes("rejected") || v.includes("refus")
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tone}`}>
      {v}
    </span>
  );
}

function formatDateFR(value?: string) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function getClientDisplayName(client: ClientAccount) {
  return (
    client.company_name ||
    client.name ||
    "LLC sans nom"
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#E8E2DC] bg-white p-8 text-center">
      <p className="text-lg font-black text-[#111827]">{title}</p>
      <p className="mt-2 text-sm font-bold leading-7 text-slate-500">{text}</p>
    </div>
  );
}

export default function VemoAdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("home");
  const [authState, setAuthState] = useState<"loading" | "allowed" | "denied">("loading");
  const [data, setData] = useState<DashboardData>({ clients: [], documents: [], messages: [] });
  const [loadingData, setLoadingData] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [messageText, setMessageText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  async function loadDashboard() {
    setLoadingData(true);
    setNotice("");

    try {
      const res = await withTimeout(
        fetch("/api/admin/dashboard", {
          cache: "no-store",
        }),
        8000
      ).catch(() => null);

      const payload = await res?.json().catch(() => null);

      if (payload?.ok) {
        const clients = payload.clients || [];

        setData({
          clients,
          documents: payload.documents || [],
          messages: payload.messages || [],
        });

        const savedEmail =
          typeof window !== "undefined"
            ? window.localStorage.getItem("vemo_admin_selected_client_email")
            : "";

        if (savedEmail && clients.some((client: ClientAccount) => client.email === savedEmail)) {
          setSelectedEmail(savedEmail);
        } else if (!selectedEmail && clients?.[0]?.email) {
          setSelectedEmail("");
        }
      } else {
        setData({ clients: [], documents: [], messages: [] });
        setNotice(payload?.error || "Impossible de charger les données admin.");
      }
    } catch {
      setData({ clients: [], documents: [], messages: [] });
      setNotice("Chargement admin interrompu. Vérifiez l’API /api/admin/dashboard.");
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    async function checkAccess() {
      try {
        const supabase = getSupabaseBrowser();

        if (!supabase) {
          setAuthState("denied");
          window.location.href = "/fr/admin/connexion";
          return;
        }

        const authResult = await withTimeout(supabase.auth.getUser(), 8000).catch(() => null);
        const user = authResult?.data?.user;

        if (!user) {
          setAuthState("denied");
          window.location.href = "/fr/admin/connexion";
          return;
        }

        const email = String(user.email || "").toLowerCase();

        const role =
          user.user_metadata?.role ||
          user.user_metadata?.app_role ||
          user.app_metadata?.role ||
          user.app_metadata?.app_role ||
          "";

        const isAdmin =
          email === "contact@vemo-technology.com" ||
          role === "admin" ||
          user.user_metadata?.is_admin === true ||
          user.app_metadata?.is_admin === true;

        if (!isAdmin) {
          setAuthState("denied");
          window.location.href = "/fr/admin/connexion";
          return;
        }

        setAuthState("allowed");
        await loadDashboard();
      } catch {
        setAuthState("denied");
        window.location.href = "/fr/admin/connexion";
      }
    }

    checkAccess();
  }, []);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return data.clients;

    return data.clients.filter((client) => {
      return (
        String(client.email || "").toLowerCase().includes(q) ||
        String(client.name || "").toLowerCase().includes(q) ||
        String(client.company_name || "").toLowerCase().includes(q) ||
        String(client.payment_status || "").toLowerCase().includes(q) ||
        String(client.account_status || "").toLowerCase().includes(q)
      );
    });
  }, [data.clients, search]);

  const visibleClients = selectedEmail
    ? filteredClients.filter((client) => client.email === selectedEmail)
    : filteredClients;

  const selectedClient = data.clients.find((client) => client.email === selectedEmail);
  const selectedDocs = data.documents.filter((doc) => doc.client_email === selectedEmail);
  const selectedMessages = data.messages.filter((msg) => msg.client_email === selectedEmail);

  const stats = useMemo(() => {
    const Clients = data.clients.filter((client) => client.portal_enabled).length;
    const pendingPayments = data.clients.filter((client) =>
      String(client.payment_status || "").includes("pending")
    ).length;

    return {
      clients: data.clients.length,
      Clients,
      documents: data.documents.length,
      messages: data.messages.length,
      pendingPayments,
    };
  }, [data]);

  async function changeStatus(email: string, status: string) {
    setNotice("");

    const res = await fetch("/api/admin/dossiers/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, status }),
    }).catch(() => null);

    if (res?.ok) {
      setNotice("Statut mis à jour.");
      await loadDashboard();
    } else {
      const p = await res?.json().catch(() => ({}));
      setNotice(p?.error || "Erreur pendant la mise à jour.");
    }
  }

  async function uploadDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEmail) return;

    setUploading(true);
    setNotice("");

    const form = new FormData(event.currentTarget);
    form.set("client_email", selectedEmail);

    const res = await fetch("/api/admin/documents/upload", {
      method: "POST",
      body: form,
    }).catch(() => null);

    if (res?.ok) {
      event.currentTarget.reset();
      setNotice("Document ajouté / remplacé.");
      await loadDashboard();
    } else {
      const p = await res?.json().catch(() => ({}));
      setNotice(p?.error || "Erreur pendant l’upload.");
    }

    setUploading(false);
  }

  async function deleteDocument(doc: ClientDocument) {
    const ok = window.confirm("Supprimer ce document ?");
    if (!ok) return;

    const res = await fetch("/api/admin/documents/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: doc.id, storage_path: doc.storage_path }),
    }).catch(() => null);

    if (res?.ok) {
      setNotice("Document supprimé.");
      await loadDashboard();
    } else {
      const p = await res?.json().catch(() => ({}));
      setNotice(p?.error || "Erreur pendant la suppression.");
    }
  }

  async function sendMessage() {
    if (!selectedEmail || !messageText.trim()) return;

    setNotice("");

    const res = await fetch("/api/admin/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: selectedEmail, message: messageText }),
    }).catch(() => null);

    if (res?.ok) {
      setMessageText("");
      setNotice("Message envoyé.");
      await loadDashboard();
    } else {
      const p = await res?.json().catch(() => ({}));
      setNotice(p?.error || "Erreur pendant l’envoi.");
    }
  }

  async function signOut() {
    const supabase = getSupabaseBrowser();
    await supabase?.auth.signOut();
    window.location.href = "/fr/admin/connexion";
  }

  if (authState === "loading") {
    return (
      <main className="min-h-screen bg-[#F7FAFC] p-6">
        <div className="mx-auto mt-20 max-w-xl rounded-[2rem] border border-[#E8E2DC] bg-white p-8 text-center -[0_22px_60px_rgba(18,58,99,0.08)]">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#F15A24]">
            Vemo Admin
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#111827]">
            Chargement...
          </h1>
        </div>
      </main>
    );
  }

  if (authState === "denied") {
    return (
      <main className="min-h-screen bg-[#F7FAFC] p-6">
        <div className="mx-auto mt-20 max-w-xl rounded-[2rem] border border-[#F5D6C9] bg-white p-8 text-center -[0_22px_60px_rgba(18,58,99,0.08)]">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#F15A24]">
            Vemo Admin
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#111827]">
            Accès refusé
          </h1>
          <a
            href="/fr/admin/connexion"
            className="mt-7 inline-flex rounded-[18px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white -[0_16px_34px_rgba(241,90,36,.22)] transition hover:bg-[#D94A1B]"
          >
            Connexion admin
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7FAFC] text-[#111827]">
      <div className="grid min-h-screen lg:grid-cols-[270px_1fr]">
        <aside className="border-r border-[#E8E2DC] bg-white p-6">
          <VemoLogo />

          <nav className="mt-10 space-y-2">
            {[
              ["home", "Pilotage"],
              ["documents", "Documents"],
              ["payments", "Paiements"],
              ["messages", "Messages"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key as AdminTab)}
                className={`w-full rounded-[18px] px-5 py-4 text-left text-sm font-black transition ${
                  tab === key
                    ? "bg-[#F15A24] text-white -[0_16px_34px_rgba(241,90,36,.22)]"
                    : "bg-white text-slate-600 hover:bg-white hover:text-[#F15A24]"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <button
            onClick={signOut}
            className="mt-10 w-full rounded-[18px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-black text-[#111827] transition hover:bg-white"
          >
            Déconnexion
          </button>
        </aside>

        <section className="p-6 lg:p-10">
          <div className="rounded-[2rem] border border-[#E8E2DC] bg-white p-8 -[0_22px_60px_rgba(18,58,99,0.08)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#F15A24]">
                  Espace admin
                </p>

                <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-[#111827]">
                  Pilotage des dossiers VEMO
                </h1>

                <p className="mt-3 text-sm font-bold leading-7 text-slate-600">
                  Suivi clients, documents, paiements, messages et état des dossiers.
                </p>
              </div>

              <button
                onClick={loadDashboard}
                className="rounded-[18px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white -[0_16px_34px_rgba(241,90,36,.22)] transition hover:bg-[#D94A1B]"
              >
                Actualiser
              </button>
            </div>
          </div>

          {notice && (
            <div className="mt-5 rounded-[18px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-black text-[#123A63]">
              {notice}
            </div>
          )}

          {tab === "home" && (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="h-[86px] rounded-[1.25rem] border border-[#E8E2DC] bg-white px-6 py-3 -[0_10px_24px_rgba(18,58,99,0.04)]">
                  <p className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.12em] text-[#F15A24]">
                    Clients
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-[-0.08em] text-[#111827]">
                    {stats.clients}
                  </p>
                </div>

                <div className="h-[86px] rounded-[1.25rem] border border-[#E8E2DC] bg-white px-6 py-3 -[0_10px_24px_rgba(18,58,99,0.04)]">
                  <p className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.12em] text-[#F15A24]">
                    Comptes clients
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-[-0.08em] text-[#111827]">
                    {stats.clients}
                  </p>
                </div>

                <div className="h-[86px] rounded-[1.25rem] border border-[#E8E2DC] bg-white px-6 py-3 -[0_10px_24px_rgba(18,58,99,0.04)]">
                  <p className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.12em] text-[#F15A24]">
                    Documents
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-[-0.08em] text-[#111827]">
                    {stats.documents}
                  </p>
                </div>

                <div className="h-[86px] rounded-[1.25rem] border border-[#E8E2DC] bg-white px-6 py-3 -[0_10px_24px_rgba(18,58,99,0.04)]">
                  <p className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.12em] text-[#F15A24]">
                    Messages
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-[-0.08em] text-[#111827]">
                    {stats.messages}
                  </p>
                </div>

                <div className="h-[86px] rounded-[1.25rem] border border-[#E8E2DC] bg-white px-5 py-3 -[0_10px_24px_rgba(18,58,99,0.04)]">
                  <p className="whitespace-nowrap text-[9px] font-black uppercase tracking-[0.08em] text-[#F15A24]">
                    Paiements en attente
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-[-0.08em] text-[#111827]">
                    {stats.pendingPayments}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-[2rem] border border-[#E8E2DC] bg-white p-6 -[0_18px_45px_rgba(18,58,99,0.06)]">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#F15A24]">
                      Clients
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] text-[#111827]">
                      Liste des dossiers clients
                    </h2>
</div>

                  <div className="grid w-full gap-3 lg:max-w-2xl lg:grid-cols-[1fr_260px]">
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Rechercher par nom LLC, statut..."
                      className="w-full rounded-[18px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-bold outline-none placeholder:text-slate-400 focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                    />

                    <select
                      value={selectedEmail}
                      onChange={(event) => {
                        const email = event.target.value;
                        setSelectedEmail(email);
                        setNotice("");

                        if (typeof window !== "undefined") {
                          if (email) {
                            window.localStorage.setItem("vemo_admin_selected_client_email", email);
                          } else {
                            window.localStorage.removeItem("vemo_admin_selected_client_email");
                          }
                        }
                      }}
                      className="w-full rounded-[18px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-black text-[#123A63] outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                    >
                      <option value="">Tous les clients</option>
                      {data.clients.map((client) => (
                        <option key={client.email} value={client.email}>
                          {getClientDisplayName(client)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#E8E2DC]">
                  <div className="grid grid-cols-[1.3fr_150px_150px_150px_90px_90px_120px] gap-0 bg-[#FBFCFD] px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    <div>Nom LLC</div>
                    <div>Date création</div>
                    <div>Paiement</div>
                    <div>État dossier</div>
                    <div>Docs</div>
                    <div>Msgs</div>
                    <div className="text-right">Action</div>
                  </div>

                  <div className="divide-y divide-[#E8E2DC] bg-white">
                    {loadingData ? (
                      <div className="px-5 py-8 text-sm font-bold text-slate-500">
                        Chargement des clients...
                      </div>
                    ) : visibleClients.length === 0 ? (
                      <div className="px-5 py-8 text-sm font-bold text-slate-500">
                        Aucun client trouvé.
                      </div>
                    ) : (
                      visibleClients.map((client) => {
                        
                        const docsCount = data.documents.filter(
                          (doc) => doc.client_email === client.email
                        ).length;
                        const messagesCount = data.messages.filter(
                          (msg) => msg.client_email === client.email
                        ).length;

                        return (
                          <div
                            key={client.email}
                            className="grid grid-cols-[1.3fr_150px_150px_150px_90px_90px_120px] items-center gap-0 bg-white px-5 py-5 transition hover:bg-white"
                          >
                            <div>
                              <p className="text-sm font-black text-[#111827]">
                                {getClientDisplayName(client)}
                              </p>
                              <p className="mt-1 text-xs font-bold text-slate-400">
                                Dossier LLC
                              </p>
                            </div>

                            <div className="text-sm font-black text-[#123A63]">
                              {formatDateFR(client.created_at || client.updated_at)}
                            </div>

                            <div>
                              <StatusBadge value={client.payment_status} />
                            </div>

                            <div>
                              <StatusBadge value={client.account_status} />
                            </div>

                            <div className="text-sm font-black text-[#111827]">
                              {docsCount}
                            </div>

                            <div className="text-sm font-black text-[#111827]">
                              {messagesCount}
                            </div>

                            <div className="text-right">
                              <a
                                href={`/fr/admin/client?email=${encodeURIComponent(client.email)}`}
                                className="inline-flex rounded-[14px] bg-[#F15A24] px-4 py-3 text-xs font-black text-white -[0_10px_22px_rgba(241,90,36,.18)] transition hover:bg-[#D94A1B]"
                              >
                                Gérer →
                              </a>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
</div>
            </>
          )}

          {tab === "documents" && (
            <div className="mt-8">
              {!selectedClient ? (
                <div className="rounded-[2rem] border border-[#E8E2DC] bg-white p-8 -[0_18px_45px_rgba(18,58,99,0.06)]">
                  <EmptyState
                    title="Aucun client sélectionné"
                    text="Retournez à Pilotage et cliquez sur Gérer pour ouvrir le dossier d’un client."
                  />

                  <button
                    onClick={() => setTab("home")}
                    className="mt-6 rounded-[18px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white -[0_16px_34px_rgba(241,90,36,.22)] transition hover:bg-[#D94A1B]"
                  >
                    Retour au pilotage →
                  </button>
                </div>
              ) : (
                <>
                  <div className="rounded-[2rem] border border-[#E8E2DC] bg-white p-7 -[0_18px_45px_rgba(18,58,99,0.06)]">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#F15A24]">
                          Documents client
                        </p>

                        <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] text-[#111827]">
                          {getClientDisplayName(selectedClient)}
                        </h2>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusBadge value={selectedClient.payment_status} />
                          <StatusBadge value={selectedClient.account_status} />
                          <span className="inline-flex rounded-full border border-[#E8E2DC] bg-white px-3 py-1 text-xs font-black text-slate-600">
                            {selectedDocs.length} document(s)
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setTab("home")}
                        className="rounded-[18px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-black text-[#123A63] transition hover:bg-[#FFF7F2] hover:text-[#F15A24]"
                      >
                        ← Retour au pilotage
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
                    <div className="rounded-[2rem] border border-[#E8E2DC] bg-white p-6 -[0_18px_45px_rgba(18,58,99,0.06)]">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#F15A24]">
                        Ajouter / replace
                      </p>

                      <h3 className="mt-2 text-2xl font-black text-[#111827]">
                        Document du client
                      </h3>

                      <form onSubmit={uploadDocument} className="mt-5 space-y-4">
                        <input type="hidden" name="client_email" value={selectedClient.email} />

                        <label className="block">
                          <span className="mb-2 block text-sm font-black text-[#123A63]">
                            Type document
                          </span>
                          <select
                            name="document_type"
                            className="w-full rounded-[16px] border border-[#E8E2DC] bg-white px-4 py-4 text-sm font-bold outline-none focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                          >
                            <option value="llc_certificate">Certificat LLC</option>
                            <option value="ein_letter">Lettre EIN</option>
                            <option value="operating_agreement">Operating Agreement</option>
                            <option value="company_document">Company Document</option>
                            <option value="banking">Banking</option>
                            <option value="invoice">Facture / reçu</option>
                            <option value="other">Autre</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-black text-[#123A63]">
                            Remplacer un document
                          </span>
                          <select
                            name="replace_document_id"
                            className="w-full rounded-[16px] border border-[#E8E2DC] bg-white px-4 py-4 text-sm font-bold outline-none focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                          >
                            <option value="">Ajouter nouveau document</option>
                            {selectedDocs.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                {doc.title || doc.file_name || doc.document_type}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-black text-[#123A63]">
                            Fichier
                          </span>
                          <input
                            name="file"
                            type="file"
                            required
                            className="w-full rounded-[16px] border border-dashed border-[#F15A24]/40 bg-white px-4 py-4 text-sm font-bold outline-none"
                          />
                        </label>

                        <button
                          disabled={uploading}
                          className="w-full rounded-[18px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white -[0_16px_34px_rgba(241,90,36,.22)] transition hover:bg-[#D94A1B] disabled:opacity-60"
                        >
                          {uploading ? "Upload..." : "Ajouter / replace →"}
                        </button>
                      </form>
                    </div>

                    <div className="rounded-[2rem] border border-[#E8E2DC] bg-white p-6 -[0_18px_45px_rgba(18,58,99,0.06)]">
                      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#F15A24]">
                            Documents disponibles
                          </p>
                          <h3 className="mt-2 text-2xl font-black text-[#111827]">
                            Fichiers du dossier
                          </h3>
                        </div>

                        <span className="rounded-full bg-[#FFF7F2] px-4 py-2 text-xs font-black text-[#F15A24]">
                          {selectedDocs.length} fichier(s)
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4">
                        {selectedDocs.length === 0 ? (
                          <EmptyState
                            title="Aucun document"
                            text="Ajoutez le premier document de ce client."
                          />
                        ) : (
                          selectedDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className="rounded-[1.5rem] border border-[#E8E2DC] bg-white p-5 transition hover:border-[#F15A24]/30 hover:-[0_14px_35px_rgba(18,58,99,0.06)]"
                            >
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                  <p className="text-lg font-black text-[#111827]">
                                    {doc.title || doc.file_name || doc.document_type}
                                  </p>

                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="inline-flex rounded-full border border-[#E8E2DC] bg-white px-3 py-1 text-xs font-black text-slate-600">
                                      {doc.document_type || "document"}
                                    </span>

                                    {doc.created_at && (
                                      <span className="inline-flex rounded-full border border-[#E8E2DC] bg-white px-3 py-1 text-xs font-black text-slate-500">
                                        {formatDateFR(doc.created_at)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {doc.file_url && (
                                    <a
                                      href={doc.file_url}
                                      target="_self"
                                      rel="noopener noreferrer"
                                      className="rounded-[14px] border border-[#E8E2DC] bg-white px-4 py-3 text-xs font-black text-[#123A63] transition hover:bg-[#FFF7F2] hover:text-[#F15A24]"
                                    >
                                      Ouvrir
                                    </a>
                                  )}

                                  <button
                                    onClick={() => deleteDocument(doc)}
                                    className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700 transition hover:bg-red-100"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "payments" && (
            <div className="mt-8 rounded-[2rem] border border-[#E8E2DC] bg-white p-6 -[0_18px_45px_rgba(18,58,99,0.06)]">
              <h2 className="text-2xl font-black text-[#111827]">Paiement du client</h2>

              {!selectedClient ? (
                <p className="mt-4 text-sm font-bold text-slate-500">
                  Sélectionnez un client depuis l’onglet Pilotage.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    Client : {selectedClient.email}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {["pending_verification", "paid", "rejected"].map((status) => (
                      <button key={status} onClick={() => changeStatus(selectedClient.email, status)} className="rounded-[16px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-black text-[#123A63] transition hover:bg-white hover:text-[#F15A24]">
                        {status}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "messages" && (
            <div className="mt-8 grid gap-6 xl:grid-cols-[420px_1fr]">
              <div className="rounded-[1.5rem] border border-[#E8E2DC] bg-white px-6 py-4 -[0_14px_34px_rgba(18,58,99,0.05)]">
                <h2 className="text-2xl font-black text-[#111827]">Envoyer un message</h2>

                {!selectedClient ? (
                  <p className="mt-4 text-sm font-bold text-slate-500">
                    Sélectionnez un client depuis l’onglet Pilotage.
                  </p>
                ) : (
                  <>
                    <p className="mt-2 text-sm font-bold text-slate-500">
                      À : {selectedClient.email}
                    </p>

                    <textarea
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      placeholder="Votre message au client..."
                      className="mt-5 min-h-[170px] w-full rounded-[18px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-bold outline-none focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                    />

                    <button onClick={sendMessage} disabled={!messageText.trim()} className="mt-4 w-full rounded-[18px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white -[0_16px_34px_rgba(241,90,36,.22)] transition hover:bg-[#D94A1B] disabled:opacity-60">
                      Envoyer →
                    </button>
                  </>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-[#E8E2DC] bg-white px-6 py-4 -[0_14px_34px_rgba(18,58,99,0.05)]">
                <h2 className="text-2xl font-black text-[#111827]">Conversation</h2>

                <div className="mt-5 grid gap-4">
                  {!selectedClient ? (
                    <EmptyState title="Aucun client sélectionné" text="Retournez à Pilotage et sélectionnez un client." />
                  ) : selectedMessages.length === 0 ? (
                    <EmptyState title="Aucun message" text="Les échanges avec ce client apparaîtront ici." />
                  ) : (
                    selectedMessages.map((msg) => (
                      <div key={msg.id} className="rounded-[1.5rem] border border-[#E8E2DC] bg-white p-5">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F15A24]">
                          {msg.sender || "message"}
                        </p>
                        <p className="mt-2 text-sm font-bold leading-7 text-[#111827]">
                          {msg.message}
                        </p>
                        <p className="mt-2 text-xs font-bold text-slate-400">
                          {msg.created_at ? new Date(msg.created_at).toLocaleString("fr-FR") : ""}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

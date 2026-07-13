"use client";

import { useEffect, useState } from "react";

type Row = {
  client: string;
  pack: string;
  state: string;
  amount: string;
  payment: string;
  dossier: string;
  email?: string;
};

const fallbackRows: Row[] = [
  {
    client: "LLC file",
    pack: "—",
    state: "New Mexico",
    amount: "—",
    payment: "Pending verification",
    dossier: "Pending",
  },
  {
    client: "Client LLC",
    pack: "—",
    state: "—",
    amount: "—",
    payment: "Pending verification",
    dossier: "Pending",
  },
];

function normalize(data: any): Row[] {
  const list = data?.orders || data?.clients || data?.data || data?.rows || [];
  if (!Array.isArray(list) || list.length === 0) return fallbackRows;

  return list.map((x: any, i: number) => {
    const email = x.email || x.client_email || x.owner_email || "";
    const client =
      x.llc_name ||
      x.company_name ||
      x.business_name ||
      x.client_name ||
      x.owner_name ||
      x.name ||
      `Client ${i + 1}`;

    return {
      client,
      pack: x.pack || x.plan || x.formule || x.formula || "—",
      state: x.state || x.etat || x.formation_state || "—",
      amount: x.amount || x.price || x.total || x.montant || "—",
      payment: x.payment_status || x.payment || x.statut_paiement || "En vérification",
      dossier: x.dossier_status || x.status || x.statut_dossier || "En attente",
      email,
    };
  });
}

export default function Page() {
  const [rows, setRows] = useState<Row[]>(fallbackRows);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/dashboard", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setRows(normalize(data));
      })
      .catch(() => setRows(fallbackRows));
  }, []);

  const filtered = rows.filter((row) => {
    const text = `${row.client} ${row.pack} ${row.state} ${row.payment} ${row.dossier}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (filter === "all" || text.includes(filter.toLowerCase()));
  });

  const stats = [
    ["Files", "12"],
    ["Payments to verify", "12"],
    ["In progress", "0"],
    ["Completed", "0"],
  ];

  return (
    <section style={{ maxWidth: 1232, margin: "0 auto", padding: "34px 24px" }}>
      <div style={{ background: "#ffffff", borderRadius: 32, padding: 32, border: "1px solid #E5EAF2" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
          {stats.map(([label, value]) => (
            <div key={label} style={{ border: "1px solid #DDE5F0", borderRadius: 20, background: "#ffffff", padding: 22, minHeight: 94 }}>
              <div style={{ color: "#8AA0BE", letterSpacing: 5, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
                {label}
              </div>
              <div style={{ marginTop: 20, color: "#123A63", fontSize: 32, fontWeight: 900 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 28, background: "#ffffff", borderRadius: 32, padding: 24, border: "1px solid #E5EAF2" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, marginBottom: 20 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: LLC name, status..."
            style={{ height: 54, border: "1px solid #DDE5F0", borderRadius: 16, padding: "0 20px", fontWeight: 800, color: "#123A63", outline: "none", background: "#ffffff" }}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ height: 54, border: "1px solid #DDE5F0", borderRadius: 16, padding: "0 20px", fontWeight: 900, color: "#111827", background: "#ffffff" }}
          >
            <option value="all">All clients</option>
            <option value="new mexico">New Mexico</option>
            <option value="wyoming">Wyoming</option>
            <option value="vérification">Payments to verify</option>
            <option value="attente">En attente</option>
          </select>
        </div>

        <div style={{ border: "1px solid #DDE5F0", borderRadius: 18, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.2fr 1.2fr 110px", background: "#F8FAFC", padding: "18px 20px", color: "#8AA0BE", letterSpacing: 4, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
            <div>Client / LLC</div>
            <div>Plan</div>
            <div>State</div>
            <div>Amount</div>
            <div>Payment</div>
            <div>File</div>
            <div>Actions</div>
          </div>

          {filtered.map((row, index) => {
            const href = row.email
              ? `/en/admin/client-portal?email=${encodeURIComponent(row.email)}`
              : "/en/admin/client-portal";

            return (
              <div key={`${row.client}-${index}`} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.2fr 1.2fr 110px", padding: "18px 20px", borderTop: "1px solid #E5EAF2", alignItems: "center", color: "#123A63", fontWeight: 900, minHeight: 64 }}>
                <div>{row.client}</div>
                <div>{row.pack}</div>
                <div>{row.state}</div>
                <div>{row.amount}</div>
                <div>{row.payment}</div>
                <div>{row.dossier}</div>
                <a href={href} style={{ height: 44, borderRadius: 14, background: "#F15A24", color: "#ffffff", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                  Open
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

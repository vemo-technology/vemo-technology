import { notFound } from "next/navigation";

export default function TestSupabasePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main style={{ padding: 32, fontFamily: "Arial, sans-serif" }}>
      <h1>Test Supabase désactivé</h1>
      <p>Cette page de test n’est pas utilisée en production.</p>
    </main>
  );
}

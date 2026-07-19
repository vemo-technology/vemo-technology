import ClientPortalWorkspace from "@/components/client-portal/ClientPortalWorkspace";

export const dynamic = "force-dynamic";

type Tab = "status" | "documents" | "services" | "messages" | "account";

function normalizeTab(value?: string): Tab {
  if (value === "documents" || value === "services" || value === "messages" || value === "account") return value;
  return "status";
}

export default async function EnClientSpacePage({
  searchParams,
}: { searchParams?: Promise<{ tab?: string }> }) {
  const params = searchParams ? await searchParams : {};
  return <ClientPortalWorkspace lang="en" tab={normalizeTab(params.tab)} />;
}

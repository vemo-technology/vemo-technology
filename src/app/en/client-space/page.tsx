import ClientPortalWorkspace from "@/components/client-portal/ClientPortalWorkspace";

export const dynamic = "force-dynamic";

type Tab = "status" | "documents" | "services" | "messages" | "account";

function normalizeTab(value?: string): Tab {
  if (value === "documents" || value === "services" || value === "messages" || value === "account") return value;
  return "status";
}

export default async function EnClientSpacePage({
  searchParams,
}: {
  searchParams?: Promise<{ email?: string; tab?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  return <ClientPortalWorkspace lang="en" email={params.email || ""} tab={normalizeTab(params.tab)} />;
}

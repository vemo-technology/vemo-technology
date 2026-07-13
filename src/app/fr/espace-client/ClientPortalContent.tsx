"use client";

import ClientPortalWorkspace from "@/components/client-portal/ClientPortalWorkspace";

export default function ClientPortalContent({ email = "" }: { email?: string }) {
  return <ClientPortalWorkspace lang="fr" email={email} tab="status" />;
}

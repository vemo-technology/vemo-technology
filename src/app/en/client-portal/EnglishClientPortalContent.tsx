"use client";

import ClientPortalWorkspace from "@/components/client-portal/ClientPortalWorkspace";

export default function EnglishClientPortalContent({ email = "" }: { email?: string }) {
  return <ClientPortalWorkspace lang="en" email={email} tab="status" />;
}

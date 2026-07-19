import { redirect } from "next/navigation";

export default function LegacyDocumentPage() {
  redirect("/en/client-portal?tab=documents");
}

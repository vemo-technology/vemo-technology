import { redirect } from "next/navigation";

export default function LegacyDocumentPage() {
  redirect("/fr/espace-client?tab=documents");
}

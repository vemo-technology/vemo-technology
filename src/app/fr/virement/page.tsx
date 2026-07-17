import { redirect } from "next/navigation";

export default function Page() {
  redirect("/fr/commencer?payment=transfer&legacy=1");
}

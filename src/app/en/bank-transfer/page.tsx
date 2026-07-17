import { redirect } from "next/navigation";

export default function Page() {
  redirect("/en/start?payment=transfer&legacy=1");
}

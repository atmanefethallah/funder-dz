import PromoteForm from "@/components/partner/PromoteForm";
import { requireRole } from "@/lib/session";
import { redirect } from "next/navigation";
export default async function PromotePage() {
  const u = await requireRole("PARTNER", "ADMIN");
  if (!u) redirect("/login");
  return <PromoteForm />;
}

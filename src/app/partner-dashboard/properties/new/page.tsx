import PropertyWizard from "@/components/partner/PropertyWizard";
import { requireRole } from "@/lib/session";
import { redirect } from "next/navigation";
export default async function NewPropertyPage() {
  const user = await requireRole("PARTNER", "ADMIN");
  if (!user) redirect("/login");
  return <PropertyWizard />;
}

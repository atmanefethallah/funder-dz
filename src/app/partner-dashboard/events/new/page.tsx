import { requireRole } from "@/lib/session";
import { redirect } from "next/navigation";
import EventWizard from "@/components/partner/EventWizard";
export default async function NewEventPage() {
  const user = await requireRole("PARTNER", "ADMIN");
  if (!user) redirect("/login");
  return <EventWizard />;
}

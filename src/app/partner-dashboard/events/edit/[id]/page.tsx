import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import EventWizard from "@/components/partner/EventWizard";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const toLocalInput = (v: unknown) => {
  if (!v) return "";
  const d = new Date(v as string);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
};

export default async function EditEventPage({
  params,
}: {
  params: { id: string };
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");
  if (sessionUser.role !== "PARTNER" && sessionUser.role !== "ADMIN")
    redirect("/explore");

  const place = await queryOne<Record<string, any>>(
    `SELECT * FROM "Place" WHERE "id" = $1 AND "itemType" = 'EVENT'`,
    [params.id],
  );
  if (!place) notFound();
  if (place.userId !== sessionUser.id && sessionUser.role !== "ADMIN") {
    redirect("/partner-dashboard");
  }

  const eventDetail = await queryOne<Record<string, any>>(
    `SELECT * FROM "EventDetail" WHERE "placeId" = $1`,
    [params.id],
  );
  const session = eventDetail
    ? await queryOne<Record<string, any>>(
        `SELECT * FROM "EventSession" WHERE "eventId" = $1 ORDER BY "createdAt" ASC LIMIT 1`,
        [eventDetail.id],
      )
    : null;
  const ticketRows = eventDetail
    ? await query<Record<string, any>>(
        `SELECT * FROM "TicketType" WHERE "eventId" = $1 AND "status" = 'ACTIVE' ORDER BY "createdAt" ASC`,
        [eventDetail.id],
      )
    : [];

  const initialPlace = {
    name: str(place.name),
    eventType: str(eventDetail?.eventType) || "CONCERT",
    organizer: str(eventDetail?.organizer),
    description: str(place.description),
    coverImageUrl: str(place.coverImageUrl),
    videoUrl: str(place.videoUrl),
    virtualTourUrl: str(place.virtualTourUrl),
    address: str(place.address),
    state: str(place.state),
    municipality: str(place.municipality),
    latitude: str(place.latitude),
    longitude: str(place.longitude),
    startAt: toLocalInput(eventDetail?.startAt),
    endAt: toLocalInput(eventDetail?.endAt),
    doorsOpenAt: toLocalInput(eventDetail?.doorsOpenAt),
    minimumAge: str(eventDetail?.minimumAge),
    targetAudience: str(eventDetail?.targetAudience),
    program: str(eventDetail?.program),
    attendanceTerms: str(eventDetail?.attendanceTerms),
    capacity: str(session?.capacity),
    sessionName: str(session?.name),
  };

  const tickets = ticketRows.map((t) => ({
    id: t.id,
    name: str(t.name) || "Standard",
    description: str(t.description),
    price: str(t.price),
    quantity: str(t.quantity) || "100",
    bookingMode: str(t.bookingMode) || "PURCHASE",
    refundPolicy: str(t.refundPolicy) || "FREE_48H",
    saleStart: toLocalInput(t.saleStart),
    saleEnd: toLocalInput(t.saleEnd),
  }));

  return (
    <EventWizard
      editPlaceId={params.id}
      initialData={{ place: initialPlace, tickets }}
    />
  );
}

import { queryOne } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import SaveableTicket from "@/components/Booking/SaveableTicket";
import { ArrowRight, Navigation } from "lucide-react";
import Link from "next/link";

type BookingRow = {
  id: string;
  userId: string;
  placeId: string;
  status: string;
  qrToken: string;
  tickets: number | null;
  roomType: string | null;
  amount: string;
  createdAt: Date;
  user_name: string | null;
  place_name: string;
  place_location: string;
  place_image: string | null;
  place_category: string;
  place_event_ends_at: Date | null;
  place_latitude: number | null;
  place_longitude: number | null;
};

export default async function TicketPage({
  params,
}: {
  params: { id: string };
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const booking = await queryOne<BookingRow>(
    `SELECT b."id", b."userId", b."placeId", b."status", b."qrToken", b."tickets",
            b."roomType", b."amount", b."createdAt", u."name" AS user_name,
            p."name" AS place_name, p."location" AS place_location,
            p."imageUrl" AS place_image, p."category" AS place_category,
            p."eventEndsAt" AS place_event_ends_at,
            p."latitude" AS place_latitude, p."longitude" AS place_longitude
     FROM "Booking" b
     JOIN "Place" p ON p."id" = b."placeId"
     JOIN "User" u ON u."id" = b."userId"
     WHERE b."id" = $1`,
    [params.id],
  );

  if (!booking || booking.userId !== sessionUser.id) notFound();

  const mapsHref =
    booking.place_latitude != null && booking.place_longitude != null
      ? "https" +
        "://" +
        "www.google.com/maps/dir/?api=1&destination=" +
        encodeURIComponent(
          `${booking.place_latitude},${booking.place_longitude}`,
        )
      : null;

  return (
    <main
      className="flex min-h-screen flex-col items-center bg-gray-900 px-4 py-12 selection:bg-blue-500/30"
      dir="rtl"
    >
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        <Link
          href="/explore"
          className="flex items-center gap-1 text-sm font-bold text-white/70 transition hover:text-white"
        >
          <ArrowRight size={16} /> العودة للاستكشاف
        </Link>
        <h1 className="text-xl font-black tracking-wider text-white">Funder</h1>
      </div>

      <SaveableTicket
        ticket={{
          id: booking.id,
          qrToken: booking.qrToken,
          status: booking.status,
          place: {
            name: booking.place_name,
            location: booking.place_location || "الموقع غير محدد",
            image: booking.place_image || "/icons/icon.svg",
            category: booking.place_category,
            eventEndsAt: booking.place_event_ends_at?.toISOString() || null,
          },
          tickets: booking.tickets || 1,
          amount: Number(booking.amount) || 0,
          createdAt: booking.createdAt.toISOString(),
          userName: booking.user_name || sessionUser.name || "مستخدم Funder",
          ticketType: booking.roomType,
        }}
      />

      {mapsHref && (
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full max-w-md items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
        >
          <Navigation size={18} /> فتح الاتجاهات إلى الموقع
        </a>
      )}

      <p className="mt-8 text-[10px] font-bold text-white/40">
        Powered by Funder Smart Tourism
      </p>
    </main>
  );
}

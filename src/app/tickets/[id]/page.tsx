import { queryOne } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import SaveableTicket from "@/components/Booking/SaveableTicket";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type BookingRow = {
  id: string;
  userId: string;
  placeId: string;
  status: string;
  qrToken: string;
  tickets: number | null;
  roomType: string | null;
  place_name: string;
  place_latitude: number | null;
  place_longitude: number | null;
};

export default async function TicketPage({ params }: { params: { id: string } }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return redirect("/login");
  const userId = sessionUser.id;

  // جلب بيانات الحجز مع تفاصيل المعلم (بما فيها الإحدّيات لعرض المسار)
  const booking = await queryOne<BookingRow>(
    `SELECT b."id", b."userId", b."placeId", b."status", b."qrToken", b."tickets", b."roomType",
            p."name" AS place_name, p."latitude" AS place_latitude, p."longitude" AS place_longitude
     FROM "Booking" b JOIN "Place" p ON p."id" = b."placeId" WHERE b."id" = $1`,
    [params.id],
  );

  if (!booking || booking.userId !== userId) {
    return notFound();
  }

  // 🗺️ رابط الملاحة المباشر لموقع المعلم الحقيقي بعد قبول التذكرة
  const mapsHref =
    booking.place_latitude != null && booking.place_longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${booking.place_latitude},${booking.place_longitude}`
      : null;

  // 🛡️ رمز QR يُولّد محلياً من qrToken السري — لا خدمة خارجية ولا معرف حجز قابل للتخمين

  return (
    <main className="min-h-screen bg-gray-900 py-12 px-4 flex flex-col items-center selection:bg-blue-500/30" dir="rtl">
      
      <div className="w-full max-w-sm mb-6 flex justify-between items-center">
        <Link href="/explore" className="text-white/70 hover:text-white flex items-center gap-1 text-sm font-bold transition">
          <ArrowRight size={16} /> العودة للاستكشاف
        </Link>
        <h1 className="text-xl font-black text-white tracking-wider">Funder</h1>
      </div>

      {/* 🎫 جسم التذكرة الفاخرة — قابلة للحفظ كصورة وتعرض المسار نحو المعلم */}
      <SaveableTicket
        bookingId={booking.id}
        placeName={booking.place_name}
        status={booking.status}
        ticketsCount={booking.tickets || 1}
        roomType={booking.roomType}
        qrToken={booking.qrToken}
        mapsHref={mapsHref}
      />

      <p className="text-white/40 text-[10px] font-bold mt-8">Powered by Funder Smart Tourism</p>
    </main>
  );
}

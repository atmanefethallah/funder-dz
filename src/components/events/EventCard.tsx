"use client";

import { useMemo, useState } from "react";
import { Calendar, MapPin, Loader2, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";

interface EventProps {
  eventId: string;
  userId?: string;
  title: string;
  placeName: string;
  date: Date | string;
  price: number;
}

export default function EventCard({ eventId, userId, title, placeName, date, price }: EventProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const router = useRouter();
  const eventDate = useMemo(() => new Date(date), [date]);
  const isExpired = Number.isFinite(eventDate.getTime()) && eventDate.getTime() <= Date.now();

  const handleBooking = async () => {
    if (isLoading || isExpired) return;
    if (!userId) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/events`)}`);
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: eventId, tickets: 1 }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ text: data.message || "تعذر إتمام الحجز.", type: "error" });
        return;
      }

      setMessage({ text: "تم إنشاء التذكرة بنجاح، جاري فتحها...", type: "success" });
      if (data.bookingId) router.push(`/tickets/${data.bookingId}`);
      else router.push("/tickets");
      router.refresh();
    } catch {
      setMessage({ text: "حدث خطأ في الاتصال بالخادم.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <article className="flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md" dir="rtl">
      <div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${price === 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{price === 0 ? "مجانية" : `${price} د.ج`}</span>
        </div>
        <div className="mb-4 space-y-2 text-sm text-gray-600">
          <p className="flex items-center gap-2"><MapPin size={16} /> {placeName}</p>
          <p className="flex items-center gap-2"><Calendar size={16} /> تنتهي: {eventDate.toLocaleDateString("ar-DZ")} — {eventDate.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        {message && <div className={`mb-3 rounded-lg p-3 text-center text-xs font-bold ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message.text}</div>}
        <button type="button" onClick={handleBooking} disabled={isLoading || isExpired} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation">
          {isLoading ? <Loader2 size={17} className="animate-spin" /> : <Ticket size={17} />}
          {isExpired ? "انتهت الفعالية" : isLoading ? "جاري إنشاء التذكرة..." : "احجز تذكرتك"}
        </button>
      </div>
    </article>
  );
}

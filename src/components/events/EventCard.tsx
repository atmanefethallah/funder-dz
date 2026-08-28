"use client";

import { useState } from "react";
import { Calendar, MapPin, Tag } from "lucide-react";

interface EventProps {
  eventId: string;
  userId: string | undefined; // لمعرفة ما إذا كان مسجلاً للدخول
  title: string;
  placeName: string;
  date: Date;
  price: number;
}

export default function EventCard({ eventId, userId, title, placeName, date, price }: EventProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleBooking = async () => {
    if (!userId) {
      setMessage({ text: "يرجى تسجيل الدخول أولاً لإتمام الحجز.", type: "error" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // تصحيح المتغير ليصبح eventId كما هو معرف في الـ Props
        body: JSON.stringify({ placeId: eventId }), 
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: "🎉 " + data.message, type: "success" });
      } else {
        setMessage({ text: "❌ " + data.message, type: "error" });
      }
    } catch (error) {
      setMessage({ text: "حدث خطأ في الاتصال بالخادم.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md" dir="rtl">
      <div>
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${price === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {price === 0 ? 'مجانية' : `${price} د.ج`}
          </span>
        </div>
        
        <div className="mb-4 space-y-2 text-sm text-gray-600">
          <p className="flex items-center gap-2"><MapPin size={16} /> {placeName}</p>
          <p className="flex items-center gap-2"><Calendar size={16} /> {new Date(date).toLocaleDateString('ar-DZ')} - {new Date(date).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        {message && (
          <div className={`mb-3 rounded-lg p-3 text-center text-xs font-bold ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </div>
        )}
        <button
          onClick={handleBooking}
          disabled={isLoading || message?.type === "success"}
          className="w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "جاري معالجة الحجز..." : message?.type === "success" ? "تم الحجز بنجاح!" : "احجز تذكرتك"}
        </button>
      </div>
    </div>
  );
}

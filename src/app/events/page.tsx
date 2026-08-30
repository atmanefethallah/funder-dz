import { query } from "@/lib/db";
import EventCard from "@/components/events/EventCard";
import { getSessionUser } from "@/lib/session";

// 🚀 إجبار الصفحة على التحديث الديناميكي لقراءة الكوكيز بشكل صحيح
export const dynamic = "force-dynamic";

type PlaceRow = {
  id: string;
  name: string;
  category: string | null;
  price: string;
  createdAt: Date;
  [key: string]: unknown;
};

// جلب المعالم (الفعاليات) من الخادم
async function getUpcomingEvents() {
  // الفعاليات فقط، ولا تُعرض بعد انتهاء موعدها.
  return await query<PlaceRow>(
    `SELECT * FROM "Place"
     WHERE "isEvent" IS TRUE AND ("eventEndsAt" IS NULL OR "eventEndsAt" > NOW())
     ORDER BY "eventEndsAt" ASC NULLS LAST, "createdAt" DESC`,
  );
}

export default async function EventsPage() {
  const rawPlaces = await getUpcomingEvents();
  const sessionUser = await getSessionUser();
  const userId = sessionUser?.id;

  // تحويل Decimal إلى Number قبل التمرير لمكونات العميل (EventCard)
  const places = rawPlaces.map((p) => ({ ...p, price: Number(p.price) }));

  return (
    <main className="min-h-screen bg-gray-50 py-24 px-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            الفعاليات والمعالم السياحية
          </h1>
          <p className="text-lg text-gray-500">
            اكتشف أروع الأماكن واحجز تذكرتك بضغطة زر وبكل أمان.
          </p>
        </div>

        {places.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 font-bold text-lg">لا توجد فعاليات أو معالم متاحة حالياً. 🏜️</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {places.map((place: any) => (
              <EventCard 
                key={place.id}
                eventId={place.id}
                userId={userId}
                title={place.name}
                placeName={place.category || "وجهة سياحية"} 
                date={place.eventEndsAt || place.createdAt || new Date()} // موعد انتهاء الفعالية
                price={place.price}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}

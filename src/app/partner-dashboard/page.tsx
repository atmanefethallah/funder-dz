import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Users, Ticket, MapPin, Edit2, PlusCircle } from "lucide-react";

type PartnerPlaceRow = {
  id: string;
  name: string;
  category: string;
  price: string;
  imageUrl: string | null;
  bookings: Array<{ status: string }>;
  reviews: Array<{ rating: number }>;
};

export default async function PartnerDashboardPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) redirect("/login");

  // 1. التحقق من أن المستخدم شريك فعلاً (أو مديراً)
  if (sessionUser.role !== "PARTNER" && sessionUser.role !== "ADMIN") {
    redirect("/explore");
  }

  const userId = sessionUser.id;
  const user = { name: sessionUser.name ?? "شريك", role: sessionUser.role };

  // 2. جلب معالم هذا الشريك مع حجوزاتها وتقييماتها (جموعات فرعية لتجنب التكرار الجانبي)
  const myPlaces = await query<PartnerPlaceRow>(
    `SELECT p.*, 
            COALESCE(bk.bookings, '[]') AS bookings,
            COALESCE(rv.reviews, '[]') AS reviews
     FROM "Place" p
     LEFT JOIN (
       SELECT "placeId", json_agg(json_build_object('status', "status")) AS bookings
       FROM "Booking" GROUP BY "placeId"
     ) bk ON bk."placeId" = p."id"
     LEFT JOIN (
       SELECT "placeId", json_agg(json_build_object('rating', "rating")) AS reviews
       FROM "Review" GROUP BY "placeId"
     ) rv ON rv."placeId" = p."id"
     WHERE p."userId" = $1
     ORDER BY p."createdAt" DESC`,
    [userId],
  );

  // 3. حساب الإحصائيات برمجياً
  let totalRevenue = 0;
  let totalTickets = 0;
  let usedTickets = 0;

  myPlaces.forEach((place) => {
    totalTickets += place.bookings.length;
    place.bookings.forEach((booking) => {
      // نحسب الأرباح بناءً على التذاكر المستخدمة أو المدفوعة
      if (booking.status === "USED" || booking.status === "CONFIRMED") {
        totalRevenue += Number(place.price);
      }
      if (booking.status === "USED") {
        usedTickets++;
      }
    });
  });

  return (
    <main className="min-h-screen bg-gray-50/50 pb-12">
      {/* الترويسة */}
      <div className="bg-blue-900 py-12 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-3xl font-bold mb-2">مرحباً بك يا {user.name} 👋</h1>
          <p className="text-blue-200">هنا نظرة عامة على أداء معالمك السياحية ومبيعاتك</p>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-6xl px-4">
        {/* 📊 بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-bold mb-1">إجمالي الأرباح المتوقعة</p>
              <p className="text-3xl font-black text-green-600" dir="ltr">{totalRevenue} د.ج</p>
            </div>
            <div className="bg-green-100 p-4 rounded-xl text-green-600"><TrendingUp size={32} /></div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-bold mb-1">التذاكر المباعة</p>
              <p className="text-3xl font-black text-blue-600">{totalTickets}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-xl text-blue-600"><Ticket size={32} /></div>
          </div>

          <div className="bg-white rounded-2xl p-6 border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-bold mb-1">الزوار الفعليون (تذاكر مستخدمة)</p>
              <p className="text-3xl font-black text-purple-600">{usedTickets}</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-xl text-purple-600"><Users size={32} /></div>
          </div>
        </div>

        {/* 🗺️ إدارة المعالم */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">معالمي السياحية ({myPlaces.length})</h2>
          <Link href="/add-place" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
            <PlusCircle size={18} /> إضافة معلم جديد
          </Link>
        </div>

        {myPlaces.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">لم تقم بإضافة أي معالم سياحية بعد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myPlaces.map((place) => (
              <div key={place.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col sm:flex-row">
                <div className="w-full sm:w-40 h-40 bg-gray-100 relative shrink-0">
                  {place.imageUrl ? (
                    <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <MapPin size={32} />
                    </div>
                  )}
                  <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                    {place.category}
                  </span>
                </div>
                
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{place.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      ⭐ {place.reviews.length} تقييمات | 🎫 {place.bookings.length} تذكرة مباعة
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-bold text-blue-600" dir="ltr">{Number(place.price) > 0 ? `${Number(place.price)} د.ج` : "مجاني"}</span>
                    <Link href={`/edit-place/${place.id}`} className="flex items-center gap-1 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-bold transition">
                      <Edit2 size={14} /> تعديل
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

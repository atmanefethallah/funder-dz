// src/components/RecommendedPlaces.tsx — قسم "مقترح لك" المخصص (Server Component)
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { getRecommendations } from "@/lib/recommendations";
import { Sparkles, Star, MapPin } from "lucide-react";

export default async function RecommendedPlaces() {
  // ⚠️ لا نترك أي خطأ في الجلسة أو قاعدة البيانات يُسقط الصفحة الرئيسية كاملة.
  let sessionUser: { id: string } | null = null;
  let places: Awaited<ReturnType<typeof getRecommendations>> = [];
  try {
    sessionUser = await getSessionUser();
    places = await getRecommendations(sessionUser?.id ?? null, 6);
  } catch (error) {
    console.error("❌ فشل تحميل التوصيات المخصصة:", error);
    return null;
  }

  if (places.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10" dir="rtl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-amber-100 text-amber-600 p-2 rounded-xl">
            <Sparkles size={20} className="fill-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {sessionUser ? "مقترح لك خصيصاً" : "وجهات رائجة"}
            </h2>
            <p className="text-xs text-gray-500">
              {sessionUser ? "بناءً على اهتماماتك وسجلّك" : "الأعلى تقييماً في مستغانم"}
            </p>
          </div>
        </div>
        <Link href="/explore" className="text-sm font-bold text-blue-600 hover:underline">
          عرض الكل ←
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {places.map((place) => (
          <Link
            key={place.id}
            href={`/places/${place.id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="relative h-28 w-full bg-gray-100">
              {place.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={place.imageUrl} alt={place.name} className="h-full w-full object-cover transition group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <MapPin size={26} />
                </div>
              )}
              {place.price === 0 && (
                <span className="absolute right-2 top-2 rounded-md bg-green-500 px-1.5 py-0.5 text-[9px] font-black text-white">مجاني</span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-3">
              <h3 className="text-sm font-black text-gray-900 line-clamp-1 mb-1">{place.name}</h3>
              <div className="mt-auto flex items-center justify-between text-[11px]">
                <span className="font-bold text-blue-600">{place.price === 0 ? "مجاني" : `${place.price} د.ج`}</span>
                <span className="flex items-center gap-0.5 text-gray-600 font-bold">
                  <Star size={11} className={place.avgRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                  {place.avgRating ?? "جديد"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

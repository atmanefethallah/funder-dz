import { query, queryOne } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, MapPin, ArrowRight, User } from "lucide-react";
import { getCategoryMeta } from "@/lib/placeCategoryIcons";

type PartnerRow = {
  id: string;
  name: string;
  role: string;
  verificationStatus: string | null;
};

type PlaceRow = {
  id: string;
  name: string;
  category: string;
  price: string;
  imageUrl: string | null;
};

// 🏷️ الصفحة العامة لملف الشريك — تعرض شارة التوثيق وكل معالمه النشطة للسياح
export default async function PartnerProfilePage({ params }: { params: { id: string } }) {
  const partner = await queryOne<PartnerRow>(
    `SELECT "id", "name", "role", "verificationStatus" FROM "User" WHERE "id" = $1 AND "role" IN ('PARTNER', 'ADMIN')`,
    [params.id],
  );

  if (!partner) {
    return notFound();
  }

  const rawPlaces = await query<PlaceRow>(
    `SELECT "id", "name", "category", "price", "imageUrl" FROM "Place"
     WHERE "userId" = $1 AND ("isEvent" IS NOT TRUE OR "eventEndsAt" IS NULL OR "eventEndsAt" > NOW())
     ORDER BY "createdAt" DESC`,
    [params.id],
  );
  const places = rawPlaces.map((p) => ({ ...p, price: Number(p.price) }));
  const isVerified = partner.verificationStatus === "VERIFIED";

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <Link href="/explore" className="inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-900 mb-6 transition">
          <ArrowRight size={16} /> العودة للاستكشاف
        </Link>

        {/* 🏅 بطاقة الشريك */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-8 flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
            <User size={36} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              {partner.name}
              {isVerified && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-black px-2.5 py-1 rounded-full border border-blue-100">
                  <BadgeCheck size={14} className="fill-blue-100" /> شريك موثّق
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isVerified
                ? "تم التحقق من هوية هذا الشريك ومستنداته الرسمية من طرف منصة Funder."
                : "شريك في منصة Funder السياحية."}
            </p>
            <p className="text-xs text-gray-400 mt-2 font-bold">{places.length} معلم سياحي منشور</p>
          </div>
        </div>

        {/* 🗺️ قائمة معالم الشريك */}
        <h2 className="text-lg font-black text-gray-900 mb-4">معالم {partner.name} 🏛️</h2>

        {places.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            لا يوجد لدى هذا الشريك معالم منشورة حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place) => {
              const meta = getCategoryMeta(place.category);
              const isFree = place.price === 0;
              return (
                <Link
                  key={place.id}
                  href={`/places/${place.id}`}
                  className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition duration-200"
                >
                  <div className="relative h-40 w-full bg-gray-100">
                    {place.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={place.imageUrl} alt={place.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-300"><MapPin size={28} /></div>
                    )}
                    <span className={`absolute right-3 top-3 rounded-full ${meta.bgClass} px-2.5 py-0.5 text-[11px] font-bold ${meta.textClass}`}>
                      {meta.emoji} {meta.label}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-black text-gray-900 text-sm mb-2 line-clamp-1">{place.name}</h3>
                    <span className={`font-black text-sm ${isFree ? "text-green-600" : "text-blue-600"}`}>
                      {isFree ? "دخول مجاني" : `${place.price} د.ج`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

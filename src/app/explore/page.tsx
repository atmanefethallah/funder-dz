import Link from "next/link";
import OnboardingTour from "@/components/OnboardingTour";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { MapPin, Edit2, Sparkles, Star, Navigation } from "lucide-react"; 
import BookingButton from "@/components/BookingButton";
import HeartButton from "@/components/HeartButton";
import SearchFilterBar from "@/components/SearchFilterBar"; 
import dynamic from "next/dynamic";
import ProtectedLink from "@/components/ProtectedLink";

// استدعاء الخريطة بشكل ديناميكي ومحمي
const InteractiveMap = dynamic(() => import("@/components/map/PlacesMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 animate-pulse">
      <p className="text-blue-600 font-bold flex items-center gap-2">🗺️ جاري رسم الخريطة الجगرافية الذكية...</p>
    </div>
  ),
});

type ExplorePlaceRow = {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  reviews: Array<{ rating: number }>;
};

export default async function ExplorePage({ searchParams }: { searchParams: { q?: string, category?: string } }) {
  // 🔐 الجلسة الموقّعة من NextAuth فقط
  const sessionUser = await getSessionUser();
  const loggedInUserId = sessionUser?.id ?? null;
  const isLoggedIn = !!sessionUser;

  const currentUser = sessionUser ? { role: sessionUser.role } : null;
  let userWishlistIds: string[] = [];

  if (loggedInUserId) {
    const wishlists = await query<{ placeId: string }>(
      `SELECT "placeId" FROM "Wishlist" WHERE "userId" = $1`,
      [loggedInUserId],
    );
    userWishlistIds = wishlists.map((w) => w.placeId);
  }

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (searchParams.category && searchParams.category !== "الكل") {
    params.push(searchParams.category);
    conditions.push(`p."category" = $${params.length}`);
  }
  if (searchParams.q) {
    params.push(`%${searchParams.q}%`);
    conditions.push(`p."name" LIKE $${params.length}`);
  }
  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rawPlaces = await query<ExplorePlaceRow>(
    `SELECT p.*, COALESCE(json_agg(json_build_object('rating', r."rating")) FILTER (WHERE r."id" IS NOT NULL), '[]') AS reviews
     FROM "Place" p
     LEFT JOIN "Review" r ON r."placeId" = p."id"
     ${whereSql}
     GROUP BY p."id"
     ORDER BY p."createdAt" DESC
     LIMIT 100`,
    params,
  );

  // تحويل Decimal إلى Number قبل التمرير لمكونات العميل (Client Components)
  const places = rawPlaces.map((p) => ({ ...p, price: Number(p.price) }));

  return (
    <main className="min-h-screen bg-white flex flex-col" dir="rtl">
      
      {/* 🏙️ شريط البحث العلوي المدمج الفخم */}
      <div className="border-b bg-gray-50/50 py-4 px-6 shadow-sm sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-right">
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              اكتشف مستगانم الذكية <Sparkles size={18} className="text-amber-500 fill-amber-500" />
            </h1>
          </div>
          <div className="w-full md:w-auto">
            <SearchFilterBar />
          </div>
        </div>
      </div>

      {/* 🌟 🌎 تخطيط شاشة Airbnb العالمي المنقسم للنتائج 🌎 🌟 */}
      <div className="flex flex-col-reverse lg:flex-row w-full flex-1 h-[calc(100vh-80px)] overflow-hidden">
        
        {/* 📜 الجانب الأيمن: قائمة المعالم القابلة للتمرير (Scrollable List) */}
        <div className="w-full lg:w-7/12 h-full overflow-y-auto p-6 bg-white border-l">
          
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider">
              {places.length > 0 ? `وجدنا لك (${places.length}) وجهات سياحية معتمدة` : "لا توجد نتائج مطابقة"}
            </h2>
            
            <ProtectedLink 
              href="/smart-plan" 
              isLoggedIn={isLoggedIn}
              message="يرجى تسجيل الدخول أولاً لتجربة الخطة الذكية بالذكاء الاصطناعي ✨"
              className="flex items-center gap-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 px-3 py-1.5 transition hover:bg-amber-200"
            >
              ✨ التخطيط بالـ AI
            </ProtectedLink>
          </div>

          {places.length === 0 ? (
            <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center">
              <span className="text-4xl mb-3">🏜️</span>
              <p className="font-bold">لم نجد أي معالم جगرافية مضافة هنا بعد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {places.map((place) => {
                const isPlaceFree = place.price === 0 || !place.price;

                return (
                  <div key={place.id} className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition duration-200">
                    
                    {/* الصورة والقلب */}
                    <div className="relative h-44 w-full bg-gray-100">
                      {(!currentUser || currentUser.role === "TOURIST") && (
                        <HeartButton 
                          placeId={place.id} 
                          initialFavorited={userWishlistIds.includes(place.id)} 
                          isLoggedIn={isLoggedIn} 
                        />
                      )}

                      {place.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={place.imageUrl} alt={place.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-300"><MapPin size={32} /></div>
                      )}

                      <span className="absolute right-3 top-3 rounded-full bg-gray-900/80 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs">
                        {place.category}
                      </span>

                      {isPlaceFree && (
                        <span className="absolute left-3 top-3 rounded-md bg-green-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
                          مجاني
                        </span>
                      )}
                    </div>
                    
                    {/* النصوص والأزرار */}
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="text-base font-black text-gray-900 mb-1 line-clamp-1">{place.name}</h3>
                      
                      <div className="flex items-center gap-1 mb-2 text-xs">
                        <Star size={12} className={place.reviews && place.reviews.length > 0 ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} />
                        <span className="font-bold text-gray-700">
                          {place.reviews && place.reviews.length > 0 
                            ? (place.reviews.reduce((acc: any, curr: any) => acc + curr.rating, 0) / place.reviews.length).toFixed(1)
                            : "جديد"}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">{place.description}</p>
                      
                      <div className="mt-auto flex items-center justify-between border-t pt-3">
                        <span className={`font-black text-sm ${isPlaceFree ? "text-green-600" : "text-blue-600"}`}>
                          {isPlaceFree ? "دخول مجاني" : `${place.price} د.ج`}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <ProtectedLink 
                            href={`/explore/vr/${place.id}`} 
                            isLoggedIn={isLoggedIn}
                            message="يرجى تسجيل الدخول أولاً للاستمتاع بالجولات الافتراضية 360° 🕶️"
                            className="bg-gray-100 text-gray-800 px-2 py-1.5 rounded-lg text-[11px] font-bold hover:bg-gray-200 transition"
                          >
                            🕶️ 360°
                          </ProtectedLink>
                          
                          {isPlaceFree ? (
                            <ProtectedLink
                              href={`{{https://www.google.com/maps/dir/?api=1&destination=${place.latitude}}},${place.longitude}`}
                              isLoggedIn={isLoggedIn}
                              message="يرجى تسجيل الدخول أولاً لتفعيل الخرائط الحية وبدء المسار 🧭"
                              
                              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-green-700 transition"
                            >
                              بدء المسار 🧭
                            </ProtectedLink>
                          ) : (
                            <BookingButton placeId={place.id} price={place.price} isLoggedIn={isLoggedIn} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 🌍 الجانب الأيسر: خريطة كاملة ثابتة (Fixed Sticky Map View) */}
        <div className="w-full lg:w-5/12 h-96 lg:h-full relative z-10 bg-gray-50">
          <InteractiveMap places={places as any} isLoggedIn={isLoggedIn} />
        </div>

      </div>
    </main>
  );
}

import Link from "next/link";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { MapPin, Compass, Heart, Star } from "lucide-react";
import BookingButton from "@/components/BookingButton";
import HeartButton from "@/components/HeartButton";

type WishlistRow = {
  id: string;
  place_id: string;
  place_name: string;
  place_category: string;
  place_price: string;
  place_imageUrl: string | null;
  place_description: string | null;
  place_reviews: Array<{ rating: number }>;
};

export default async function WishlistPage() {
  const sessionUser = await getSessionUser();

  // إذا لم يكن مسجلاً، اطرده لصفحة الدخول
  if (!sessionUser) {
    redirect("/login");
  }

  const loggedInUserId = sessionUser.id;

  // 2. جلب المعالم المحفوظة في مفضلة هذا المستخدم تحديداً
  const rawSavedItems = await query<WishlistRow>(
    `SELECT w."id",
            p."id" AS place_id, p."name" AS place_name, p."category" AS place_category,
            p."price" AS place_price, p."imageUrl" AS place_imageUrl, p."description" AS place_description,
            COALESCE(json_agg(json_build_object('rating', r."rating")) FILTER (WHERE r."id" IS NOT NULL), '[]') AS place_reviews
     FROM "Wishlist" w
     JOIN "Place" p ON p."id" = w."placeId"
     LEFT JOIN "Review" r ON r."placeId" = p."id"
     WHERE w."userId" = $1
     GROUP BY w."id", p."id"
     ORDER BY w."createdAt" DESC`,
    [loggedInUserId],
  );

  // تحويل Decimal إلى Number قبل التمرير لمكونات العميل
  const savedItems = rawSavedItems.map((item) => ({
    place: {
      id: item.place_id,
      name: item.place_name,
      category: item.place_category,
      price: Number(item.place_price),
      imageUrl: item.place_imageUrl,
      description: item.place_description,
      reviews: item.place_reviews,
    },
  }));

  return (
    <main className="min-h-screen pb-12 bg-gray-50/30" dir="rtl">
      <div className="mx-auto mt-12 max-w-6xl px-4">
        
        {/* ترويسة الصفحة */}
        <div className="mb-8 flex items-center gap-3 border-b pb-4">
          <div className="bg-red-100 p-3 rounded-full text-red-500 shadow-sm">
            <Heart size={28} className="fill-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">قائمة المفضلة</h1>
            <p className="text-sm text-gray-500 mt-1">المعالم التي تخطط لزيارتها لاحقاً</p>
          </div>
        </div>

        {/* إذا كانت المفضلة فارगة */}
        {savedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 py-24 text-center bg-white shadow-sm">
            <Heart size={64} className="mb-4 text-gray-300" />
            <p className="text-xl font-bold text-gray-700 mb-2">مفضلتك فارगة تماماً</p>
            <p className="text-sm text-gray-500 mb-6">لم تقم بإضافة أي معالم إلى مفضلتك بعد.</p>
            <Link href="/explore" className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 shadow-md">
              <Compass size={20} /> استكشف المعالم الآن
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {savedItems.map(({ place }) => (
              <div key={place.id} className="flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-xl hover:-translate-y-1 duration-300">
                <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-gray-100 text-gray-400">
                  
                  {/* زر القلب مدمج وجاهز لحذف المعلم من المفضلة */}
                  <HeartButton placeId={place.id} initialFavorited={true} />

                  {place.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={place.imageUrl} alt={place.name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" />
                  ) : (
                    <MapPin size={48} className="opacity-30" />
                  )}
                  <span className="absolute right-3 top-3 rounded-full bg-blue-600/90 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
                    {place.category}
                  </span>
                </div>
                
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{place.name}</h3>
                  
                  <div className="flex items-center gap-1 mb-3">
                    <Star size={16} className={place.reviews && place.reviews.length > 0 ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} />
                    <span className="text-sm font-bold text-gray-700">
                      {place.reviews && place.reviews.length > 0 
                        ? (place.reviews.reduce((acc: any, curr: any) => acc + curr.rating, 0) / place.reviews.length).toFixed(1)
                        : "جديد"}
                    </span>
                    <span className="text-xs text-gray-500">({place.reviews ? place.reviews.length : 0} تقييم)</span>
                  </div>

                  <p className="mb-6 flex-1 text-sm text-gray-600 line-clamp-2">{place.description}</p>
                  
                  <div className="mt-auto flex items-center justify-between border-t pt-4">
                    <span className="font-bold text-blue-600 text-lg" dir="ltr">
                      {place.price > 0 ? `${place.price} د.ج` : "مجاني"}
                    </span>
                    <div className="flex items-center gap-2">
                      
                      {/* 💡 التفريق بين المعلم المجاني والمدفوع */}
                      {place.price > 0 ? (
                        <BookingButton placeId={place.id} price={place.price} />
                      ) : (
                        <Link 
                          href="/map" 
                          className="flex items-center gap-1 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700 shadow-sm"
                        >
                          <MapPin size={16} /> عرض المسار
                        </Link>
                      )}

                    </div>
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

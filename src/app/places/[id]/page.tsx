import { queryOne } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PlaceDetailsClient from "@/components/PlaceDetailsClient";

type PlaceRow = {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  virtualTourUrl: string | null;
  userId: string | null;
  user_name: string | null;
  [key: string]: unknown;
};

export default async function PlaceDetailPage({ params }: { params: { id: string } }) {
  // 📥 جلب بيانات المعلم من قاعدة البيانات مع اسم الشريك
  const place = await queryOne<PlaceRow>(
    `SELECT p.*, u."name" AS user_name FROM "Place" p LEFT JOIN "User" u ON u."id" = p."userId" WHERE p."id" = $1`,
    [params.id],
  );

  // 🛑 إذا لم يتم العثور على المعلم، اظهر صفحة 404 تلقائياً
  if (!place) {
    notFound();
  }

  // 🔐 التحقق من حالة تسجيل الدخول عبر جلسة NextAuth الموقّعة
  const sessionUser = await getSessionUser();
  const isLoggedIn = !!sessionUser;

  // 💡 المنطق الذكي لصلاحية التقييم
  let canReview = false;

  if (sessionUser) {
    if (Number(place.price) === 0) {
      // ✅ المعلم مجاني: يُسمح بالتقييم مباشرة
      canReview = true;
    } else {
      // 🛡️ المعلم المدفوع: التقييم يتطلب تذكرة مستخدمة فعلياً (زيارة حقيقية)
      const usedBooking = await queryOne<{ id: string }>(
        `SELECT "id" FROM "Booking" WHERE "userId" = $1 AND "placeId" = $2 AND "status" = 'USED'`,
        [sessionUser.id, place.id],
      );
      canReview = !!usedBooking;
    }
  }

  // تحويل Decimal إلى Number قبل التمرير لمكون العميل (React لا يقبل كائنات Decimal)
  const { user_name, ...placeFields } = place;
  const safePlace = { ...placeFields, price: Number(place.price), user: { name: user_name } };

  return (
    <PlaceDetailsClient
      place={safePlace as any}
      isLoggedIn={isLoggedIn}
      canReview={canReview}
    />
  );
}

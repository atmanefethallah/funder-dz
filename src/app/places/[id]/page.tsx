import { query, queryOne } from "@/lib/db";
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
  user_verification: string | null;
  [key: string]: unknown;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  userName: string;
};

export default async function PlaceDetailPage({ params }: { params: { id: string } }) {
  // 📥 جلب بيانات المعلم من قاعدة البيانات مع اسم وحالة توثيق الشريك
  const place = await queryOne<PlaceRow>(
    `SELECT p.*, u."name" AS user_name, u."verificationStatus" AS user_verification
     FROM "Place" p LEFT JOIN "User" u ON u."id" = p."userId" WHERE p."id" = $1`,
    [params.id],
  );

  // 🛑 إذا لم يتم العثور على المعلم، اظهر صفحة 404 تلقائياً
  if (!place) {
    return notFound();
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

  // ⭐️ جلب قائمة التعليقات ومتوسط التقييم لعرضها تحت المعلم
  const reviewRows = await query<ReviewRow>(
    `SELECT r."id", r."rating", r."comment", r."createdAt", u."name" AS "userName"
     FROM "Review" r JOIN "User" u ON u."id" = r."userId"
     WHERE r."placeId" = $1 ORDER BY r."createdAt" DESC LIMIT 50`,
    [place.id],
  );
  const averageRating = reviewRows.length > 0
    ? Math.round((reviewRows.reduce((acc, r) => acc + r.rating, 0) / reviewRows.length) * 10) / 10
    : 0;

  // تحويل Decimal إلى Number قبل التمرير لمكون العميل (React لا يقبل كائنات Decimal)
  const { user_name, user_verification, roomTypes, ...placeFields } = place;
  const safePlace = {
    ...placeFields,
    price: Number(place.price),
    roomTypes: typeof roomTypes === "string" ? JSON.parse(roomTypes) : roomTypes || undefined,
    user: { id: place.userId, name: user_name, verificationStatus: user_verification },
  };

  return (
    <PlaceDetailsClient
      place={safePlace as any}
      isLoggedIn={isLoggedIn}
      canReview={canReview}
      reviews={reviewRows.map((r) => ({ ...r, createdAt: (r.createdAt as unknown as Date).toString() }))}
      averageRating={averageRating}
    />
  );
}

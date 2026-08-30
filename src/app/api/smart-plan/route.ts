import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { canGenerateSmartPlan, recordUsage } from "@/lib/entitlements";

type ReviewLite = { rating: number };
type PlaceRow = {
  id: string;
  name: string;
  category: string;
  price: string | number;
  latitude: number | null;
  longitude: number | null;
  reviews: ReviewLite[];
  [key: string]: unknown;
};

// 🧠 1. محرك الحسابات الجغرافية (مدمج هنا لتفادي أي أخطاء في الاستيراد)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 9999; // إذا كانت الإحداثيات ناقصة نعطي مسافة بعيدة
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// حساب متوسط التقييمات
function getAverageRating(reviews: ReviewLite[]) {
  if (!reviews || reviews.length === 0) return 4.0;
  return reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
}

// 🚀 2. دالة الاستقبال والتوليد (API Route)
export async function POST(request: Request) {
  try {
    // التحقق من تسجيل الدخول عبر جلسة NextAuth الموقّعة
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: "يرجى تسجيل الدخول أولاً لتوليد الخطة." }, { status: 401 });
    }

    // 💎 بوابة الباقة: حد الخطط الذكية الشهري
    const gate = await canGenerateSmartPlan(sessionUser.id);
    if (!gate.allowed) {
      return NextResponse.json({ message: gate.reason, upgrade: true }, { status: 402 });
    }

    const body = await request.json();
    const budgetTier = body.budget || "MEDIUM";

    // جلب كافة المعالم مع مراجعاتها من قاعدة البيانات
    const allPlacesRaw = await query<PlaceRow>(
      `SELECT p.*,
              COALESCE(json_agg(json_build_object('rating', r."rating")) FILTER (WHERE r."id" IS NOT NULL), '[]') AS reviews
       FROM "Place" p
       LEFT JOIN "Review" r ON r."placeId" = p."id"
       WHERE (p."isEvent" IS NOT TRUE OR p."eventEndsAt" IS NULL OR p."eventEndsAt" > NOW())
       GROUP BY p."id"`,
    );

    // 🛡️ تحويل price إلى Number للمقارنات الحسابية أدناه
    const allPlaces = allPlacesRaw.map((p) => ({ ...p, price: Number(p.price) }));

    if (allPlaces.length === 0) {
      return NextResponse.json({ message: "قاعدة البيانات فارغة! يرجى إضافة معالم سياحية أولاً." }, { status: 404 });
    }

    // تصفية المعالم حسب الميزانية المختارة
    const budgetFiltered = allPlaces.filter((place) => {
      if (budgetTier === "LOW") return place.price === 0 || place.price <= 500;
      if (budgetTier === "MEDIUM") return place.price > 0 && place.price <= 3000;
      return place.price > 3000;
    });

    // إذا لم يجد معالم مطابقة للميزانية، يستخدم كل المعالم المتاحة كحل بديل (Fallback)
    const workingPool = budgetFiltered.length > 0 ? budgetFiltered : allPlaces;

    // فصل الأماكن (أنشطة ترفيهية / مطاعم ومقاهي)
    const activities = workingPool.filter((p) => !["مطعم", "مقهى", "أكل"].includes(p.category));
    const eateries = allPlaces.filter((p) => ["مطعم", "مقهى", "أكل", "فنادق وإقامة"].includes(p.category));

    // تأمين الخوارزمية: إذا لم يتم إضافة مطاعم بعد، استخدم المعالم العادية كبديل مؤقت
    const fallbackActivities = activities.length > 0 ? activities : workingPool;
    const fallbackEateries = eateries.length > 0 ? eateries : workingPool;

    // اختيار الأنشطة الأعلى تقييماً للصباح والمساء
    const sortedActivities = [...fallbackActivities].sort((a, b) => getAverageRating(b.reviews) - getAverageRating(a.reviews));
    const morningActivity = sortedActivities[0] || allPlaces[0];
    const afternoonActivity = sortedActivities[1] || sortedActivities[0] || allPlaces[0];

    // دالة داخلية ذكية لإيجاد أقرب مطعم للنشاط الحالي 🎯
    const findClosestEatery = (referencePlace: PlaceRow) => {
      if (!referencePlace || !referencePlace.latitude) return fallbackEateries[0];
      return (
        [...fallbackEateries]
          .filter((e) => e.id !== referencePlace.id) // تجنب اختيار نفس المكان
          .map((e) => ({
            ...e,
            // 👈 إضافة ?? 0 لتأمين التطبيق من القيم الفارغة (null)
            distance: calculateDistance(
              referencePlace.latitude ?? 0,
              referencePlace.longitude ?? 0,
              e.latitude ?? 0,
              e.longitude ?? 0,
            ),
          }))
          .sort((a, b) => a.distance - b.distance)[0] || fallbackEateries[0] // الترتيب حسب الأقرب بالكيلومتر
      );
    };

    // 🗺️ تجميع خطة اليوم الكاملة
    const itinerary = {
      breakfast: findClosestEatery(morningActivity),
      morningActivity: morningActivity,
      lunch: findClosestEatery(morningActivity), // الغداء قريب من نشاط الصباح
      afternoonActivity: afternoonActivity,
      coffeeTime: findClosestEatery(afternoonActivity), // القهوة قريبة من نشاط المساء
      dinner: findClosestEatery(afternoonActivity),
    };

    // سجّل الاستهلاك ضمن حد الباقة الشهري
    await recordUsage(sessionUser.id, "SMART_PLAN");

    return NextResponse.json(itinerary, { status: 200 });
  } catch (error) {
    console.error("Smart Plan API Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم أثناء تحليل البيانات لتوليد الخطة." }, { status: 500 });
  }
}

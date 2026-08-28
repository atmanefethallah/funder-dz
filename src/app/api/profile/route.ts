import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { getActiveSubscription, getPlanFeatures } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  balance: string;
  verificationStatus: string;
  [key: string]: unknown;
};

type BookingWithPlaceRow = {
  id: string;
  userId: string;
  placeId: string;
  amount: string;
  status: string;
  qrToken: string;
  createdAt: Date;
  place_id: string;
  place_name: string;
  place_category: string;
  place_imageUrl: string;
  place_price: string;
};

// 🔍 جلب بيانات الحساب — قراءة نقية بلا آثار جانبية
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json(null, { status: 401 });

    const user = await queryOne<UserRow>(
      `SELECT "id", "name", "email", "phone", "role", "balance", "verificationStatus", "commercialRegistry", "idCard", "createdAt"
       FROM "User" WHERE "id" = $1`,
      [sessionUser.id],
    );

    if (!user) return NextResponse.json(null, { status: 404 });

    const bookingRows = await query<BookingWithPlaceRow>(
      `SELECT b."id", b."userId", b."placeId", b."amount", b."status", b."qrToken", b."createdAt",
              p."id" AS "place_id", p."name" AS "place_name", p."category" AS "place_category",
              p."imageUrl" AS "place_imageUrl", p."price" AS "place_price"
       FROM "Booking" b
       JOIN "Place" p ON p."id" = b."placeId"
       WHERE b."userId" = $1
       ORDER BY b."createdAt" DESC
       LIMIT 50`,
      [sessionUser.id],
    );

    const bookings = bookingRows.map((b) => ({
      id: b.id,
      userId: b.userId,
      placeId: b.placeId,
      amount: b.amount,
      status: b.status,
      qrToken: b.qrToken,
      createdAt: b.createdAt,
      place: {
        id: b.place_id,
        name: b.place_name,
        category: b.place_category,
        imageUrl: b.place_imageUrl,
        price: Number(b.place_price),
      },
    }));

    // أرفق بيانات الاشتراك الحالي وميزاته الفعالة
    const sub = await getActiveSubscription(sessionUser.id);
    const planInfo = await getPlanFeatures(sessionUser.id, user.role);

    return NextResponse.json({
      ...user,
      balance: Number(user.balance),
      bookings,
      subscription: sub
        ? {
            status: sub.status,
            billingCycle: sub.billingCycle,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            planName: sub.plan.name,
            planKey: sub.plan.key,
          }
        : null,
      planName: planInfo.planName,
      planFeatures: planInfo.features,
      isPaid: planInfo.isPaid,
    });
  } catch (error) {
    console.error("❌ خطأ أثناء جلب بيانات الملف الشخصي:", error);
    return NextResponse.json(null, { status: 500 });
  }
}

// ✏️ تعديل بيانات الحساب
export async function PUT(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: "يرجى تسجيل الدخول أولاً" }, { status: 401 });
    }

    const data = await req.json().catch(() => null);
    const name = typeof data?.name === "string" ? data.name.trim() : "";
    const phone = typeof data?.phone === "string" ? data.phone.trim() : "";

    if (!name) {
      return NextResponse.json(
        { message: "اسم الحساب لا يمكن أن يكون فارगاً" },
        { status: 400 }
      );
    }
    if (name.length > 60) {
      return NextResponse.json({ message: "الاسم طويل جداً" }, { status: 400 });
    }
    if (phone && !/^[+0-9\s-]{6,20}$/.test(phone)) {
      return NextResponse.json(
        { message: "رقم الهاتف गير صالح" },
        { status: 400 }
      );
    }

    const updatedUser = await queryOne(
      `UPDATE "User" SET "name" = $1, "phone" = $2 WHERE "id" = $3
       RETURNING "id", "name", "email", "phone", "role"`,
      [name, phone || null, sessionUser.id],
    );

    return NextResponse.json({ message: "تم تحديث بياناتك بنجاح ✅", user: updatedUser });
  } catch (error) {
    console.error("Profile PUT Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

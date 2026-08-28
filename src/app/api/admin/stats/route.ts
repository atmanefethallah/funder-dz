import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

type BookingStatsRow = {
  status: string;
  amount: string;
  place_price: string;
};

export async function GET() {
  try {
    const admin = await requireRole("ADMIN");
    if (!admin) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });

    const usersCountRow = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "User"`);
    const placesCountRow = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "Place"`);

    const bookings = await query<BookingStatsRow>(
      `SELECT b."status", b."amount", p."price" AS place_price
       FROM "Booking" b
       JOIN "Place" p ON p."id" = b."placeId"`,
    );

    // 🛡️ الإصلاح المحاسبي: الإيراد = العربون المحصّل فعلاً عبر المحفظة (booking.amount)
    // وليس السعر الكامل للمعلم — الباقي نقداً عند البوابة ولا تسجّله المنصة كإيراد محصّل.
    let collectedDeposits = 0;
    let potentialGross = 0; // القيمة الإجمالية المحتملة (للعرض الإعلامي فقط)
    let successfulBookings = 0;

    for (const b of bookings) {
      if (b.status === "CONFIRMED" || b.status === "USED") {
        collectedDeposits += Number(b.amount);
        potentialGross += Number(b.place_price);
        successfulBookings++;
      }
    }

    return NextResponse.json({
      users: usersCountRow ? parseInt(usersCountRow.count, 10) : 0,
      places: placesCountRow ? parseInt(placesCountRow.count, 10) : 0,
      bookings: successfulBookings,
      revenue: Math.round(collectedDeposits * 100) / 100, // المحصّل الفعلي
      potentialGross: Math.round(potentialGross * 100) / 100, // القيمة السوقية الإجمالية
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json({ message: "خطأ في الخادم" }, { status: 500 });
  }
}

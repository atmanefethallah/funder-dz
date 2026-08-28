import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/session";

type ScanBookingRow = {
  id: string;
  amount: string;
  status: string;
  place_userId: string;
  place_name: string;
  place_price: string;
  user_name: string;
};

// الماسح الضوئي للشريك — يتحقق ويستهلك التذكرة ذرّياً برمز qrToken السري
export async function POST(request: Request) {
  try {
    const sessionUser = await requireRole("PARTNER", "ADMIN");
    if (!sessionUser) {
      return NextResponse.json({ message: "गير مصرح لك" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const qrToken = typeof body?.qrToken === "string" ? body.qrToken.trim() : "";
    if (!qrToken) {
      return NextResponse.json({ message: "رمز QR فارग" }, { status: 400 });
    }

    // البحث برمز QR السري وليس بمعرّف الحجز القابل للتخمين
    const booking = await queryOne<ScanBookingRow>(
      `SELECT b."id", b."amount", b."status",
              p."userId" AS "place_userId", p."name" AS "place_name", p."price" AS "place_price",
              u."name" AS "user_name"
       FROM "Booking" b
       JOIN "Place" p ON p."id" = b."placeId"
       JOIN "User" u ON u."id" = b."userId"
       WHERE b."qrToken" = $1`,
      [qrToken],
    );

    if (!booking) {
      return NextResponse.json({ message: "❌ رمز QR गير صالح أو مزيف!" }, { status: 404 });
    }

    if (sessionUser.role !== "ADMIN" && booking.place_userId !== sessionUser.id) {
      return NextResponse.json(
        { message: "❌ هذه التذكرة لا تتبع لمعالمك السياحية!" },
        { status: 403 }
      );
    }

    if (booking.status === "USED") {
      return NextResponse.json(
        { message: "⚠️ التذكرة صحيحة، ولكن تم استخدامها ومسحها مسبقاً!" },
        { status: 400 }
      );
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json({ message: "⚠️ التذكرة गير مؤكدة بعد!" }, { status: 400 });
    }

    // 🛡️ استهلاك ذرّي: التحديث ينجح فقط إذا كانت الحالة ما تزال CONFIRMED
    const consumed = await query(
      `UPDATE "Booking" SET "status" = 'USED' WHERE "id" = $1 AND "status" = 'CONFIRMED' RETURNING "id"`,
      [booking.id],
    );
    if (consumed.length === 0) {
      return NextResponse.json(
        { message: "⚠️ تم مسح هذه التذكرة للتو من جهاز آخر!" },
        { status: 400 }
      );
    }

    const remainingAmount = Math.max(Number(booking.place_price) - Number(booking.amount), 0);

    return NextResponse.json({
      message: `✅ تذكرة صالحة! السائح: ${booking.user_name}`,
      touristName: booking.user_name,
      placeName: booking.place_name,
      remainingAmount,
    });
  } catch (error) {
    console.error("Scanner Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

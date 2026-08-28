import { NextResponse } from "next/server";
import { query, queryOne, withTransaction } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { recordLedger } from "@/lib/ledger";

type PartnerBookingRow = {
  id: string;
  userId: string;
  placeId: string;
  amount: string;
  status: string;
  qrToken: string;
  createdAt: Date;
  user_name: string;
  user_email: string;
  place_name: string;
};

// 🔍 جلب الحجوزات الخاصة بمعالم هذا الشريك فقط
export async function GET() {
  try {
    const sessionUser = await requireRole("PARTNER", "ADMIN");
    if (!sessionUser) {
      return NextResponse.json({ message: "गير مصرح" }, { status: 403 });
    }

    const rows = await query<PartnerBookingRow>(
      `SELECT b."id", b."userId", b."placeId", b."amount", b."status", b."qrToken", b."createdAt",
              u."name" AS "user_name", u."email" AS "user_email",
              p."name" AS "place_name"
       FROM "Booking" b
       JOIN "User" u ON u."id" = b."userId"
       JOIN "Place" p ON p."id" = b."placeId"
       WHERE p."userId" = $1
       ORDER BY b."createdAt" DESC
       LIMIT 200`,
      [sessionUser.id],
    );

    const partnerBookings = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      placeId: r.placeId,
      amount: r.amount,
      status: r.status,
      qrToken: r.qrToken,
      createdAt: r.createdAt,
      user: { name: r.user_name, email: r.user_email },
      place: { name: r.place_name },
    }));

    return NextResponse.json(partnerBookings);
  } catch (error) {
    console.error("GET Partner Bookings Error:", error);
    return NextResponse.json({ message: "خطأ في السيرفر" }, { status: 500 });
  }
}

// 🔄 قبول أو رفض الحجز
export async function PUT(request: Request) {
  try {
    const sessionUser = await requireRole("PARTNER", "ADMIN");
    if (!sessionUser) {
      return NextResponse.json(
        { message: "गير مصرح — هذه العملية للشركاء فقط" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const bookingId = body?.bookingId;
    const action = body?.action;

    if (!bookingId || !["CONFIRMED", "REJECTED"].includes(action)) {
      return NextResponse.json({ message: "طلب गير صالح" }, { status: 400 });
    }

    const booking = await queryOne<{
      id: string;
      userId: string;
      amount: string;
      status: string;
      place_userId: string;
      place_name: string;
    }>(
      `SELECT b."id", b."userId", b."amount", b."status",
              p."userId" AS "place_userId", p."name" AS "place_name"
       FROM "Booking" b
       JOIN "Place" p ON p."id" = b."placeId"
       WHERE b."id" = $1`,
      [bookingId],
    );
    if (!booking) {
      return NextResponse.json({ message: "الحجز गير موجود" }, { status: 404 });
    }

    if (sessionUser.role !== "ADMIN" && booking.place_userId !== sessionUser.id) {
      return NextResponse.json({ message: "هذا الحجز لا يخص معالمك" }, { status: 403 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json({ message: "هذا الحجز تمت معالجته مسبقاً" }, { status: 400 });
    }

    if (action === "CONFIRMED") {
      await withTransaction(async (tx) => {
        await tx.query(`UPDATE "Booking" SET "status" = 'CONFIRMED' WHERE "id" = $1`, [bookingId]);
        await tx.query(
          `INSERT INTO "Notification" ("userId", "title", "message", "link") VALUES ($1, $2, $3, $4)`,
          [
            booking.userId,
            "✅ تم تأكيد حجزك بنجاح!",
            `رائع! وافق الشريك على حجزك في "${booking.place_name}". تذكرتك الإلكترونية (QR) جاهزة الآن في حسابك.`,
            "/profile",
          ],
        );
      });

      return NextResponse.json({ message: "تم تأكيد الحجز بنجاح ويتوفر الآن رمز QR للسائح! 🎉" });
    }

    // action === "REJECTED"
    const amount = Number(booking.amount);

    await withTransaction(async (tx) => {
      await tx.query(`UPDATE "Booking" SET "status" = 'REJECTED' WHERE "id" = $1`, [bookingId]);

      if (amount > 0) {
        await tx.query(`UPDATE "User" SET "balance" = "balance" - $1 WHERE "id" = $2`, [amount, booking.place_userId]);
        await recordLedger(tx, {
          userId: booking.place_userId,
          type: "PARTNER_REFUND_DEDUCTION",
          direction: "DEBIT",
          amount,
          reference: booking.id,
          note: `خصم استرداد عربون حجز مرفوض: ${booking.place_name}`,
        });

        await tx.query(`UPDATE "User" SET "balance" = "balance" + $1 WHERE "id" = $2`, [amount, booking.userId]);
        await recordLedger(tx, {
          userId: booking.userId,
          type: "BOOKING_REFUND",
          direction: "CREDIT",
          amount,
          reference: booking.id,
          note: `استرداد عربون حجز مرفوض: ${booking.place_name}`,
        });
      }

      await tx.query(
        `INSERT INTO "Notification" ("userId", "title", "message", "link") VALUES ($1, $2, $3, $4)`,
        [
          booking.userId,
          "❌ تعذر قبول طلب حجزك",
          `عذراً، رفض الشريك طلب الحجز في "${booking.place_name}". تمت إعادة مبلग العربون (${amount} د.ج) إلى محفظتك.`,
          "/profile",
        ],
      );
    });

    return NextResponse.json({ message: "تم رفض الحجز وإعادة المبلग إلى محفظة السائح بنجاح." });
  } catch (error) {
    console.error("PUT Partner Bookings Error:", error);
    return NextResponse.json(
      { message: "خطأ في السيرفر أثناء تحديد حالة الحجز" },
      { status: 500 }
    );
  }
}

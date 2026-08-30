import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { withTransaction } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { recordLedger } from "@/lib/ledger";
import { rateLimit } from "@/lib/rate-limit";

type RoomType = { name: string; price: number };
type PlaceRow = {
  id: string;
  name: string;
  price: string;
  userId: string;
  roomTypes: RoomType[] | null;
  isEvent: boolean;
  eventEndsAt: Date | null;
};

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ message: "يرجى تسجيل الدخول" }, { status: 401 });

    const rl = rateLimit(`booking:${sessionUser.id}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ message: `محاولات كثيرة جداً. حاول مرة أخرى بعد ${rl.retryAfterSec} ثانية.` }, { status: 429 });
    }
    if (sessionUser.role === "PARTNER") {
      return NextResponse.json({ message: "حسابات الشركاء مخصصة لإدارة المعالم فقط." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const placeId = body?.placeId;
    const tickets = Number(body?.tickets ?? 1);
    const requestedRoomType = typeof body?.roomType === "string" ? body.roomType.trim() : null;
    if (!placeId || typeof placeId !== "string") {
      return NextResponse.json({ message: "معرف المعلم غير صالح" }, { status: 400 });
    }
    if (!Number.isInteger(tickets) || tickets < 1 || tickets > 20) {
      return NextResponse.json({ message: "العدد المطلوب يجب أن يكون بين 1 و20" }, { status: 400 });
    }

    const bookingId = await withTransaction(async (tx) => {
      const placeRes = await tx.query<PlaceRow>(
        `SELECT "id", "name", "price", "userId", "roomTypes", "isEvent", "eventEndsAt"
         FROM "Place" WHERE "id" = $1 FOR SHARE`,
        [placeId],
      );
      const place = placeRes.rows[0];
      if (!place) throw new Error("المعلم غير موجود");
      if (place.isEvent && place.eventEndsAt && new Date(place.eventEndsAt) <= new Date()) {
        throw new Error("انتهت هذه الفعالية ولم يعد الحجز متاحاً");
      }

      const roomTypes = Array.isArray(place.roomTypes) ? place.roomTypes : [];
      let roomType: string | null = null;
      let unitPrice = Number(place.price);
      if (roomTypes.length > 0) {
        const selected = roomTypes.find((item) => item.name === requestedRoomType);
        if (!selected) throw new Error("يرجى اختيار نوع غرفة صالح");
        roomType = selected.name;
        unitPrice = Number(selected.price);
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error("سعر الحجز غير صالح");

      const existingActiveRes = await tx.query(
        `SELECT "id" FROM "Booking" WHERE "userId" = $1 AND "placeId" = $2 AND "status" IN ('PENDING', 'CONFIRMED') LIMIT 1`,
        [sessionUser.id, placeId],
      );
      if (existingActiveRes.rows.length > 0) {
        throw new Error("لديك حجز نشط بالفعل لهذا المعلم. راجع تذاكرك في حسابك.");
      }

      const fullPrice = Math.round(unitPrice * tickets * 100) / 100;
      const deposit = Math.round(fullPrice * 0.1 * 100) / 100;
      if (deposit > 0) {
        const debitedRes = await tx.query(
          `UPDATE "User" SET "balance" = "balance" - $1 WHERE "id" = $2 AND "balance" >= $1`,
          [deposit, sessionUser.id],
        );
        if (debitedRes.rowCount === 0) throw new Error("رصيدك غير كافِ لإتمام هذا الحجز.");

        await recordLedger(tx, {
          userId: sessionUser.id,
          type: "BOOKING_DEPOSIT",
          direction: "DEBIT",
          amount: deposit,
          reference: placeId,
          note: `عربون حجز: ${place.name}`,
        });
        await tx.query(`UPDATE "User" SET "balance" = "balance" + $1 WHERE "id" = $2`, [deposit, place.userId]);
        await recordLedger(tx, {
          userId: place.userId,
          type: "PARTNER_EARNING",
          direction: "CREDIT",
          amount: deposit,
          reference: placeId,
          note: `عربون مستلم من حجز: ${place.name}`,
        });
      }

      const qrToken = randomBytes(24).toString("base64url");
      const inserted = await tx.query<{ id: string }>(
        `INSERT INTO "Booking"
           ("userId", "placeId", "amount", "qrToken", "status", "tickets", "roomType", "roomPrice")
         VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7)
         RETURNING "id"`,
        [sessionUser.id, placeId, deposit, qrToken, tickets, roomType, roomType ? unitPrice : null],
      );

      await tx.query(
        `INSERT INTO "Notification" ("userId", "title", "message", "link") VALUES ($1, $2, $3, $4)`,
        [place.userId, "🔔 طلب حجز جديد!", `طلب حجز جديد في "${place.name}"${roomType ? ` — ${roomType}` : ""}.`, "/partner/bookings"],
      );
      return inserted.rows[0].id;
    });

    return NextResponse.json({ message: "تم الحجز بالعربون بنجاح! 🎉", bookingId }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = (error as { message?: string })?.message || "حدث خطأ في الخادم";
    const isClientError = ["غير موجود", "غير كاف", "حجز نشط", "نوع غرفة", "انتهت", "سعر الحجز"].some((text) => errorMessage.includes(text));
    return NextResponse.json({ message: errorMessage }, { status: isClientError ? 400 : 500 });
  }
}

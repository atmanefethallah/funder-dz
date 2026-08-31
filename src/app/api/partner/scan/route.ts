import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";
import { extractTicketToken } from "@/lib/ticketToken";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const partner = await requireRole("PARTNER");
  if (!partner)
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const token = extractTicketToken(String(body?.qrToken || body?.value || ""));
  if (!token || token.length > 512)
    return NextResponse.json(
      { error: "رمز QR غير صالح", result: "INVALID" },
      { status: 400 },
    );

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // النظام الجديد: Ticket مستقل مع سجل لكل محاولة مسح.
    let modernTicket: any;
    try {
      const modern = await client.query(
        `SELECT t."id", t."status", t."bookingId", p."userId" AS "ownerId", p."name" AS "placeName"
         FROM "Ticket" t
         JOIN "Booking" b ON b."id" = t."bookingId"
         JOIN "Place" p ON p."id" = b."placeId"
         WHERE t."secureToken" = $1
         FOR UPDATE OF t`,
        [token],
      );
      modernTicket = modern.rows[0];
    } catch (error: any) {
      if (error?.code !== "42P01") throw error;
    }

    if (modernTicket) {
      if (modernTicket.ownerId !== partner.id) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "هذه التذكرة لا تخص منشأتك", result: "INVALID" },
          { status: 403 },
        );
      }

      const result =
        modernTicket.status === "VALID"
          ? "VALID"
          : modernTicket.status === "USED"
            ? "USED"
            : modernTicket.status === "CANCELLED"
              ? "CANCELLED"
              : "INVALID";
      if (result === "VALID") {
        await client.query(
          `UPDATE "Ticket" SET "status" = 'USED', "usedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
          [modernTicket.id],
        );
      }
      await client.query(
        `INSERT INTO "TicketScan" ("id", "ticketId", "scannedById", "result", "deviceInfo") VALUES ($1,$2,$3,$4,$5)`,
        [
          randomUUID(),
          modernTicket.id,
          partner.id,
          result,
          request.headers.get("user-agent")?.slice(0, 500) || null,
        ],
      );
      await client.query("COMMIT");

      if (result === "VALID")
        return NextResponse.json({
          success: true,
          result: "VALID",
          status: "USED",
          message: "تم التحقق وتسجيل الدخول بنجاح",
          placeName: modernTicket.placeName,
        });
      return NextResponse.json(
        {
          success: false,
          result,
          error:
            result === "USED"
              ? "تم استخدام هذه التذكرة سابقاً"
              : result === "CANCELLED"
                ? "هذه التذكرة ملغاة"
                : "التذكرة غير صالحة",
        },
        { status: 409 },
      );
    }

    // توافق كامل مع التذاكر القديمة المخزنة داخل Booking.
    const legacy = await client.query(
      `SELECT b."id", b."status", b."placeId", p."userId" AS "ownerId", p."name" AS "placeName"
       FROM "Booking" b JOIN "Place" p ON p."id" = b."placeId"
       WHERE b."qrToken" = $1 FOR UPDATE OF b`,
      [token],
    );
    const booking = legacy.rows[0];
    if (!booking) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "التذكرة غير موجودة", result: "INVALID" },
        { status: 404 },
      );
    }
    if (booking.ownerId !== partner.id) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "هذه التذكرة لا تخص منشأتك", result: "INVALID" },
        { status: 403 },
      );
    }
    if (booking.status === "USED") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "تم استخدام هذه التذكرة سابقاً", result: "USED" },
        { status: 409 },
      );
    }
    if (
      [
        "REJECTED",
        "CANCELLED",
        "CANCELLED_BY_GUEST",
        "CANCELLED_BY_PARTNER",
      ].includes(booking.status)
    ) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "هذه التذكرة ملغاة", result: "CANCELLED" },
        { status: 409 },
      );
    }
    if (booking.status !== "CONFIRMED") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "التذكرة غير مؤكدة", result: "INVALID" },
        { status: 409 },
      );
    }

    const updated = await client.query(
      `UPDATE "Booking" SET "status" = 'USED', "bookingStatus" = 'COMPLETED', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1 AND "status" = 'CONFIRMED' RETURNING "id"`,
      [booking.id],
    );
    if (updated.rowCount !== 1) throw new Error("Atomic ticket update failed");
    await client.query("COMMIT");
    return NextResponse.json({
      success: true,
      result: "VALID",
      status: "USED",
      message: "تم التحقق من التذكرة وتسجيل الدخول بنجاح",
      placeName: booking.placeName,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    console.error("Ticket scan error:", error);
    return NextResponse.json(
      { error: "تعذر التحقق من التذكرة", result: "INVALID" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

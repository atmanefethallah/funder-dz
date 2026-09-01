import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireRole } from "@/lib/session";

const text = (v: unknown, max = 5000) =>
  String(v ?? "")
    .trim()
    .slice(0, max);
const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// تعديل فعالية قائمة. لا يحذف أي نوع تذكرة مرتبط بحجوزات، بل يعطله (status=INACTIVE)
// للحفاظ على سلامة الحجوزات الموجودة (قيد Booking_ticketTypeId_fkey ON DELETE RESTRICT).
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const actor = await requireRole("PARTNER", "ADMIN");
  if (!actor)
    return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  const placeId = params.id;
  const body = await request.json().catch(() => null);
  if (!body)
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });

  const startAt = new Date(body.startAt);
  const endAt = new Date(body.endAt);
  const latitude = num(body.latitude, NaN);
  const longitude = num(body.longitude, NaN);
  const ticketTypes = Array.isArray(body.ticketTypes)
    ? body.ticketTypes.slice(0, 30)
    : [];
  if (
    !text(body.name, 120) ||
    !text(body.organizer, 120) ||
    Number.isNaN(startAt.getTime()) ||
    Number.isNaN(endAt.getTime()) ||
    endAt <= startAt ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    ticketTypes.length === 0
  )
    return NextResponse.json(
      { message: "أكمل بيانات الفعالية والموقع ونوع تذكرة واحداً" },
      { status: 400 },
    );

  try {
    await withTransaction(async (tx) => {
      const existing = await tx.query<{ id: string; userId: string }>(
        `SELECT p."id", p."userId" FROM "Place" p WHERE p."id" = $1 AND p."itemType" = 'EVENT' FOR UPDATE`,
        [placeId],
      );
      const place = existing.rows[0];
      if (!place) throw new Error("الفعالية غير موجودة");
      if (place.userId !== actor.id && actor.role !== "ADMIN")
        throw new Error("غير مصرح لك بتعديل هذه الفعالية");

      await tx.query(
        `UPDATE "Place" SET "name"=$1,"description"=$2,"coverImageUrl"=$3,"virtualTourUrl"=$4,"latitude"=$5,"longitude"=$6,"eventEndsAt"=$7,"state"=$8,"municipality"=$9,"address"=$10,"videoUrl"=$11,"updatedAt"=NOW() WHERE "id"=$12`,
        [
          text(body.name, 120),
          text(body.description),
          text(body.coverImageUrl, 200000),
          text(body.virtualTourUrl, 1000) || null,
          latitude,
          longitude,
          endAt.toISOString(),
          text(body.state, 100),
          text(body.municipality, 100),
          text(body.address, 500),
          text(body.videoUrl, 1000),
          placeId,
        ],
      );

      const eventRes = await tx.query<{ id: string }>(
        `SELECT "id" FROM "EventDetail" WHERE "placeId" = $1`,
        [placeId],
      );
      const eventId = eventRes.rows[0]?.id;
      if (!eventId) throw new Error("تعذر العثور على تفاصيل الفعالية");

      await tx.query(
        `UPDATE "EventDetail" SET "eventType"=$1,"organizer"=$2,"startAt"=$3,"endAt"=$4,"doorsOpenAt"=$5,"minimumAge"=$6,"targetAudience"=$7,"program"=$8,"attendanceTerms"=$9 WHERE "id"=$10`,
        [
          text(body.eventType, 100) || "OTHER",
          text(body.organizer, 120),
          startAt.toISOString(),
          endAt.toISOString(),
          body.doorsOpenAt ? new Date(body.doorsOpenAt).toISOString() : null,
          body.minimumAge ? num(body.minimumAge) : null,
          text(body.targetAudience, 500),
          text(body.program, 5000),
          text(body.attendanceTerms, 3000),
          eventId,
        ],
      );

      const sessionRes = await tx.query<{ id: string }>(
        `SELECT "id" FROM "EventSession" WHERE "eventId" = $1 ORDER BY "createdAt" ASC LIMIT 1`,
        [eventId],
      );
      let sessionId = sessionRes.rows[0]?.id;
      if (sessionId) {
        await tx.query(
          `UPDATE "EventSession" SET "name"=$1,"startAt"=$2,"endAt"=$3,"doorsOpenAt"=$4,"capacity"=$5 WHERE "id"=$6`,
          [
            text(body.sessionName, 120) || "الجلسة الرئيسية",
            startAt.toISOString(),
            endAt.toISOString(),
            body.doorsOpenAt ? new Date(body.doorsOpenAt).toISOString() : null,
            body.capacity ? num(body.capacity) : null,
            sessionId,
          ],
        );
      } else {
        sessionId = randomUUID();
        await tx.query(
          `INSERT INTO "EventSession" ("id","eventId","name","startAt","endAt","doorsOpenAt","capacity") VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            sessionId,
            eventId,
            text(body.sessionName, 120) || "الجلسة الرئيسية",
            startAt.toISOString(),
            endAt.toISOString(),
            body.doorsOpenAt ? new Date(body.doorsOpenAt).toISOString() : null,
            body.capacity ? num(body.capacity) : null,
          ],
        );
      }

      const keptTicketIds: string[] = [];
      for (const t of ticketTypes) {
        const quantity = Math.trunc(num(t.quantity));
        const price = num(t.price, NaN);
        if (
          !text(t.name, 100) ||
          quantity < 0 ||
          !Number.isFinite(price) ||
          price < 0
        )
          throw new Error("بيانات نوع التذكرة غير صالحة");

        let ticketId = typeof t.id === "string" ? t.id : null;
        if (ticketId) {
          const owned = await tx.query<{
            id: string;
            quantity: number;
            availableQuantity: number;
          }>(
            `SELECT "id","quantity","availableQuantity" FROM "TicketType" WHERE "id" = $1 AND "eventId" = $2`,
            [ticketId, eventId],
          );
          if (owned.rows.length === 0) ticketId = null;
          else {
            // نحافظ على عدد التذاكر المحجوزة بالفعل ولا نقلل المخزون أقل مما بيع بالفعل.
            const sold =
              owned.rows[0].quantity - owned.rows[0].availableQuantity;
            const newAvailable = Math.max(0, quantity - sold);
            await tx.query(
              `UPDATE "TicketType" SET "name"=$1,"description"=$2,"price"=$3,"quantity"=$4,"availableQuantity"=$5,"capacity"=$6,"saleStart"=$7,"saleEnd"=$8,"bookingMode"=$9,"refundPolicy"=$10,"refundValue"=$11,"status"='ACTIVE' WHERE "id"=$12`,
              [
                text(t.name, 100),
                text(t.description),
                price,
                Math.max(quantity, sold),
                newAvailable,
                t.capacity ? num(t.capacity) : Math.max(quantity, sold),
                t.saleStart ? new Date(t.saleStart).toISOString() : null,
                t.saleEnd
                  ? new Date(t.saleEnd).toISOString()
                  : startAt.toISOString(),
                text(t.bookingMode, 30) || "PURCHASE",
                text(t.refundPolicy, 50) || "NO_CANCELLATION",
                t.refundValue ? num(t.refundValue) : null,
                ticketId,
              ],
            );
          }
        }
        if (!ticketId) {
          ticketId = randomUUID();
          await tx.query(
            `INSERT INTO "TicketType" ("id","eventId","eventSessionId","name","description","price","quantity","availableQuantity","capacity","saleStart","saleEnd","bookingMode","refundPolicy","refundValue","status") VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,$11,$12,$13,'ACTIVE')`,
            [
              ticketId,
              eventId,
              sessionId,
              text(t.name, 100),
              text(t.description),
              price,
              quantity,
              t.capacity ? num(t.capacity) : quantity,
              t.saleStart ? new Date(t.saleStart).toISOString() : null,
              t.saleEnd
                ? new Date(t.saleEnd).toISOString()
                : startAt.toISOString(),
              text(t.bookingMode, 30) || "PURCHASE",
              text(t.refundPolicy, 50) || "NO_CANCELLATION",
              t.refundValue ? num(t.refundValue) : null,
            ],
          );
        }
        keptTicketIds.push(ticketId);
      }
      if (keptTicketIds.length > 0) {
        await tx.query(
          `UPDATE "TicketType" SET "status"='INACTIVE' WHERE "eventId"=$1 AND "id" <> ALL($2::text[])`,
          [eventId, keptTicketIds],
        );
      }

      await tx.query(
        `INSERT INTO "AuditLog" ("id","actorId","action","entityType","entityId") VALUES ($1,$2,'EVENT_UPDATED','EventDetail',$3)`,
        [randomUUID(), actor.id, eventId],
      );
    });
    return NextResponse.json({ message: "تم تحديث الفعالية بنجاح", placeId });
  } catch (error: any) {
    console.error("Event update:", error);
    return NextResponse.json(
      { message: error?.message || "تعذر تحديث الفعالية" },
      { status: 400 },
    );
  }
}

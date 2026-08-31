import { randomBytes, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { canCreatePlace } from "@/lib/entitlements";

const text = (v: unknown, max = 5000) =>
  String(v ?? "")
    .trim()
    .slice(0, max);
const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export async function POST(request: Request) {
  const actor = await requireRole("PARTNER", "ADMIN");
  if (!actor)
    return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body)
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  const gate = await canCreatePlace(actor.id);
  if (!gate.allowed)
    return NextResponse.json({ message: gate.reason }, { status: 402 });
  const startAt = new Date(body.startAt),
    endAt = new Date(body.endAt);
  const latitude = num(body.latitude, NaN),
    longitude = num(body.longitude, NaN);
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
    const placeId = await withTransaction(async (tx) => {
      const p = await tx.query<{ id: string }>(
        `INSERT INTO "Place" ("name","category","description","price","imageUrl","virtualTourUrl","latitude","longitude","userId","isEvent","eventEndsAt","roomTypes","itemType","state","municipality","address","videoUrl") VALUES ($1,'فعالية',$2,0,$3,$4,$5,$6,$7,true,$8,'[]'::jsonb,'EVENT',$9,$10,$11,$12) RETURNING "id"`,
        [
          text(body.name, 120),
          text(body.description),
          text(body.coverImageUrl, 200000),
          text(body.virtualTourUrl, 1000) || null,
          latitude,
          longitude,
          actor.id,
          endAt.toISOString(),
          text(body.state, 100),
          text(body.municipality, 100),
          text(body.address, 500),
          text(body.videoUrl, 1000),
        ],
      );
      const id = p.rows[0].id,
        eventId = randomUUID();
      await tx.query(
        `INSERT INTO "EventDetail" ("id","placeId","eventType","organizer","startAt","endAt","doorsOpenAt","minimumAge","targetAudience","program","attendanceTerms","status") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PUBLISHED')`,
        [
          eventId,
          id,
          text(body.eventType, 100) || "OTHER",
          text(body.organizer, 120),
          startAt.toISOString(),
          endAt.toISOString(),
          body.doorsOpenAt ? new Date(body.doorsOpenAt).toISOString() : null,
          body.minimumAge ? num(body.minimumAge) : null,
          text(body.targetAudience, 500),
          text(body.program, 5000),
          text(body.attendanceTerms, 3000),
        ],
      );
      const sessionId = randomUUID();
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
        await tx.query(
          `INSERT INTO "TicketType" ("id","eventId","eventSessionId","name","description","price","quantity","availableQuantity","capacity","saleStart","saleEnd","bookingMode","refundPolicy","refundValue","status") VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,$11,$12,$13,'ACTIVE')`,
          [
            randomUUID(),
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
      await tx.query(
        `INSERT INTO "AuditLog" ("id","actorId","action","entityType","entityId") VALUES ($1,$2,'EVENT_CREATED','EventDetail',$3)`,
        [randomUUID(), actor.id, eventId],
      );
      return id;
    });
    return NextResponse.json(
      { message: "تم إنشاء الفعالية وأنواع التذاكر", placeId },
      { status: 201 },
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: error?.message || "تعذر إنشاء الفعالية" },
      { status: 400 },
    );
  }
}

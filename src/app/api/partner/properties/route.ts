import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { canCreatePlace } from "@/lib/entitlements";

const propertyTypes = new Set([
  "HOTEL",
  "HOTEL_RESIDENCE",
  "TOURIST_RESIDENCE",
  "APARTMENTS",
  "GUEST_HOUSE",
  "HOSTEL",
  "RESORT",
  "CAMP",
  "OTHER",
]);
const mealPlans = new Set([
  "NONE",
  "BREAKFAST",
  "HALF_BOARD",
  "FULL_BOARD",
  "ALL_INCLUSIVE",
]);
const paymentPolicies = new Set([
  "PAY_AT_PROPERTY",
  "FULL",
  "DEPOSIT",
  "PARTIAL",
  "PAY_LATER",
]);

const text = (value: unknown, max = 5000) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
const finite = (value: unknown, fallback = 0) => {
  const n = Number(value);
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
    return NextResponse.json(
      { message: gate.reason, upgrade: true },
      { status: 402 },
    );

  const name = text(body.name, 120);
  const description = text(body.description);
  const latitude = finite(body.latitude, NaN);
  const longitude = finite(body.longitude, NaN);
  const rooms = Array.isArray(body.rooms) ? body.rooms.slice(0, 50) : [];
  if (
    !name ||
    !propertyTypes.has(body.propertyType) ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    rooms.length === 0
  ) {
    return NextResponse.json(
      { message: "أكمل اسم المنشأة ونوعها وموقعها ونوع غرفة واحداً على الأقل" },
      { status: 400 },
    );
  }

  try {
    const result = await withTransaction(async (tx) => {
      const place = await tx.query<{ id: string }>(
        `INSERT INTO "Place" ("name","category","description","price","imageUrl","virtualTourUrl","latitude","longitude","userId","isEvent","roomTypes","itemType","propertyType","officialClassification","stars","shortDescription","phone","whatsapp","email","website","logoUrl","coverImageUrl","videoUrl","state","municipality","address","checkInTime","checkOutTime","childrenAllowed","childMaxAge","childPrice","infantsAllowed","extraBedAllowed","extraBedPrice","maxExtraBeds","smokingPolicy","petsPolicy","childrenPolicy","extraBedPolicy","parkingPolicy","specialConditions")
         VALUES ($1,'فندق', $2,0,$3,$4,$5,$6,$7,false,'[]'::jsonb,'PROPERTY',$8,$9,$10,$11,$12,$13,$14,$15,$16,$3,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35) RETURNING "id"`,
        [
          name,
          description,
          text(body.coverImageUrl, 200000),
          text(body.virtualTourUrl, 1000) || null,
          latitude,
          longitude,
          actor.id,
          body.propertyType,
          text(body.officialClassification, 100),
          body.stars ? finite(body.stars) : null,
          text(body.shortDescription, 500),
          text(body.phone, 40),
          text(body.whatsapp, 40),
          text(body.email, 200),
          text(body.website, 1000),
          text(body.logoUrl, 200000),
          text(body.videoUrl, 1000),
          text(body.state, 100),
          text(body.municipality, 100),
          text(body.address, 500),
          text(body.checkInTime, 10),
          text(body.checkOutTime, 10),
          body.childrenAllowed !== false,
          body.childMaxAge ? finite(body.childMaxAge) : null,
          body.childPrice ? finite(body.childPrice) : null,
          body.infantsAllowed !== false,
          !!body.extraBedAllowed,
          body.extraBedPrice ? finite(body.extraBedPrice) : null,
          finite(body.maxExtraBeds),
          text(body.smokingPolicy, 100),
          text(body.petsPolicy, 100),
          text(body.childrenPolicy, 1000),
          text(body.extraBedPolicy, 1000),
          text(body.parkingPolicy, 1000),
          text(body.specialConditions, 3000),
        ],
      );
      const placeId = place.rows[0].id;

      for (const [index, url] of (Array.isArray(body.images)
        ? body.images.slice(0, 30)
        : []
      ).entries()) {
        const safe = text(url, 200000);
        if (!safe) continue;
        await tx.query(
          `INSERT INTO "PropertyImage" ("id","placeId","url","sortOrder","isCover") VALUES ($1,$2,$3,$4,$5)`,
          [randomUUID(), placeId, safe, index, index === 0],
        );
      }

      for (const room of rooms) {
        const roomName = text(room.name, 100);
        const totalUnits = finite(room.totalUnits);
        const plans = Array.isArray(room.ratePlans)
          ? room.ratePlans.slice(0, 20)
          : [];
        if (
          !roomName ||
          !Number.isInteger(totalUnits) ||
          totalUnits < 1 ||
          plans.length === 0
        )
          throw new Error(
            "كل غرفة تحتاج اسماً ومخزوناً وخطة سعر واحدة على الأقل",
          );
        const roomId = randomUUID();
        await tx.query(
          `INSERT INTO "RoomType" ("id","placeId","name","description","totalUnits","maxAdults","maxChildren","maxGuests","bedType","customBedType","sizeSqm","viewType","customViewType","privateBathroom","balcony","smokingAllowed") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
          [
            roomId,
            placeId,
            roomName,
            text(room.description),
            totalUnits,
            Math.max(0, finite(room.maxAdults, 2)),
            Math.max(0, finite(room.maxChildren)),
            Math.max(1, finite(room.maxGuests, 2)),
            text(room.bedType, 40) || "DOUBLE",
            text(room.customBedType, 100) || null,
            room.sizeSqm ? finite(room.sizeSqm) : null,
            text(room.viewType, 40) || "NONE",
            text(room.customViewType, 100) || null,
            room.privateBathroom !== false,
            !!room.balcony,
            !!room.smokingAllowed,
          ],
        );
        for (const [index, url] of (Array.isArray(room.images)
          ? room.images.slice(0, 20)
          : []
        ).entries()) {
          const safe = text(url, 200000);
          if (safe)
            await tx.query(
              `INSERT INTO "RoomImage" ("id","roomTypeId","url","sortOrder") VALUES ($1,$2,$3,$4)`,
              [randomUUID(), roomId, safe, index],
            );
        }
        for (const code of Array.isArray(room.amenities) ? room.amenities : [])
          await tx.query(
            `INSERT INTO "RoomTypeAmenity" ("roomTypeId","amenityId") SELECT $1,"id" FROM "Amenity" WHERE "code"=$2 ON CONFLICT DO NOTHING`,
            [roomId, text(code, 50)],
          );
        for (const plan of plans) {
          const nightly = finite(plan.price, NaN);
          if (!Number.isFinite(nightly) || nightly < 0)
            throw new Error("سعر خطة الغرفة غير صالح");
          const policyId = randomUUID();
          await tx.query(
            `INSERT INTO "CancellationPolicy" ("id","partnerId","name","freeCancellationHours","lateFeeType","lateFeeValue","noShowFeeType","noShowFeeValue","customTerms","refundable") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              policyId,
              actor.id,
              text(plan.cancellationName, 120) || "Flexible 48h",
              plan.nonRefundable
                ? null
                : Math.max(0, finite(plan.freeCancellationHours, 48)),
              text(plan.lateFeeType, 40) || "ONE_NIGHT",
              plan.lateFeeValue ? finite(plan.lateFeeValue) : null,
              text(plan.noShowFeeType, 40) || "ONE_NIGHT",
              plan.noShowFeeValue ? finite(plan.noShowFeeValue) : null,
              text(plan.customTerms),
              !plan.nonRefundable,
            ],
          );
          const paymentPolicy = paymentPolicies.has(plan.paymentPolicy)
            ? plan.paymentPolicy
            : "DEPOSIT";
          const depositPercent = ["DEPOSIT", "PARTIAL"].includes(paymentPolicy)
            ? finite(plan.depositPercent, NaN)
            : null;
          if (
            ["DEPOSIT", "PARTIAL"].includes(paymentPolicy) &&
            (!Number.isFinite(depositPercent) ||
              depositPercent! <= 0 ||
              depositPercent! > 100)
          )
            throw new Error("حدد نسبة دفع صالحة لخطة العربون/الدفع الجزئي");
          await tx.query(
            `INSERT INTO "RatePlan" ("id","roomTypeId","cancellationPolicyId","name","description","baseNightlyPrice","currency","mealPlan","paymentPolicy","depositPercent","minimumStay","maximumStay") VALUES ($1,$2,$3,$4,$5,$6,'DZD',$7,$8,$9,$10,$11)`,
            [
              randomUUID(),
              roomId,
              policyId,
              text(plan.name, 100) || "Flexible",
              text(plan.description),
              nightly,
              mealPlans.has(plan.mealPlan) ? plan.mealPlan : "NONE",
              paymentPolicy,
              depositPercent,
              Math.max(1, finite(plan.minimumStay, 1)),
              plan.maximumStay ? Math.max(1, finite(plan.maximumStay)) : null,
            ],
          );
        }
      }
      await tx.query(
        `INSERT INTO "AuditLog" ("id","actorId","action","entityType","entityId","afterData") VALUES ($1,$2,'PROPERTY_CREATED','Place',$3,$4::jsonb)`,
        [
          randomUUID(),
          actor.id,
          placeId,
          JSON.stringify({ name, rooms: rooms.length }),
        ],
      );
      return placeId;
    });
    return NextResponse.json(
      { message: "تم إنشاء المنشأة والغرف وخطط الأسعار", placeId: result },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Property create:", error);
    return NextResponse.json(
      { message: error?.message || "تعذر إنشاء المنشأة" },
      { status: 400 },
    );
  }
}

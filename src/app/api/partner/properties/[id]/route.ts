import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireRole } from "@/lib/session";

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

// تعديل منشأة قائمة (فندق/إقامة). لا يحذف أي غرفة أو خطة سعر مرتبطة بحجوزات
// قائمة، بل يقوم بتعطيلها (active=false) للحفاظ على سلامة الحجوزات الموجودة.
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

  const name = text(body.name, 120);
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
    await withTransaction(async (tx) => {
      const existing = await tx.query<{ id: string; userId: string }>(
        `SELECT "id", "userId" FROM "Place" WHERE "id" = $1 AND "itemType" = 'PROPERTY' FOR UPDATE`,
        [placeId],
      );
      const place = existing.rows[0];
      if (!place) throw new Error("المنشأة غير موجودة");
      if (place.userId !== actor.id && actor.role !== "ADMIN")
        throw new Error("غير مصرح لك بتعديل هذه المنشأة");

      await tx.query(
        `UPDATE "Place" SET
           "name"=$1, "description"=$2, "coverImageUrl"=$3, "virtualTourUrl"=$4,
           "latitude"=$5, "longitude"=$6, "propertyType"=$7, "officialClassification"=$8,
           "stars"=$9, "shortDescription"=$10, "phone"=$11, "whatsapp"=$12, "email"=$13,
           "website"=$14, "logoUrl"=$15, "videoUrl"=$16, "state"=$17, "municipality"=$18,
           "address"=$19, "checkInTime"=$20, "checkOutTime"=$21, "childrenAllowed"=$22,
           "childMaxAge"=$23, "childPrice"=$24, "infantsAllowed"=$25, "extraBedAllowed"=$26,
           "extraBedPrice"=$27, "maxExtraBeds"=$28, "smokingPolicy"=$29, "petsPolicy"=$30,
           "childrenPolicy"=$31, "extraBedPolicy"=$32, "parkingPolicy"=$33, "specialConditions"=$34,
           "updatedAt"=NOW()
         WHERE "id"=$35`,
        [
          name,
          text(body.description),
          text(body.coverImageUrl, 200000),
          text(body.virtualTourUrl, 1000) || null,
          latitude,
          longitude,
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
          placeId,
        ],
      );

      // الصور: قائمة تعرضية محضة (لا توجد حجوزات مرتبطة بها)، يمكن إعادة بنائها بأمان.
      await tx.query(`DELETE FROM "PropertyImage" WHERE "placeId" = $1`, [
        placeId,
      ]);
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

      const keptRoomIds: string[] = [];
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

        let roomId = typeof room.id === "string" ? room.id : null;
        const roomFields = [
          roomName,
          text(room.description),
          totalUnits,
          Math.max(0, finite(room.maxAdults, 2)),
          Math.max(0, finite(room.maxChildren)),
          Math.max(1, finite(room.maxGuests, 2)),
          text(room.bedType, 40) || "DOUBLE",
          room.sizeSqm ? finite(room.sizeSqm) : null,
          text(room.viewType, 40) || "NONE",
          room.privateBathroom !== false,
          !!room.balcony,
          !!room.smokingAllowed,
        ];

        if (roomId) {
          const owned = await tx.query(
            `SELECT "id" FROM "RoomType" WHERE "id" = $1 AND "placeId" = $2`,
            [roomId, placeId],
          );
          if (owned.rows.length === 0) roomId = null;
        }

        if (roomId) {
          await tx.query(
            `UPDATE "RoomType" SET "name"=$1,"description"=$2,"totalUnits"=$3,"maxAdults"=$4,"maxChildren"=$5,"maxGuests"=$6,"bedType"=$7,"sizeSqm"=$8,"viewType"=$9,"privateBathroom"=$10,"balcony"=$11,"smokingAllowed"=$12,"active"=true WHERE "id"=$13`,
            [...roomFields, roomId],
          );
        } else {
          roomId = randomUUID();
          await tx.query(
            `INSERT INTO "RoomType" ("id","placeId","name","description","totalUnits","maxAdults","maxChildren","maxGuests","bedType","sizeSqm","viewType","privateBathroom","balcony","smokingAllowed") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
            [roomId, placeId, ...roomFields],
          );
        }
        keptRoomIds.push(roomId);

        await tx.query(`DELETE FROM "RoomImage" WHERE "roomTypeId" = $1`, [
          roomId,
        ]);
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

        await tx.query(
          `DELETE FROM "RoomTypeAmenity" WHERE "roomTypeId" = $1`,
          [roomId],
        );
        for (const code of Array.isArray(room.amenities) ? room.amenities : [])
          await tx.query(
            `INSERT INTO "RoomTypeAmenity" ("roomTypeId","amenityId") SELECT $1,"id" FROM "Amenity" WHERE "code"=$2 ON CONFLICT DO NOTHING`,
            [roomId, text(code, 50)],
          );

        const keptPlanIds: string[] = [];
        for (const plan of plans) {
          const nightly = finite(plan.price, NaN);
          if (!Number.isFinite(nightly) || nightly < 0)
            throw new Error("سعر خطة الغرفة غير صالح");
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

          let planId = typeof plan.id === "string" ? plan.id : null;
          let policyId: string | null = null;
          if (planId) {
            const found = await tx.query<{
              id: string;
              cancellationPolicyId: string;
            }>(
              `SELECT "id", "cancellationPolicyId" FROM "RatePlan" WHERE "id" = $1 AND "roomTypeId" = $2`,
              [planId, roomId],
            );
            if (found.rows.length === 0) planId = null;
            else policyId = found.rows[0].cancellationPolicyId;
          }

          if (policyId) {
            await tx.query(
              `UPDATE "CancellationPolicy" SET "name"=$1,"freeCancellationHours"=$2,"lateFeeType"=$3,"noShowFeeType"=$4,"refundable"=$5 WHERE "id"=$6`,
              [
                text(plan.cancellationName, 120) || "Flexible 48h",
                plan.nonRefundable
                  ? null
                  : Math.max(0, finite(plan.freeCancellationHours, 48)),
                text(plan.lateFeeType, 40) || "ONE_NIGHT",
                text(plan.noShowFeeType, 40) || "ONE_NIGHT",
                !plan.nonRefundable,
                policyId,
              ],
            );
          } else {
            policyId = randomUUID();
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
          }

          if (planId) {
            await tx.query(
              `UPDATE "RatePlan" SET "name"=$1,"description"=$2,"baseNightlyPrice"=$3,"mealPlan"=$4,"paymentPolicy"=$5,"depositPercent"=$6,"minimumStay"=$7,"maximumStay"=$8,"active"=true WHERE "id"=$9`,
              [
                text(plan.name, 100) || "Flexible",
                text(plan.description),
                nightly,
                mealPlans.has(plan.mealPlan) ? plan.mealPlan : "NONE",
                paymentPolicy,
                depositPercent,
                Math.max(1, finite(plan.minimumStay, 1)),
                plan.maximumStay ? Math.max(1, finite(plan.maximumStay)) : null,
                planId,
              ],
            );
          } else {
            planId = randomUUID();
            await tx.query(
              `INSERT INTO "RatePlan" ("id","roomTypeId","cancellationPolicyId","name","description","baseNightlyPrice","currency","mealPlan","paymentPolicy","depositPercent","minimumStay","maximumStay") VALUES ($1,$2,$3,$4,$5,$6,'DZD',$7,$8,$9,$10,$11)`,
              [
                planId,
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
          keptPlanIds.push(planId);
        }
        // تعطيل خطط الأسعار القديمة التي أزيلت من النموذج بدل حذفها (لحماية الحجوزات القائمة).
        if (keptPlanIds.length > 0) {
          await tx.query(
            `UPDATE "RatePlan" SET "active"=false WHERE "roomTypeId"=$1 AND "id" <> ALL($2::text[])`,
            [roomId, keptPlanIds],
          );
        }
      }
      if (keptRoomIds.length > 0) {
        await tx.query(
          `UPDATE "RoomType" SET "active"=false WHERE "placeId"=$1 AND "id" <> ALL($2::text[])`,
          [placeId, keptRoomIds],
        );
      }

      await tx.query(
        `INSERT INTO "AuditLog" ("id","actorId","action","entityType","entityId","afterData") VALUES ($1,$2,'PROPERTY_UPDATED','Place',$3,$4::jsonb)`,
        [
          randomUUID(),
          actor.id,
          placeId,
          JSON.stringify({ name, rooms: rooms.length }),
        ],
      );
    });
    return NextResponse.json({ message: "تم تحديث المنشأة بنجاح", placeId });
  } catch (error: any) {
    console.error("Property update:", error);
    return NextResponse.json(
      { message: error?.message || "تعذر تحديث المنشأة" },
      { status: 400 },
    );
  }
}

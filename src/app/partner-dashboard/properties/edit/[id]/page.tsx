import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import PropertyWizard from "@/components/partner/PropertyWizard";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export default async function EditPropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");
  if (sessionUser.role !== "PARTNER" && sessionUser.role !== "ADMIN")
    redirect("/explore");

  const place = await queryOne<Record<string, any>>(
    `SELECT * FROM "Place" WHERE "id" = $1 AND "itemType" = 'PROPERTY'`,
    [params.id],
  );
  if (!place) notFound();
  if (place.userId !== sessionUser.id && sessionUser.role !== "ADMIN") {
    redirect("/partner-dashboard");
  }

  const images = await query<{ url: string }>(
    `SELECT "url" FROM "PropertyImage" WHERE "placeId" = $1 ORDER BY "sortOrder" ASC`,
    [params.id],
  );

  const roomRows = await query<Record<string, any>>(
    `SELECT * FROM "RoomType" WHERE "placeId" = $1 AND "active" = true ORDER BY "createdAt" ASC`,
    [params.id],
  );

  const rooms = await Promise.all(
    roomRows.map(async (room) => {
      const roomImages = await query<{ url: string }>(
        `SELECT "url" FROM "RoomImage" WHERE "roomTypeId" = $1 ORDER BY "sortOrder" ASC`,
        [room.id],
      );
      const amenities = await query<{ code: string }>(
        `SELECT a."code" FROM "RoomTypeAmenity" rta JOIN "Amenity" a ON a."id" = rta."amenityId" WHERE rta."roomTypeId" = $1`,
        [room.id],
      );
      const plans = await query<Record<string, any>>(
        `SELECT rp.*, cp."name" AS "cancellationName", cp."freeCancellationHours", cp."lateFeeType", cp."noShowFeeType", cp."refundable"
         FROM "RatePlan" rp LEFT JOIN "CancellationPolicy" cp ON cp."id" = rp."cancellationPolicyId"
         WHERE rp."roomTypeId" = $1 AND rp."active" = true ORDER BY rp."createdAt" ASC`,
        [room.id],
      );
      return {
        id: room.id,
        name: str(room.name),
        description: str(room.description),
        totalUnits: str(room.totalUnits),
        maxAdults: str(room.maxAdults),
        maxChildren: str(room.maxChildren),
        maxGuests: str(room.maxGuests),
        bedType: str(room.bedType) || "DOUBLE",
        sizeSqm: str(room.sizeSqm),
        viewType: str(room.viewType) || "NONE",
        privateBathroom: room.privateBathroom !== false,
        balcony: !!room.balcony,
        smokingAllowed: !!room.smokingAllowed,
        images: roomImages.map((i) => i.url).join("\n"),
        amenities: amenities.map((a) => a.code),
        ratePlans: plans.map((p) => ({
          id: p.id,
          name: str(p.name) || "Flexible",
          price: str(p.baseNightlyPrice),
          mealPlan: str(p.mealPlan) || "NONE",
          paymentPolicy: str(p.paymentPolicy) || "DEPOSIT",
          depositPercent: str(p.depositPercent) || "30",
          minimumStay: str(p.minimumStay) || "1",
          freeCancellationHours: str(p.freeCancellationHours) || "48",
          lateFeeType: str(p.lateFeeType) || "ONE_NIGHT",
          noShowFeeType: str(p.noShowFeeType) || "ONE_NIGHT",
          nonRefundable: p.refundable === false,
          cancellationName: str(p.cancellationName),
        })),
      };
    }),
  );

  const initialPlace = {
    name: str(place.name),
    propertyType: str(place.propertyType) || "HOTEL",
    officialClassification: str(place.officialClassification),
    stars: str(place.stars),
    shortDescription: str(place.shortDescription),
    description: str(place.description),
    phone: str(place.phone),
    whatsapp: str(place.whatsapp),
    email: str(place.email),
    website: str(place.website),
    logoUrl: str(place.logoUrl),
    coverImageUrl: str(place.coverImageUrl),
    images: images.map((i) => i.url).join("\n"),
    videoUrl: str(place.videoUrl),
    virtualTourUrl: str(place.virtualTourUrl),
    state: str(place.state),
    municipality: str(place.municipality),
    address: str(place.address),
    latitude: str(place.latitude),
    longitude: str(place.longitude),
    checkInTime: str(place.checkInTime) || "14:00",
    checkOutTime: str(place.checkOutTime) || "11:00",
    childrenAllowed: place.childrenAllowed !== false,
    childMaxAge: str(place.childMaxAge) || "12",
    childPrice: str(place.childPrice),
    infantsAllowed: place.infantsAllowed !== false,
    extraBedAllowed: !!place.extraBedAllowed,
    extraBedPrice: str(place.extraBedPrice),
    maxExtraBeds: str(place.maxExtraBeds) || "0",
    smokingPolicy: str(place.smokingPolicy) || "NON_SMOKING",
    petsPolicy: str(place.petsPolicy) || "NOT_ALLOWED",
    childrenPolicy: str(place.childrenPolicy),
    extraBedPolicy: str(place.extraBedPolicy),
    parkingPolicy: str(place.parkingPolicy),
    specialConditions: str(place.specialConditions),
  };

  return (
    <PropertyWizard
      editPlaceId={params.id}
      initialData={{ place: initialPlace, rooms }}
    />
  );
}

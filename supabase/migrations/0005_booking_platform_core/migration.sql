-- ============================================================================
-- Funder 0005 — Hotels, Events, Payments, Settlements and Promote foundation
-- Safe additive migration: no DROP TABLE, no destructive column changes.
-- IMPORTANT: take a Supabase backup and run the preflight script before apply.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1) Extend existing canonical entities. Place remains the common catalog item.
-- --------------------------------------------------------------------------
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "reservedBalance" DECIMAL(14,2) NOT NULL DEFAULT 0;

ALTER TABLE "Place"
  ADD COLUMN IF NOT EXISTS "itemType" TEXT NOT NULL DEFAULT 'PLACE',
  ADD COLUMN IF NOT EXISTS "propertyType" TEXT,
  ADD COLUMN IF NOT EXISTS "officialClassification" TEXT,
  ADD COLUMN IF NOT EXISTS "stars" SMALLINT,
  ADD COLUMN IF NOT EXISTS "shortDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "whatsapp" TEXT,
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "website" TEXT,
  ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "videoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "state" TEXT,
  ADD COLUMN IF NOT EXISTS "municipality" TEXT,
  ADD COLUMN IF NOT EXISTS "address" TEXT,
  ADD COLUMN IF NOT EXISTS "checkInTime" TEXT,
  ADD COLUMN IF NOT EXISTS "checkOutTime" TEXT,
  ADD COLUMN IF NOT EXISTS "childrenAllowed" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "childMaxAge" SMALLINT,
  ADD COLUMN IF NOT EXISTS "childPrice" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "infantsAllowed" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "extraBedAllowed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "extraBedPrice" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "maxExtraBeds" SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "smokingPolicy" TEXT,
  ADD COLUMN IF NOT EXISTS "petsPolicy" TEXT,
  ADD COLUMN IF NOT EXISTS "childrenPolicy" TEXT,
  ADD COLUMN IF NOT EXISTS "extraBedPolicy" TEXT,
  ADD COLUMN IF NOT EXISTS "parkingPolicy" TEXT,
  ADD COLUMN IF NOT EXISTS "specialConditions" TEXT;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "reference" TEXT,
  ADD COLUMN IF NOT EXISTS "partnerId" TEXT,
  ADD COLUMN IF NOT EXISTS "roomTypeId" TEXT,
  ADD COLUMN IF NOT EXISTS "ratePlanId" TEXT,
  ADD COLUMN IF NOT EXISTS "ticketTypeId" TEXT,
  ADD COLUMN IF NOT EXISTS "checkIn" DATE,
  ADD COLUMN IF NOT EXISTS "checkOut" DATE,
  ADD COLUMN IF NOT EXISTS "nights" INTEGER,
  ADD COLUMN IF NOT EXISTS "adults" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "children" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "roomsCount" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "basePrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "addonsTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "taxesFees" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "grossTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "remainingAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "commissionAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "partnerNet" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN IF NOT EXISTS "bookingStatus" TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "cancellationStatus" TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "cancellationFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "refundAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT,
  ADD COLUMN IF NOT EXISTS "promotionId" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

-- --------------------------------------------------------------------------
-- 2) Property media, rooms, amenities, rates and inventory.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PropertyImage" (
  "id" TEXT PRIMARY KEY,
  "placeId" TEXT NOT NULL REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isCover" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "RoomType" (
  "id" TEXT PRIMARY KEY,
  "placeId" TEXT NOT NULL REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "totalUnits" INTEGER NOT NULL,
  "maxAdults" INTEGER NOT NULL DEFAULT 2,
  "maxChildren" INTEGER NOT NULL DEFAULT 0,
  "maxGuests" INTEGER NOT NULL DEFAULT 2,
  "bedType" TEXT NOT NULL DEFAULT 'DOUBLE',
  "customBedType" TEXT,
  "sizeSqm" DECIMAL(8,2),
  "viewType" TEXT NOT NULL DEFAULT 'NONE',
  "customViewType" TEXT,
  "privateBathroom" BOOLEAN NOT NULL DEFAULT true,
  "balcony" BOOLEAN NOT NULL DEFAULT false,
  "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoomType_units_check" CHECK ("totalUnits" > 0),
  CONSTRAINT "RoomType_capacity_check" CHECK ("maxAdults" >= 0 AND "maxChildren" >= 0 AND "maxGuests" > 0)
);

CREATE TABLE IF NOT EXISTS "RoomImage" (
  "id" TEXT PRIMARY KEY,
  "roomTypeId" TEXT NOT NULL REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Amenity" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "nameAr" TEXT NOT NULL,
  "nameFr" TEXT,
  "nameEn" TEXT,
  "icon" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "RoomTypeAmenity" (
  "roomTypeId" TEXT NOT NULL REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "amenityId" TEXT NOT NULL REFERENCES "Amenity"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  PRIMARY KEY ("roomTypeId", "amenityId")
);

CREATE TABLE IF NOT EXISTS "CancellationPolicy" (
  "id" TEXT PRIMARY KEY,
  "partnerId" TEXT REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "freeCancellationHours" INTEGER,
  "lateFeeType" TEXT NOT NULL DEFAULT 'ONE_NIGHT',
  "lateFeeValue" DECIMAL(14,2),
  "noShowFeeType" TEXT NOT NULL DEFAULT 'ONE_NIGHT',
  "noShowFeeValue" DECIMAL(14,2),
  "customTerms" TEXT,
  "refundable" BOOLEAN NOT NULL DEFAULT true,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "RatePlan" (
  "id" TEXT PRIMARY KEY,
  "roomTypeId" TEXT NOT NULL REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "cancellationPolicyId" TEXT REFERENCES "CancellationPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "baseNightlyPrice" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'DZD',
  "mealPlan" TEXT NOT NULL DEFAULT 'NONE',
  "paymentPolicy" TEXT NOT NULL DEFAULT 'DEPOSIT',
  "depositPercent" DECIMAL(6,3),
  "minimumStay" INTEGER NOT NULL DEFAULT 1,
  "maximumStay" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RatePlan_price_check" CHECK ("baseNightlyPrice" >= 0),
  CONSTRAINT "RatePlan_stay_check" CHECK ("minimumStay" > 0 AND ("maximumStay" IS NULL OR "maximumStay" >= "minimumStay"))
);

CREATE TABLE IF NOT EXISTS "RoomInventoryDay" (
  "id" TEXT PRIMARY KEY,
  "roomTypeId" TEXT NOT NULL REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "date" DATE NOT NULL,
  "totalUnits" INTEGER NOT NULL,
  "bookedUnits" INTEGER NOT NULL DEFAULT 0,
  "closed" BOOLEAN NOT NULL DEFAULT false,
  "overridePrice" DECIMAL(14,2),
  "minimumStay" INTEGER,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoomInventoryDay_unique" UNIQUE ("roomTypeId", "date"),
  CONSTRAINT "RoomInventoryDay_stock_check" CHECK ("totalUnits" >= 0 AND "bookedUnits" >= 0 AND "bookedUnits" <= "totalUnits")
);

CREATE TABLE IF NOT EXISTS "SeasonalRate" (
  "id" TEXT PRIMARY KEY,
  "ratePlanId" TEXT NOT NULL REFERENCES "RatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "nightlyPrice" DECIMAL(14,2),
  "discountType" TEXT,
  "discountValue" DECIMAL(14,2),
  "minimumStay" INTEGER,
  "cancellationPolicyId" TEXT REFERENCES "CancellationPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SeasonalRate_dates_check" CHECK ("endDate" >= "startDate")
);

CREATE TABLE IF NOT EXISTS "SpecialOffer" (
  "id" TEXT PRIMARY KEY,
  "placeId" TEXT NOT NULL REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "ratePlanId" TEXT REFERENCES "RatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "offerType" TEXT NOT NULL,
  "value" DECIMAL(14,2),
  "bookNights" INTEGER,
  "payNights" INTEGER,
  "freeService" TEXT,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SpecialOffer_dates_check" CHECK ("endDate" >= "startDate")
);

CREATE TABLE IF NOT EXISTS "BookingGuest" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "fullName" TEXT NOT NULL,
  "guestType" TEXT NOT NULL DEFAULT 'ADULT',
  "age" SMALLINT,
  "isLeadGuest" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BookingAddon" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "totalPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingAddon_values_check" CHECK ("quantity" > 0 AND "unitPrice" >= 0 AND "totalPrice" >= 0)
);

-- --------------------------------------------------------------------------
-- 3) Event detail, ticket inventory and scan history.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "EventDetail" (
  "id" TEXT PRIMARY KEY,
  "placeId" TEXT NOT NULL UNIQUE REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "eventType" TEXT NOT NULL,
  "organizer" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "doorsOpenAt" TIMESTAMP(3),
  "minimumAge" INTEGER,
  "targetAudience" TEXT,
  "program" TEXT,
  "attendanceTerms" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "cancelledAt" TIMESTAMP(3),
  "cancellationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventDetail_dates_check" CHECK ("endAt" > "startAt")
);

CREATE TABLE IF NOT EXISTS "EventSession" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL REFERENCES "EventDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" TEXT,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "doorsOpenAt" TIMESTAMP(3),
  "capacity" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventSession_dates_check" CHECK ("endAt" > "startAt")
);

CREATE TABLE IF NOT EXISTS "TicketType" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL REFERENCES "EventDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "eventSessionId" TEXT REFERENCES "EventSession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'DZD',
  "quantity" INTEGER NOT NULL,
  "availableQuantity" INTEGER NOT NULL,
  "capacity" INTEGER,
  "saleStart" TIMESTAMP(3),
  "saleEnd" TIMESTAMP(3),
  "bookingMode" TEXT NOT NULL DEFAULT 'PURCHASE',
  "refundPolicy" TEXT NOT NULL DEFAULT 'NO_CANCELLATION',
  "refundValue" DECIMAL(14,2),
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketType_stock_check" CHECK ("quantity" >= 0 AND "availableQuantity" >= 0 AND "availableQuantity" <= "quantity")
);

CREATE TABLE IF NOT EXISTS "Ticket" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "ticketTypeId" TEXT REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "holderName" TEXT,
  "secureToken" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "usedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "TicketScan" (
  "id" TEXT PRIMARY KEY,
  "ticketId" TEXT NOT NULL REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "scannedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "result" TEXT NOT NULL,
  "deviceInfo" TEXT,
  "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------------
-- 4) Payment abstraction, refunds, commission settings and settlements.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PaymentMethod" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'INTERNAL',
  "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "paymentMethodId" TEXT REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "providerReference" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'DZD',
  "kind" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_amount_check" CHECK ("amount" >= 0),
  CONSTRAINT "Payment_user_idempotency_unique" UNIQUE ("userId", "idempotencyKey")
);

CREATE TABLE IF NOT EXISTS "Refund" (
  "id" TEXT PRIMARY KEY,
  "paymentId" TEXT REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "bookingId" TEXT NOT NULL REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "requestedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'DZD',
  "reason" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "providerReference" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Refund_amount_check" CHECK ("amount" >= 0)
);

CREATE TABLE IF NOT EXISTS "CommissionSetting" (
  "id" TEXT PRIMARY KEY,
  "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
  "partnerId" TEXT REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "placeId" TEXT REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "rate" DECIMAL(7,4) NOT NULL,
  "appliesTo" TEXT NOT NULL DEFAULT 'GROSS_TOTAL',
  "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveTo" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommissionSetting_rate_check" CHECK ("rate" >= 0 AND "rate" <= 1)
);

CREATE TABLE IF NOT EXISTS "Settlement" (
  "id" TEXT PRIMARY KEY,
  "partnerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "periodStart" DATE NOT NULL,
  "periodEnd" DATE NOT NULL,
  "grossAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "commissionAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "partnerNet" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "paidToPartner" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "remainingAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "refundsAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "cancellationFees" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "settlementDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Settlement_period_check" CHECK ("periodEnd" >= "periodStart")
);

CREATE TABLE IF NOT EXISTS "PartnerPayoutAccount" (
  "id" TEXT PRIMARY KEY,
  "partnerId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "accountType" TEXT NOT NULL,
  "accountHolder" TEXT NOT NULL,
  "accountIdentifierEncrypted" TEXT NOT NULL,
  "bankName" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------------
-- 5) Funder Promote settings, campaigns, reservation and analytics.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PromotionSetting" (
  "key" TEXT PRIMARY KEY,
  "value" JSONB NOT NULL,
  "updatedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PromotionPackage" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "reach" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "basePrice" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'DZD',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Promotion" (
  "id" TEXT PRIMARY KEY,
  "partnerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "placeId" TEXT NOT NULL REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "packageId" TEXT REFERENCES "PromotionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "reach" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "targeting" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "budget" DECIMAL(14,2) NOT NULL,
  "reservedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "spentAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "rejectionReason" TEXT,
  "approvedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Promotion_dates_check" CHECK ("endAt" > "startAt"),
  CONSTRAINT "Promotion_budget_check" CHECK ("budget" >= 0 AND "reservedAmount" >= 0 AND "spentAmount" >= 0)
);

CREATE TABLE IF NOT EXISTS "PromotionTarget" (
  "id" TEXT PRIMARY KEY,
  "promotionId" TEXT NOT NULL REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "targetType" TEXT NOT NULL,
  "targetValue" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromotionTarget_unique" UNIQUE ("promotionId", "targetType", "targetValue")
);

CREATE TABLE IF NOT EXISTS "PromotionImpression" (
  "id" TEXT PRIMARY KEY,
  "promotionId" TEXT NOT NULL REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "anonymousId" TEXT,
  "placement" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PromotionClick" (
  "id" TEXT PRIMARY KEY,
  "promotionId" TEXT NOT NULL REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "anonymousId" TEXT,
  "placement" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PromotionConversion" (
  "id" TEXT PRIMARY KEY,
  "promotionId" TEXT NOT NULL REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "bookingId" TEXT REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "kind" TEXT NOT NULL,
  "value" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PromotionTransaction" (
  "id" TEXT PRIMARY KEY,
  "promotionId" TEXT NOT NULL REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "partnerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "kind" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "actorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "beforeData" JSONB,
  "afterData" JSONB,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------------
-- 6) Add deferred relations to Booking after referenced tables exist.
-- --------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "RatePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --------------------------------------------------------------------------
-- 7) Indexes for hot paths and idempotency.
-- --------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_reference_key" ON "Booking"("reference") WHERE "reference" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_user_idempotency_key" ON "Booking"("userId", "idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Booking_property_dates_status_idx" ON "Booking"("placeId", "checkIn", "checkOut", "bookingStatus");
CREATE INDEX IF NOT EXISTS "Booking_partner_status_created_idx" ON "Booking"("partnerId", "bookingStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "PropertyImage_place_sort_idx" ON "PropertyImage"("placeId", "sortOrder");
CREATE INDEX IF NOT EXISTS "RoomType_place_active_idx" ON "RoomType"("placeId", "active");
CREATE INDEX IF NOT EXISTS "RoomImage_room_sort_idx" ON "RoomImage"("roomTypeId", "sortOrder");
CREATE INDEX IF NOT EXISTS "RatePlan_room_active_idx" ON "RatePlan"("roomTypeId", "active");
CREATE INDEX IF NOT EXISTS "RoomInventoryDay_date_idx" ON "RoomInventoryDay"("date", "closed");
CREATE INDEX IF NOT EXISTS "SeasonalRate_plan_dates_idx" ON "SeasonalRate"("ratePlanId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS "SpecialOffer_place_dates_idx" ON "SpecialOffer"("placeId", "startDate", "endDate", "active");
CREATE INDEX IF NOT EXISTS "BookingGuest_booking_idx" ON "BookingGuest"("bookingId", "isLeadGuest");
CREATE INDEX IF NOT EXISTS "BookingAddon_booking_idx" ON "BookingAddon"("bookingId");
CREATE INDEX IF NOT EXISTS "EventDetail_status_dates_idx" ON "EventDetail"("status", "startAt", "endAt");
CREATE INDEX IF NOT EXISTS "EventSession_event_dates_idx" ON "EventSession"("eventId", "startAt", "endAt", "status");
CREATE INDEX IF NOT EXISTS "TicketType_event_status_idx" ON "TicketType"("eventId", "status", "saleStart", "saleEnd");
CREATE INDEX IF NOT EXISTS "Ticket_booking_status_idx" ON "Ticket"("bookingId", "status");
CREATE INDEX IF NOT EXISTS "TicketScan_ticket_created_idx" ON "TicketScan"("ticketId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_provider_reference_key" ON "Payment"("providerReference") WHERE "providerReference" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Payment_booking_status_idx" ON "Payment"("bookingId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Refund_booking_status_idx" ON "Refund"("bookingId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "CommissionSetting_scope_active_idx" ON "CommissionSetting"("scope", "partnerId", "placeId", "active", "effectiveFrom");
CREATE INDEX IF NOT EXISTS "Settlement_partner_status_idx" ON "Settlement"("partnerId", "status", "periodStart", "periodEnd");
CREATE INDEX IF NOT EXISTS "Promotion_partner_status_idx" ON "Promotion"("partnerId", "status", "startAt", "endAt");
CREATE INDEX IF NOT EXISTS "Promotion_active_rotation_idx" ON "Promotion"("status", "startAt", "endAt", "priority");
CREATE INDEX IF NOT EXISTS "PromotionTarget_lookup_idx" ON "PromotionTarget"("targetType", "targetValue");
CREATE INDEX IF NOT EXISTS "PromotionImpression_cap_idx" ON "PromotionImpression"("promotionId", "userId", "anonymousId", "occurredAt");
CREATE INDEX IF NOT EXISTS "PromotionClick_cap_idx" ON "PromotionClick"("promotionId", "userId", "anonymousId", "occurredAt");
CREATE INDEX IF NOT EXISTS "PromotionConversion_campaign_idx" ON "PromotionConversion"("promotionId", "kind", "occurredAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_idx" ON "AuditLog"("entityType", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_actor_idx" ON "AuditLog"("actorId", "createdAt");

-- --------------------------------------------------------------------------
-- 8) Backfill compatibility without deleting legacy values.
-- --------------------------------------------------------------------------
UPDATE "Place" SET "itemType" = 'EVENT' WHERE "isEvent" IS TRUE AND "itemType" = 'PLACE';
UPDATE "Place" SET "itemType" = 'PROPERTY', "propertyType" = COALESCE("propertyType", 'HOTEL') WHERE "category" IN ('فندق', 'فندق / إقامة', 'فندق وإقامة') AND "itemType" = 'PLACE';
UPDATE "Booking" b
SET "partnerId" = p."userId",
    "paidAmount" = COALESCE(b."amount", 0),
    "bookingStatus" = CASE
      WHEN b."status" = 'USED' THEN 'COMPLETED'
      WHEN b."status" = 'CONFIRMED' THEN 'CONFIRMED'
      WHEN b."status" = 'REJECTED' THEN 'CANCELLED_BY_PARTNER'
      ELSE 'PENDING' END,
    "paymentStatus" = CASE WHEN COALESCE(b."amount", 0) > 0 THEN 'PARTIALLY_PAID' ELSE 'UNPAID' END
FROM "Place" p
WHERE p."id" = b."placeId" AND b."partnerId" IS NULL;

-- --------------------------------------------------------------------------
-- 9) Configurable defaults. Values are data, never hard-coded in application.
-- --------------------------------------------------------------------------
INSERT INTO "Amenity" ("id", "code", "nameAr", "nameFr", "nameEn", "icon") VALUES
  ('amenity-wifi', 'WIFI', 'Wi-Fi', 'Wi-Fi', 'Wi-Fi', 'wifi'),
  ('amenity-ac', 'AIR_CONDITIONING', 'تكييف', 'Climatisation', 'Air conditioning', 'snowflake'),
  ('amenity-tv', 'TV', 'تلفاز', 'Télévision', 'Television', 'tv'),
  ('amenity-fridge', 'FRIDGE', 'ثلاجة', 'Réfrigérateur', 'Fridge', 'refrigerator'),
  ('amenity-safe', 'SAFE', 'خزنة', 'Coffre-fort', 'Safe', 'shield'),
  ('amenity-hairdryer', 'HAIR_DRYER', 'مجفف شعر', 'Sèche-cheveux', 'Hair dryer', 'wind'),
  ('amenity-desk', 'DESK', 'مكتب', 'Bureau', 'Desk', 'briefcase'),
  ('amenity-heating', 'HEATING', 'تدفئة', 'Chauffage', 'Heating', 'flame'),
  ('amenity-parking', 'PARKING', 'موقف سيارات', 'Parking', 'Parking', 'car')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "CancellationPolicy" ("id", "partnerId", "name", "freeCancellationHours", "lateFeeType", "noShowFeeType", "refundable")
VALUES ('policy-funder-default-48h', NULL, 'Funder Flexible 48h', 48, 'ONE_NIGHT', 'ONE_NIGHT', true)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CommissionSetting" ("id", "scope", "rate", "appliesTo", "active")
VALUES ('commission-global-default', 'GLOBAL', 0.10, 'GROSS_TOTAL', true)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PaymentMethod" ("id", "code", "name", "provider", "enabled", "sortOrder") VALUES
  ('payment-wallet', 'WALLET', 'Funder Wallet', 'INTERNAL', true, 1),
  ('payment-property', 'PAY_AT_PROPERTY', 'Pay at Property', 'OFFLINE', true, 2)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "PromotionSetting" ("key", "value") VALUES
  ('reachMultipliers', '{"LOCAL":1,"REGIONAL":1.3,"NATIONAL":1.8,"TARGETED":1.5}'::jsonb),
  ('priorityMultipliers', '{"NORMAL":1,"FEATURED":1.5,"PRIORITY":2}'::jsonb),
  ('frequencyCap', '{"maxDailyImpressions":3,"repeatAfterHours":6,"afterClickHours":24}'::jsonb),
  ('durationPrices', '{"1":500,"3":1200,"7":2500,"14":4500,"30":8000}'::jsonb)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "PromotionPackage" ("id", "key", "name", "durationDays", "reach", "priority", "basePrice") VALUES
  ('promo-starter', 'STARTER', 'Starter', 1, 'LOCAL', 'NORMAL', 500),
  ('promo-popular', 'POPULAR', 'Popular', 7, 'REGIONAL', 'FEATURED', 2500),
  ('promo-business', 'BUSINESS', 'Business', 14, 'NATIONAL', 'FEATURED', 4500),
  ('promo-premium', 'PREMIUM', 'Premium', 30, 'NATIONAL', 'PRIORITY', 8000)
ON CONFLICT ("key") DO NOTHING;

COMMIT;

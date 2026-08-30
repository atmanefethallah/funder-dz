-- ============================================================
-- Migration: 0001_p0_security_hardening
-- منصة Funder — ترقية P0 الأمنية والمالية
-- التطبيق: psql "$DIRECT_URL" -f supabase/migrations/0001_p0_security_hardening/migration.sql
--   أو من SQL Editor في Supabase، ثم: 
-- ⚠️ خذ نسخة احتياطية قبل التنفيذ. تُنفَّذ مرة واحدة فقط.
-- ============================================================

-- ---------- 1) Float → Decimal (دقة مالية) ----------
ALTER TABLE "User"            ALTER COLUMN "balance" SET DATA TYPE DECIMAL(14,2);
ALTER TABLE "Place"           ALTER COLUMN "price"   SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "Booking"         ALTER COLUMN "amount"  SET DATA TYPE DECIMAL(14,2);
ALTER TABLE "RechargeRequest" ALTER COLUMN "amount"  SET DATA TYPE DECIMAL(14,2);

-- ---------- 2) حقول updatedAt ----------
ALTER TABLE "User"    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Place"   ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ---------- 3) qrToken للتذاكر الموجودة (مع تعبئة آمنة) ----------
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "qrToken" TEXT;
UPDATE "Booking"
SET "qrToken" = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
WHERE "qrToken" IS NULL;
ALTER TABLE "Booking" ALTER COLUMN "qrToken" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_qrToken_key" ON "Booking"("qrToken");

-- ---------- 4) قيود التفرد (منع السباق والتكرار على مستوى القاعدة) ----------
CREATE UNIQUE INDEX IF NOT EXISTS "RechargeRequest_transactionId_key" ON "RechargeRequest"("transactionId");
CREATE UNIQUE INDEX IF NOT EXISTS "Review_userId_placeId_key" ON "Review"("userId", "placeId");

-- ---------- 5) الفهارس (الأداء) ----------
CREATE INDEX IF NOT EXISTS "Place_category_idx"                      ON "Place"("category");
CREATE INDEX IF NOT EXISTS "Place_userId_idx"                        ON "Place"("userId");
CREATE INDEX IF NOT EXISTS "Booking_userId_status_createdAt_idx"     ON "Booking"("userId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Booking_placeId_status_idx"              ON "Booking"("placeId", "status");
CREATE INDEX IF NOT EXISTS "RechargeRequest_status_createdAt_idx"    ON "RechargeRequest"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Review_placeId_idx"                      ON "Review"("placeId");
CREATE INDEX IF NOT EXISTS "Wishlist_userId_idx"                     ON "Wishlist"("userId");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- ---------- 6) جدول القسائم ----------
CREATE TABLE IF NOT EXISTS "Voucher" (
    "code"      TEXT NOT NULL,
    "amount"    DECIMAL(14,2) NOT NULL,
    "maxUses"   INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("code")
);

CREATE TABLE IF NOT EXISTS "VoucherRedemption" (
    "id"          TEXT NOT NULL,
    "voucherCode" TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoucherRedemption_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "VoucherRedemption_voucherCode_userId_key" ON "VoucherRedemption"("voucherCode", "userId");
CREATE INDEX        IF NOT EXISTS "VoucherRedemption_userId_idx"             ON "VoucherRedemption"("userId");
DO $$ BEGIN
  ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_voucherCode_fkey"
    FOREIGN KEY ("voucherCode") REFERENCES "Voucher"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- 7) دفتر المحفظة (Ledger) ----------
CREATE TABLE IF NOT EXISTS "WalletTransaction" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "type"      TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount"    DECIMAL(14,2) NOT NULL,
    "reference" TEXT,
    "note"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "WalletTransaction_userId_createdAt_idx" ON "WalletTransaction"("userId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- 8) باقات الاشتراك والاشتراكات (أساس نظام P2) ----------
CREATE TABLE IF NOT EXISTS "Plan" (
    "id"           TEXT NOT NULL,
    "key"          TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "targetRole"   TEXT NOT NULL,
    "priceMonthly" DECIMAL(12,2) NOT NULL,
    "priceYearly"  DECIMAL(12,2) NOT NULL,
    "features"     JSONB NOT NULL,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Plan_key_key" ON "Plan"("key");

CREATE TABLE IF NOT EXISTS "Subscription" (
    "id"                 TEXT NOT NULL,
    "userId"             TEXT NOT NULL,
    "planId"             TEXT NOT NULL,
    "status"             TEXT NOT NULL DEFAULT 'TRIAL',
    "billingCycle"       TEXT NOT NULL DEFAULT 'MONTHLY',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd"   TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd"  BOOLEAN NOT NULL DEFAULT false,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Subscription_userId_status_idx"       ON "Subscription"("userId", "status");
CREATE INDEX IF NOT EXISTS "Subscription_currentPeriodEnd_idx"    ON "Subscription"("currentPeriodEnd");
DO $$ BEGIN
  ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- تحقق سريع بعد التنفيذ ----------
-- SELECT COUNT(*) AS bookings_without_qr FROM "Booking" WHERE "qrToken" IS NULL;  -- يجب أن تكون 0

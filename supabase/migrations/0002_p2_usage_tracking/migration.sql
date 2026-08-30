-- ============================================================
-- Migration: 0002_p2_usage_tracking
-- جدول تتبع استخدام الميزات المحدودة بالباقات
-- التطبيق: psql "$DIRECT_URL" -f supabase/migrations/0002_p2_usage_tracking/migration.sql
--   ثم: 
-- ============================================================

CREATE TABLE IF NOT EXISTS "UsageEvent" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "kind"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UsageEvent_userId_kind_createdAt_idx" ON "UsageEvent"("userId", "kind", "createdAt");

DO $$ BEGIN
  ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

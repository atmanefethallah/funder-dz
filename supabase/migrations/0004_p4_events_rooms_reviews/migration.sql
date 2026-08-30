-- 0004_p4_events_rooms_reviews
-- يضيف: (1) دعم العروض/الفعاليات المؤقتة التي تختفي تلقائياً بعد انتهائها
--       (2) دعم أنواع غرف الفنادق بأسعار مختلفة + حفظ نوع الغرفة المحجوزة
--       (3) فهرس لتسريع تصفية العروض المنتهية

ALTER TABLE "Place"
  ADD COLUMN IF NOT EXISTS "isEvent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "eventEndsAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "roomTypes" JSONB;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "roomType" TEXT,
  ADD COLUMN IF NOT EXISTS "roomPrice" DECIMAL(14,2);

CREATE INDEX IF NOT EXISTS "Place_isEvent_eventEndsAt_idx" ON "Place" ("isEvent", "eventEndsAt");

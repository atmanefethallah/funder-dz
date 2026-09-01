-- ============================================================================
-- Funder 0007 — إصلاح طارئ: عمود "tickets" مفقود من جدول "Booking"
-- السبب: الكود (إنشاء الحجوزو وصفحة التذكرة) يقرأ/يكتب عمود
-- "tickets" (عدد التذاكر/الوحدات المحجوزة) لكنه لم يضاف للقاعدة قطعاً.
-- هذا هو السبب المباشر لفشل إتمام الحجوزات وفشل فتح/تحميل التذاكر.
-- إضافة فقط (لا حذف، لا تعديل مدمر). القيمة الافتراضية 1 لكل الصفوف الحالية.
-- ============================================================================

BEGIN;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "tickets" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Booking"
  DROP CONSTRAINT IF EXISTS "Booking_tickets_check";

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_tickets_check" CHECK ("tickets" >= 1 AND "tickets" <= 20);

COMMIT;

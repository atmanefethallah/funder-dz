-- 0006_wallet_transaction_type_check_fix
-- إصلاح مستهدف: قيد CHECK على عمود "type" في جدول "WalletTransaction"
-- لا يسمح بقيمة "PROMOTION_RESERVE" (وما يتبعها من قيم الترويج المستخدمة في الكود).
-- هذا التعديل يلمس فقط هذا القيد ولا يغيّر أي جدول أو بيانات أخرى.

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'WalletTransaction'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%"type"%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "WalletTransaction" DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE "WalletTransaction"
  ADD CONSTRAINT "WalletTransaction_type_check" CHECK ("type" IN (
    'VOUCHER_TOPUP',
    'RECHARGE_TOPUP',
    'BOOKING_DEPOSIT',
    'BOOKING_REFUND',
    'PARTNER_EARNING',
    'PARTNER_REFUND_DEDUCTION',
    'PROMOTION_RESERVE',
    'PROMOTION_RELEASE',
    'PROMOTION_SPEND',
    'ADMIN_ADJUSTMENT'
  ));

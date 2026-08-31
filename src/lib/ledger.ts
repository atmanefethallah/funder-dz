// src/lib/ledger.ts — دفتر الأستاذ المالي: كل حركة رصيد تُوثّق هنا
import type { PoolClient } from "@/lib/db";

type LedgerType =
  | "VOUCHER_TOPUP"
  | "RECHARGE_TOPUP"
  | "BOOKING_DEPOSIT"
  | "BOOKING_REFUND"
  | "PARTNER_EARNING"
  | "PARTNER_REFUND_DEDUCTION"
  | "PROMOTION_RESERVE"
  | "PROMOTION_RELEASE"
  | "PROMOTION_SPEND"
  | "ADMIN_ADJUSTMENT";

/** يسجّل حركة مالية في الدفتر. يقبل عميل معاملة (tx) لضمان الذرّية. */
export async function recordLedger(
  tx: PoolClient,
  entry: {
    userId: string;
    type: LedgerType;
    direction: "CREDIT" | "DEBIT";
    amount: number;
    reference?: string;
    note?: string;
  },
) {
  await tx.query(
    `INSERT INTO "WalletTransaction" ("userId", "type", "direction", "amount", "reference", "note")
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      entry.userId,
      entry.type,
      entry.direction,
      entry.amount,
      entry.reference ?? null,
      entry.note ?? null,
    ],
  );
}

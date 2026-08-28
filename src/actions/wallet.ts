// src/actions/wallet.ts — شحن المحفظة بالقسائم من قاعدة البيانات (لا أكواد ثابتة في الكود)
"use server";

import { withTransaction } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/session";
import { recordLedger } from "@/lib/ledger";
import { rateLimit } from "@/lib/rate-limit";

type VoucherRow = {
  code: string;
  amount: string;
  isActive: boolean;
  expiresAt: Date | null;
  maxUses: number;
  usedCount: number;
};

export async function chargeWallet(voucherCode: string) {
  // 🛡️ الهوية من الجلسة الموقّعة فقط — لا نثق بأي معرّف قادم من العميل
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return { success: false, message: "يرجى تسجيل الدخول أولاً." };
  }

  const code = (voucherCode || "").trim().toUpperCase();
  if (!code) {
    return { success: false, message: "يرجى إدخال رمز القسيمة." };
  }

  // تحديد المعدل: 10 محاولات في الساعة لكل مستخدم (حماية من تخمين الأكواد)
  const rl = rateLimit(`voucher:${sessionUser.id}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return {
      success: false,
      message: `محاولات كثيرة جداً. حاول بعد ${Math.ceil(rl.retryAfterSec / 60)} دقيقة.`,
    };
  }

  try {
    let chargedAmount = 0;

    await withTransaction(async (tx) => {
      const voucherRes = await tx.query<VoucherRow>(`SELECT * FROM "Voucher" WHERE "code" = $1`, [code]);
      const voucher = voucherRes.rows[0];

      if (!voucher || !voucher.isActive) {
        throw new Error("رمز الشحن गير صالح.");
      }
      if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
        throw new Error("هذه القسيمة منتهية الصلاحية.");
      }

      // 🛡️ استهلاك ذرّي: ينجح فقط إذا لم تُستنفد الاستخدامات (ضد السباق)
      const consumedRes = await tx.query(
        `UPDATE "Voucher" SET "usedCount" = "usedCount" + 1 WHERE "code" = $1 AND "usedCount" < "maxUses"`,
        [code],
      );
      if (consumedRes.rowCount === 0) {
        throw new Error("تم استنفاذ هذه القسيمة بالكامل.");
      }

      // 🛡️ القيد الفريد (voucherCode + userId) يمنع المستخدم من شحن نفس القسيمة مرتين
      try {
        await tx.query(
          `INSERT INTO "VoucherRedemption" ("voucherCode", "userId") VALUES ($1, $2)`,
          [code, sessionUser.id],
        );
      } catch (err: unknown) {
        const pgErr = err as { code?: string };
        if (pgErr?.code === "23505") {
          const dupErr = new Error("لقد استخدمت هذه القسيمة من قبل.") as Error & { code?: string };
          dupErr.code = "DUPLICATE_REDEMPTION";
          throw dupErr;
        }
        throw err;
      }

      chargedAmount = Number(voucher.amount);

      await tx.query(`UPDATE "User" SET "balance" = "balance" + $1 WHERE "id" = $2`, [chargedAmount, sessionUser.id]);

      await recordLedger(tx, {
        userId: sessionUser.id,
        type: "VOUCHER_TOPUP",
        direction: "CREDIT",
        amount: chargedAmount,
        reference: code,
        note: "شحن رصيد عبر قسيمة فندر",
      });
    });

    revalidatePath("/wallet");
    revalidatePath("/profile");

    return { success: true, message: `تم شحن رصيدك بنجاح بمبلग ${chargedAmount} د.ج!` };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    // استخدم هذه القسيمة من قبل (القيد الفريد)
    if (err?.code === "DUPLICATE_REDEMPTION") {
      return { success: false, message: "لقد استخدمت هذه القسيمة من قبل." };
    }
    return {
      success: false,
      message: err?.message || "حدث خطأ أثناء تحديث المحفظة.",
    };
  }
}

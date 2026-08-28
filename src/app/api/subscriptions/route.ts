import { NextResponse } from "next/server";
import { queryOne, withTransaction } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { getActiveSubscription } from "@/lib/entitlements";
import { recordLedger } from "@/lib/ledger";

export const dynamic = "force-dynamic";

type PlanRow = {
  id: string;
  key: string;
  name: string;
  targetRole: string;
  priceMonthly: string;
  priceYearly: string;
  isActive: boolean;
};

// 🔍 اشتراكي الحالي مع باقته
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json(null, { status: 401 });

    const sub = await getActiveSubscription(sessionUser.id);
    if (!sub) return NextResponse.json(null);

    return NextResponse.json({
      id: sub.id,
      status: sub.status,
      billingCycle: sub.billingCycle,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      plan: {
        key: sub.plan.key,
        name: sub.plan.name,
        targetRole: sub.plan.targetRole,
        priceMonthly: Number(sub.plan.priceMonthly),
        priceYearly: Number(sub.plan.priceYearly),
        features: sub.plan.features,
      },
    });
  } catch (error) {
    console.error("GET Subscription Error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}

// 💳 الاشتراك في باقة — الدفع من رصيد المحفظة (معاملة ذرّية + دفتر أستاذ)
export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: "يرجى تسجيل الدخول أولاً" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const planKey = body?.planKey;
    const billingCycle = body?.billingCycle === "YEARLY" ? "YEARLY" : "MONTHLY";

    if (!planKey || typeof planKey !== "string") {
      return NextResponse.json({ message: "الباقة غير صالحة" }, { status: 400 });
    }

    const plan = await queryOne<PlanRow>(`SELECT * FROM "Plan" WHERE "key" = $1`, [planKey]);
    if (!plan || !plan.isActive) {
      return NextResponse.json({ message: "هذه الباقة غير متاحة" }, { status: 404 });
    }

    // الباقة يجب أن تناسب دور المستخدم
    if (plan.targetRole !== sessionUser.role && sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "هذه الباقة غير مخصّصة لنوع حسابك" },
        { status: 403 },
      );
    }

    const price = billingCycle === "YEARLY" ? Number(plan.priceYearly) : Number(plan.priceMonthly);

    // لو كان مشتركاً في نفس الباقة فعّالة بالفعل
    const existing = await getActiveSubscription(sessionUser.id);
    if (existing && existing.plan.key === planKey && !existing.cancelAtPeriodEnd) {
      return NextResponse.json(
        { message: "أنت مشترك في هذه الباقة بالفعل" },
        { status: 400 },
      );
    }

    await withTransaction(async (tx) => {
      // 1. الدفع من المحفظة للباقات المدفوعة
      if (price > 0) {
        const debited = await tx.query(
          `UPDATE "User" SET "balance" = "balance" - $1 WHERE "id" = $2 AND "balance" >= $1`,
          [price, sessionUser.id],
        );
        if (debited.rowCount === 0) {
          throw new Error(`رصيدك غير كافٍ. تحتاج ${price} د.ج. اشحن محفظتك أولاً.`);
        }
        await recordLedger(tx, {
          userId: sessionUser.id,
          type: "ADMIN_ADJUSTMENT",
          direction: "DEBIT",
          amount: price,
          reference: plan.key,
          note: `اشتراك ${plan.name} (${billingCycle === "YEARLY" ? "سنوي" : "شهري"})`,
        });
      }

      // 2. إلغاء أي اشتراك فعّال سابق
      await tx.query(
        `UPDATE "Subscription" SET "status" = 'CANCELED' WHERE "userId" = $1 AND "status" IN ('ACTIVE', 'TRIAL')`,
        [sessionUser.id],
      );

      // 3. إنشاء الاشتراك الجديد
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + (billingCycle === "YEARLY" ? 12 : 1));

      await tx.query(
        `INSERT INTO "Subscription" ("userId", "planId", "status", "billingCycle", "currentPeriodStart", "currentPeriodEnd")
         VALUES ($1, $2, 'ACTIVE', $3, $4, $5)`,
        [sessionUser.id, plan.id, billingCycle, now.toISOString(), end.toISOString()],
      );

      // 4. إشعار الترحيب بالباقة
      await tx.query(
        `INSERT INTO "Notification" ("userId", "title", "message", "link") VALUES ($1, $2, $3, $4)`,
        [
          sessionUser.id,
          `🎉 تم تفعيل ${plan.name}!`,
          `اشتراكك فعّال حتى ${end.toLocaleDateString("ar-DZ")}. استمتع بمزايا باقتك الجديدة.`,
          "/profile",
        ],
      );
    });

    return NextResponse.json(
      { message: `تم الاشتراك في ${plan.name} بنجاح! 🎉` },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    const msg = err?.message || "حدث خطأ في الخادم";
    const isClientError = msg.includes("غير كاف");
    return NextResponse.json({ message: msg }, { status: isClientError ? 400 : 500 });
  }
}

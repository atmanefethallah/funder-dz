import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { getActiveSubscription } from "@/lib/entitlements";

// ❌ إلغاء الاشتراك — يبقى فعّالاً حتى نهاية الدورة المدفوعة
export async function POST() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: "يرجى تسجيل الدخول" }, { status: 401 });
    }

    const sub = await getActiveSubscription(sessionUser.id);
    if (!sub) {
      return NextResponse.json({ message: "لا يوجد اشتراك فعّال لإلغاءه" }, { status: 404 });
    }

    if (sub.cancelAtPeriodEnd) {
      return NextResponse.json({ message: "الاشتراك مُلغى بالفعل وينتهي قريباً" }, { status: 400 });
    }

    await query(`UPDATE "Subscription" SET "cancelAtPeriodEnd" = true WHERE "id" = $1`, [sub.id]);

    await query(
      `INSERT INTO "Notification" ("userId", "title", "message", "link") VALUES ($1, $2, $3, $4)`,
      [
        sessionUser.id,
        "تم إلغاء التجديد التلقائي",
        `ستحتفظ بمزايا "${sub.plan.name}" حتى نهاية دورتك الحالية، ولن يتم تجديدها تلقائياً.`,
        "/pricing",
      ],
    );

    return NextResponse.json({
      message: "تم إلغاء التجديد. ستحتفظ بمزاياك حتى نهاية الدورة الحالية.",
    });
  } catch (error) {
    console.error("Cancel Subscription Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

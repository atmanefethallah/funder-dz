import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// بيانات الباقات نادراً ما تتبدّل، لهذا نستخدم تخزيناً مؤقتاً (60 ثانية) لتقليل الحمل على قاعدة البيانات
export const revalidate = 60;

type PlanRow = {
  priceMonthly: string;
  priceYearly: string;
  [key: string]: unknown;
};

// 📥 قائمة الباقات الفعالة — عامة (لصفحة الأسعار)
export async function GET() {
  try {
    const plans = await query<PlanRow>(
      `SELECT * FROM "Plan" WHERE "isActive" = true ORDER BY "targetRole" ASC, "priceMonthly" ASC`,
    );

    // تحويل Decimal إلى Number لتسلسل JSON سليم
    const serialized = plans.map((p) => ({
      ...p,
      priceMonthly: Number(p.priceMonthly),
      priceYearly: Number(p.priceYearly),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("GET Plans Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

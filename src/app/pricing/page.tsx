// src/app/pricing/page.tsx — صفحة الأسعار والباقات
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { getActiveSubscription, canCreatePlace, canGenerateSmartPlan } from "@/lib/entitlements";
import PricingCards from "@/components/pricing/PricingCards";
import { Sparkles, Crown, Building2, Backpack } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "الباقات والأسعار — Funder",
  description: "اختر الباقة المناسبة لك: للسياح والشركاء",
};

type PlanRow = {
  id: string;
  key: string;
  name: string;
  targetRole: string;
  priceMonthly: string;
  priceYearly: string;
  features: Record<string, unknown>;
};

export default async function PricingPage() {
  const sessionUser = await getSessionUser();

  // جلب الباقات الفعالة من قاعدة البيانات
  const plansRaw = await query<PlanRow>(
    `SELECT * FROM "Plan" WHERE "isActive" = true ORDER BY "targetRole" ASC, "priceMonthly" ASC`,
  );

  // تحويل Decimal إلى Number قبل التمرير لمكونات العميل
  const plans = plansRaw.map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    targetRole: p.targetRole,
    priceMonthly: Number(p.priceMonthly),
    priceYearly: Number(p.priceYearly),
    features: p.features as Record<string, unknown>,
  }));

  // حالة المستخدم الحالي
  let currentPlanKey: string | null = null;
  let balance = 0;
  let userRole: string | null = null;
  let usage: { used: number; limit: number } | null = null;

  if (sessionUser) {
    userRole = sessionUser.role;
    const sub = await getActiveSubscription(sessionUser.id);
    currentPlanKey = sub?.plan.key ?? null;

    const dbUser = await queryOne<{ balance: string }>(
      `SELECT "balance" FROM "User" WHERE "id" = $1`,
      [sessionUser.id],
    );
    balance = dbUser ? Number(dbUser.balance) : 0;

    // الاستخدام الحالي حسب الدور
    if (sessionUser.role === "PARTNER") {
      const gate = await canCreatePlace(sessionUser.id);
      usage = { used: gate.used, limit: gate.limit };
    } else {
      const gate = await canGenerateSmartPlan(sessionUser.id);
      usage = { used: gate.used, limit: gate.limit };
    }
  }

  const partnerPlans = plans.filter((p) => p.targetRole === "PARTNER");
  const touristPlans = plans.filter((p) => p.targetRole === "TOURIST");

  return (
    <main className="min-h-screen bg-gray-50 py-16 px-4" dir="rtl">
      <div className="mx-auto max-w-6xl">

        {/* الترويسة */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm mb-6">
            <Crown size={16} className="fill-amber-500 text-amber-500" /> باقات مرنة لكل الاحتياجات
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            اختر باقتك المثالية
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            سواء كنت سائحاً يستكشف أو شريكاً يدير معالم، لدينا باقة تناسب طموحك.
            ادفع من محفظتك مباشرة وبأمان تام.
          </p>
        </div>

        {/* شريط حالة المستخدم */}
        {sessionUser && (
          <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl"><Sparkles size={20} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">باقتك الحالية</p>
                <p className="font-black text-gray-900">{currentPlanKey ?? "الباقة المجانية"}</p>
              </div>
            </div>
            {usage && (
              <div className="text-center">
                <p className="text-sm text-gray-500 font-medium">
                  {userRole === "PARTNER" ? "المعالم المستخدمة" : "الخطط الذكية هذا الشهر"}
                </p>
                <p className="font-black text-gray-900" dir="ltr">
                  {usage.used} / {usage.limit === -1 ? "∞" : usage.limit}
                </p>
              </div>
            )}
            <div className="text-left">
              <p className="text-sm text-gray-500 font-medium">رصيد محفظتك</p>
              <p className="font-black text-blue-600 text-lg" dir="ltr">{balance.toLocaleString("en-DZ")} د.ج</p>
            </div>
          </div>
        )}

        {/* باقات الشركاء */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gray-900 text-white p-3 rounded-2xl"><Building2 size={24} /></div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">باقات الشركاء</h2>
              <p className="text-sm text-gray-500">لأصحاب المعالم والمنشأات السياحية</p>
            </div>
          </div>
          <PricingCards
            plans={partnerPlans}
            currentPlanKey={currentPlanKey}
            isLoggedIn={!!sessionUser}
            userRole={userRole}
            balance={balance}
            accent="dark"
          />
        </section>

        {/* باقات السياح */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 text-white p-3 rounded-2xl"><Backpack size={24} /></div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">باقات السياح</h2>
              <p className="text-sm text-gray-500">عزّز تجربتك السياحية مع Funder Plus</p>
            </div>
          </div>
          <PricingCards
            plans={touristPlans}
            currentPlanKey={currentPlanKey}
            isLoggedIn={!!sessionUser}
            userRole={userRole}
            balance={balance}
            accent="blue"
          />
        </section>

      </div>
    </main>
  );
}

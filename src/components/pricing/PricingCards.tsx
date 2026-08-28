// src/components/pricing/PricingCards.tsx — بطاقات الباقات التفاعلية (عميل)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Crown, Zap, Building2, Backpack, Sparkles } from "lucide-react";

type Plan = {
  id: string;
  key: string;
  name: string;
  targetRole: string;
  priceMonthly: number;
  priceYearly: number;
  features: Record<string, any>;
};

const FEATURE_LABELS: Record<string, (v: any) => string | null> = {
  maxPlaces: (v) => (v === -1 ? "معالم غير محدودة" : `حتى ${v} ${v === 1 ? "معلم" : "معالم"}`),
  commissionRate: (v) => `عمولة ${Math.round(v * 100)}% فقط على العربون`,
  vrTours: (v) => (v === -1 ? "جولات VR غير محدودة" : v > 0 ? `${v} جولات VR 360°` : null),
  featured: (v) => (v ? "ظهور مميز في نتائج البحث" : null),
  promoNotificationsPerMonth: (v) => (v > 0 ? `${v} إشعارات ترويجية/شهر` : null),
  analytics: (v) => (v === "advanced" ? "تحليلات متقدمة" : v === "advanced_export" ? "تحليلات + تصدير تقارير" : "تحليلات أساسية"),
  accountManager: (v) => (v ? "مدير حساب مخصص" : null),
  smartPlansPerMonth: (v) => (v === -1 ? "خطط ذكية غير محدودة" : `${v} خطط ذكية/شهر`),
  depositRate: (v) => `عربون ${Math.round(v * 100)}% ${v < 0.1 ? "(مخفّض!)" : ""}`,
  exclusiveVr: (v) => (v ? "جولات VR حصرية" : null),
  priorityBooking: (v) => (v ? "أولوية تأكيد الحجوزات" : null),
  partnerDiscounts: (v) => (v ? "خصومات عند الشركاء" : null),
};

const PLAN_ICONS: Record<string, any> = {
  PARTNER_FREE: Building2,
  PARTNER_PRO: Zap,
  PARTNER_BUSINESS: Crown,
  TOURIST_FREE: Backpack,
  TOURIST_PLUS: Sparkles,
};

export default function PricingCards({
  plans,
  currentPlanKey,
  isLoggedIn,
  userRole,
  balance,
  accent,
}: {
  plans: Plan[];
  currentPlanKey: string | null;
  isLoggedIn: boolean;
  userRole: string | null;
  balance: number;
  accent: "blue" | "dark";
}) {
  const router = useRouter();
  const [billing, setBilling] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const handleSubscribe = async (planKey: string) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLoadingKey(planKey);
    setMessage(null);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, billingCycle: billing }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, ok: true });
        router.refresh();
      } else {
        setMessage({ text: data.message, ok: false });
      }
    } catch {
      setMessage({ text: "تعذر الاتصال بالخادم.", ok: false });
    } finally {
      setLoadingKey(null);
    }
  };

  const accentBtn = accent === "dark" ? "bg-gray-900 hover:bg-gray-800" : "bg-blue-600 hover:bg-blue-700";

  return (
    <div>
      {/* مبدّل شهري/سنوي */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-xl bg-white border border-gray-200 p-1 shadow-sm">
          {(["MONTHLY", "YEARLY"] as const).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBilling(cycle)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition ${
                billing === cycle ? "bg-gray-900 text-white shadow" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {cycle === "MONTHLY" ? "شهري" : "سنوي"}
              {cycle === "YEARLY" && <span className="mr-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">وفّر شهرين</span>}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`mb-6 rounded-xl p-4 text-sm font-bold text-center ${message.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`} role="status">
          {message.text}
        </div>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-2 ${plans.length >= 3 ? "lg:grid-cols-3" : ""} gap-6`}>
        {plans.map((plan) => {
          const price = billing === "YEARLY" ? plan.priceYearly : plan.priceMonthly;
          const isCurrent = currentPlanKey === plan.key;
          const isFree = plan.priceMonthly === 0 && plan.priceYearly === 0;
          const isPopular = plan.key === "PARTNER_PRO" || plan.key === "TOURIST_PLUS";
          const Icon = PLAN_ICONS[plan.key] || Sparkles;
          const canAfford = balance >= price;
          const wrongRole = isLoggedIn && userRole !== plan.targetRole && userRole !== "ADMIN";

          const featureLines = Object.entries(plan.features || {})
            .map(([k, v]) => (FEATURE_LABELS[k] ? FEATURE_LABELS[k](v) : null))
            .filter(Boolean) as string[];

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border-2 bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-xl ${
                isPopular ? "border-amber-400 shadow-lg shadow-amber-100" : "border-gray-200"
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3.5 right-6 bg-gradient-to-l from-amber-400 to-amber-500 text-amber-950 text-xs font-black px-3 py-1 rounded-full shadow">
                  ⭐ الأكثر شيوعاً
                </span>
              )}

              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${isPopular ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-600"}`}>
                <Icon size={24} />
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-1">{plan.name}</h3>

              <div className="flex items-end gap-2 mb-6" dir="ltr">
                <span className="text-4xl font-black text-gray-900">{price.toLocaleString("en-DZ")}</span>
                <span className="text-gray-500 mb-1 font-bold">د.ج / {billing === "YEARLY" ? "سنة" : "شهر"}</span>
              </div>

              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {featureLines.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full text-center py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 font-black text-sm">
                  ✓ باقتك الحالية
                </div>
              ) : wrongRole ? (
                <div className="w-full text-center py-3 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed">
                  لنوع الحساب الآخر
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={loadingKey !== null || (isFree && isLoggedIn)}
                  className={`w-full py-3 rounded-xl font-black text-sm text-white transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 ${accentBtn}`}
                >
                  {loadingKey === plan.key ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : isFree ? (
                    isLoggedIn ? "باقتك الأساسية" : "ابدأ مجاناً"
                  ) : !isLoggedIn ? (
                    "سجّل الدخول للاشتراك"
                  ) : !canAfford ? (
                    `اشحن محفظتك (ينقصك ${(price - balance).toLocaleString("en-DZ")} د.ج)`
                  ) : (
                    "اشترك الآن"
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

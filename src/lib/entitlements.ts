// src/lib/entitlements.ts — بوابة الميزات المركزية: تتحقق من باقة المستخدم وحدودها
import { query, queryOne } from "@/lib/db";

export type PlanFeatures = {
  maxPlaces?: number; // -1 = गير محدود
  commissionRate?: number;
  smartPlansPerMonth?: number; // -1 = गير محدود
  depositRate?: number;
  vrTours?: number;
  featured?: boolean;
  priorityBooking?: boolean;
  exclusiveVr?: boolean;
  partnerDiscounts?: boolean;
  promoNotificationsPerMonth?: number;
  analytics?: string;
  accountManager?: boolean;
};

type ActiveSubscription = {
  id: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  plan: {
    id: string;
    key: string;
    name: string;
    targetRole: string;
    priceMonthly: string;
    priceYearly: string;
    features: PlanFeatures;
  };
};

// حدود الباقة المجانية الافتراضية لكل دور (عند عدم وجود اشتراك فعّال)
const FREE_DEFAULTS: Record<string, PlanFeatures> = {
  PARTNER: { maxPlaces: 1, commissionRate: 0.15, vrTours: 0, featured: false, promoNotificationsPerMonth: 0, analytics: "basic" },
  TOURIST: { smartPlansPerMonth: 3, depositRate: 0.1, exclusiveVr: false, priorityBooking: false, partnerDiscounts: false },
};

/** يجلب الاشتراك الفعّال (ACTIVE/TRIAL गير المنتهي) مع باقته */
export async function getActiveSubscription(userId: string): Promise<ActiveSubscription | null> {
  const row = await queryOne<{
    id: string;
    status: string;
    billingCycle: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    plan_id: string;
    plan_key: string;
    plan_name: string;
    plan_targetRole: string;
    plan_priceMonthly: string;
    plan_priceYearly: string;
    plan_features: PlanFeatures;
  }>(
    `SELECT s."id", s."status", s."billingCycle", s."currentPeriodStart", s."currentPeriodEnd", s."cancelAtPeriodEnd",
            p."id" AS "plan_id", p."key" AS "plan_key", p."name" AS "plan_name", p."targetRole" AS "plan_targetRole",
            p."priceMonthly" AS "plan_priceMonthly", p."priceYearly" AS "plan_priceYearly", p."features" AS "plan_features"
     FROM "Subscription" s
     JOIN "Plan" p ON p."id" = s."planId"
     WHERE s."userId" = $1 AND s."status" IN ('ACTIVE', 'TRIAL') AND s."currentPeriodEnd" >= now()
     ORDER BY s."currentPeriodEnd" DESC
     LIMIT 1`,
    [userId],
  );

  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    billingCycle: row.billingCycle,
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    plan: {
      id: row.plan_id,
      key: row.plan_key,
      name: row.plan_name,
      targetRole: row.plan_targetRole,
      priceMonthly: row.plan_priceMonthly,
      priceYearly: row.plan_priceYearly,
      features: row.plan_features,
    },
  };
}

/** يعيد ميزات الباقة الفعالة للمستخدم، أو حدود المجاني إن لم يكن مشتركاً */
export async function getPlanFeatures(userId: string, role: string): Promise<{
  features: PlanFeatures;
  planKey: string;
  planName: string;
  isPaid: boolean;
}> {
  const sub = await getActiveSubscription(userId);
  if (sub) {
    return {
      features: sub.plan.features || {},
      planKey: sub.plan.key,
      planName: sub.plan.name,
      isPaid: true,
    };
  }
  return {
    features: FREE_DEFAULTS[role] || FREE_DEFAULTS.TOURIST,
    planKey: `${role}_FREE`,
    planName: "الباقة المجانية",
    isPaid: false,
  };
}

/** عدّ استخدام ميزة خلال الشهر الحالي */
export async function getMonthlyUsage(userId: string, kind: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM "UsageEvent" WHERE "userId" = $1 AND "kind" = $2 AND "createdAt" >= $3`,
    [userId, kind, startOfMonth.toISOString()],
  );
  return row ? parseInt(row.count, 10) : 0;
}

/** تسجيل استخدام ميزة */
export async function recordUsage(userId: string, kind: string) {
  await query(`INSERT INTO "UsageEvent" ("userId", "kind") VALUES ($1, $2)`, [userId, kind]);
}

/** فحص: هل يمكن للشريك إضافة معلم جديد ضمن حد باقته؟ */
export async function canCreatePlace(userId: string): Promise<{ allowed: boolean; reason?: string; used: number; limit: number }> {
  const { features, planName } = await getPlanFeatures(userId, "PARTNER");
  const limit = features.maxPlaces ?? 1;

  const countRow = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "Place" WHERE "userId" = $1`, [userId]);
  const used = countRow ? parseInt(countRow.count, 10) : 0;

  if (limit === -1) {
    return { allowed: true, used, limit };
  }
  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      reason: `وصلت لحد باقتك (${planName}): ${limit} معلم. رقّ باقتك لإضافة المزيد.`,
    };
  }
  return { allowed: true, used, limit };
}

/** فحص: هل يمكن للسائح توليد خطة ذكية ضمن حد باقته الشهري؟ */
export async function canGenerateSmartPlan(userId: string): Promise<{ allowed: boolean; reason?: string; used: number; limit: number }> {
  const { features, planName } = await getPlanFeatures(userId, "TOURIST");
  const limit = features.smartPlansPerMonth ?? 3;
  const used = await getMonthlyUsage(userId, "SMART_PLAN");
  if (limit === -1) return { allowed: true, used, limit };
  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      reason: `استهلكت خططك المجانية لهذا الشهر (${limit}). باقة ${planName === "الباقة المجانية" ? "Funder Plus" : planName} تمنحك خططاً गير محدودة.`,
    };
  }
  return { allowed: true, used, limit };
}

/** نسبة العربون حسب باقة السائح */
export async function getDepositRate(userId: string): Promise<number> {
  const { features } = await getPlanFeatures(userId, "TOURIST");
  return features.depositRate ?? 0.1;
}

// src/lib/promotionPricing.ts — حساب موحّد لسعر حملات Funder Promote
// يُستخدم في كل من معاينة السعر (GET) وحجز الحملة الفعلي (POST)
// لضمان أن السعر المعروض للشريك هو ذاته السعر الذي يُحجز فعلاً.

export type PromotionSettingsMap = {
  durationPrices?: Record<string, number>;
  reachMultipliers?: Record<string, number>;
  priorityMultipliers?: Record<string, number>;
  frequencyCap?: Record<string, number>;
};

export type PromotionPackageRow = {
  id?: string;
  key: string;
  name: string;
  durationDays: number;
  reach: string;
  priority: string;
  basePrice: number | string;
};

export type PromotionPriceBreakdown = {
  basePrice: number;
  reachMultiplier: number;
  priorityMultiplier: number;
  total: number;
};

/** يحسب سعر باقة ترويج بناءً على إعدادات الخادم الحالية فقط. */
export function computePromotionPrice(
  pkg: PromotionPackageRow,
  settings: PromotionSettingsMap,
): PromotionPriceBreakdown {
  const basePrice = Number(
    settings.durationPrices?.[String(pkg.durationDays)] ?? pkg.basePrice,
  );
  const reachMultiplier = Number(settings.reachMultipliers?.[pkg.reach] ?? 1);
  const priorityMultiplier = Number(
    settings.priorityMultipliers?.[pkg.priority] ?? 1,
  );
  const total =
    Math.round(basePrice * reachMultiplier * priorityMultiplier * 100) / 100;
  return { basePrice, reachMultiplier, priorityMultiplier, total };
}

export function settingsRowsToMap(
  rows: Array<{ key: string; value: unknown }>,
): PromotionSettingsMap {
  return Object.fromEntries(
    rows.map((row) => [row.key, row.value]),
  ) as PromotionSettingsMap;
}

export const REACH_LABELS_AR: Record<string, string> = {
  LOCAL: "محلي",
  REGIONAL: "جهوي",
  NATIONAL: "وطني",
  TARGETED: "مستهدف",
};

export const PRIORITY_LABELS_AR: Record<string, string> = {
  NORMAL: "عادي",
  FEATURED: "مميّز",
  PRIORITY: "أولوية قصوى",
};

export const PROMOTION_STATUS_LABELS_AR: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: { label: "مسودة", className: "bg-gray-100 text-gray-600" },
  PENDING_REVIEW: {
    label: "بانتظار المراجعة",
    className: "bg-amber-100 text-amber-700",
  },
  ACTIVE: { label: "نشطة الآن", className: "bg-green-100 text-green-700" },
  PAUSED: { label: "متوقفة مؤقتاً", className: "bg-blue-100 text-blue-700" },
  REJECTED: { label: "مرفوضة", className: "bg-red-100 text-red-700" },
  COMPLETED: { label: "مكتملة", className: "bg-gray-200 text-gray-700" },
  CANCELLED: { label: "ملغاة", className: "bg-red-100 text-red-500" },
};

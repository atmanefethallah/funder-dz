// src/lib/placeCategoryIcons.ts
// خريطة رموز وألوان أنواع المعالم السياحية — تُستخدم في جميع مكونات الخريطة التفاعلية
// حتى يتم تمييز كل نوع معلم برمز وألوان خاصة به بدل الدبوس الموحّد القديم

export type CategoryMeta = {
  emoji: string;
  label: string;
  color: string; // اللون الأساسي (Hex) يُستخدم داخل أيقونات Leaflet
  bgClass: string;
  textClass: string;
  borderClass: string;
};

const CATEGORY_MAP: Record<string, CategoryMeta> = {
  "تاريخي": {
    emoji: "🏛️",
    label: "تاريخي وثقافي",
    color: "#b45309",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-500",
  },
  "ترفيهي": {
    emoji: "🎡",
    label: "ترفيهي ومغامرات",
    color: "#7c3aed",
    bgClass: "bg-purple-50",
    textClass: "text-purple-700",
    borderClass: "border-purple-500",
  },
  "طبيعي": {
    emoji: "🌿",
    label: "طبيعي (شواطئ وغابات)",
    color: "#059669",
    bgClass: "bg-green-50",
    textClass: "text-green-700",
    borderClass: "border-green-500",
  },
  "فعالية": {
    emoji: "🎉",
    label: "فعالية / مهرجان",
    color: "#db2777",
    bgClass: "bg-pink-50",
    textClass: "text-pink-700",
    borderClass: "border-pink-500",
  },
  "فندق": {
    emoji: "🏨",
    label: "فندق وإقامة",
    color: "#0891b2",
    bgClass: "bg-cyan-50",
    textClass: "text-cyan-700",
    borderClass: "border-cyan-500",
  },
  // توافق مع تصنيفات قديمة محتملة في قاعدة البيانات
  "CULTURAL": {
    emoji: "🏛️",
    label: "مسلك ثقافي",
    color: "#b45309",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-500",
  },
};

const DEFAULT_META: CategoryMeta = {
  emoji: "📍",
  label: "معلم سياحي",
  color: "#2563eb",
  bgClass: "bg-blue-50",
  textClass: "text-blue-700",
  borderClass: "border-blue-500",
};

export function getCategoryMeta(category?: string | null): CategoryMeta {
  if (!category) return DEFAULT_META;
  return CATEGORY_MAP[category] || DEFAULT_META;
}

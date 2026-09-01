"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Megaphone,
  Wallet,
  Lock,
  CheckCircle2,
  Sparkles,
  Eye,
  MousePointerClick,
  TrendingUp,
  Calendar,
  MapPin,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  REACH_LABELS_AR,
  PRIORITY_LABELS_AR,
  PROMOTION_STATUS_LABELS_AR,
} from "@/lib/promotionPricing";

type Place = {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  eventEndsAt: string | null;
  isEvent: boolean | null;
};

type PackagePrice = {
  basePrice: number;
  reachMultiplier: number;
  priorityMultiplier: number;
  total: number;
};

type Package = {
  key: string;
  name: string;
  durationDays: number;
  reach: string;
  priority: string;
  basePrice: number;
  price: PackagePrice;
};

type Campaign = {
  id: string;
  name: string;
  status: string;
  budget: string;
  reservedAmount: string;
  spentAmount: string;
  startAt: string;
  endAt: string;
  reach: string;
  priority: string;
  rejectionReason: string | null;
  createdAt: string;
  placeName: string;
  placeImage: string | null;
  impressions: number;
  clicks: number;
  conversions: number;
};

type PromotionsResponse = {
  places: Place[];
  packages: Package[];
  campaigns: Campaign[];
  wallet: { balance: number; reservedBalance: number; available: number };
};

function formatMoney(n: number) {
  return `${n.toLocaleString("ar-DZ", { maximumFractionDigits: 2 })} دج`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-DZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PromoteForm() {
  const [data, setData] = useState<PromotionsResponse | null>(null);
  const [placeId, setPlaceId] = useState("");
  const [packageKey, setPackageKey] = useState("");
  const [startAt, setStartAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);

  const load = () =>
    fetch("/api/partner/promotions", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: PromotionsResponse) => {
        setData(d);
        setPlaceId((prev) => prev || d.places?.[0]?.id || "");
        setPackageKey((prev) => prev || d.packages?.[0]?.key || "");
      })
      .finally(() => setInitialLoading(false));

  useEffect(() => {
    load();
  }, []);

  const selectedPlace = useMemo(
    () => data?.places.find((p) => p.id === placeId) || null,
    [data, placeId],
  );
  const selectedPackage = useMemo(
    () => data?.packages.find((p) => p.key === packageKey) || null,
    [data, packageKey],
  );

  const endPreview = useMemo(() => {
    if (!startAt || !selectedPackage) return null;
    const start = new Date(startAt);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + selectedPackage.durationDays);
    return end;
  }, [startAt, selectedPackage]);

  const exceedsEventEnd =
    !!selectedPlace?.eventEndsAt &&
    !!endPreview &&
    endPreview > new Date(selectedPlace.eventEndsAt);

  const insufficientFunds =
    !!selectedPackage &&
    !!data &&
    selectedPackage.price.total > data.wallet.available;

  const canSubmit =
    !!placeId &&
    !!packageKey &&
    !!startAt &&
    !exceedsEventEnd &&
    !insufficientFunds &&
    !loading;

  const submit = async () => {
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch("/api/partner/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, packageKey, startAt }),
      });
      const d = await r.json();
      setMsg(d.message);
      setMsgOk(r.ok);
      if (r.ok) {
        setStartAt("");
        load();
      }
    } catch {
      setMsg("تعذر الاتصال بالخادم");
      setMsgOk(false);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading || !data) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8" dir="rtl">
      {/* الترويسة */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-l from-amber-500 to-orange-600 p-6 text-white shadow-lg">
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Megaphone /> Funder Promote
        </h1>
        <p className="mt-1 text-sm font-semibold text-white/90">
          روّج لعناصر تملكها فقط. السعر يُحسب في الخادم وتُحجز الميزانية من
          المحفظة حتى موافقة الإدارة.
        </p>
      </div>

      {/* ملخص المحفظة */}
      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
            <Wallet size={14} /> رصيد المحفظة
          </p>
          <p className="mt-1 text-xl font-black text-gray-900">
            {formatMoney(data.wallet.balance)}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
            <Lock size={14} /> محجوز لحملات
          </p>
          <p className="mt-1 text-xl font-black text-amber-600">
            {formatMoney(data.wallet.reservedBalance)}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
            <CheckCircle2 size={14} /> متاح للإنفاق
          </p>
          <p className="mt-1 text-xl font-black text-green-600">
            {formatMoney(data.wallet.available)}
          </p>
        </div>
      </section>

      {/* اختيار المعلم */}
      <section className="mt-6 rounded-3xl border bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 font-black text-gray-900">
          <MapPin size={18} className="text-amber-600" /> اختر العنصر المراد
          ترويجه
        </h2>
        {data.places.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.places.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlaceId(p.id)}
                className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-right transition ${
                  placeId === p.id
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 hover:border-amber-300"
                }`}
              >
                <img
                  src={p.imageUrl || "/icons/icon.svg"}
                  alt={p.name}
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <span className="min-w-0">
                  <span className="block truncate font-bold text-gray-900">
                    {p.name}
                  </span>
                  <span className="block text-xs font-semibold text-gray-500">
                    {p.category}
                  </span>
                </span>
                {placeId === p.id && (
                  <CheckCircle2
                    className="mr-auto shrink-0 text-amber-600"
                    size={20}
                  />
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-gray-500">
            أضف معلماً أو فعالية أولاً حتى تتمكن من ترويجها.
          </p>
        )}
      </section>

      {/* اختيار الباقة */}
      <section className="mt-6 rounded-3xl border bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 font-black text-gray-900">
          <Sparkles size={18} className="text-amber-600" /> اختر باقة الترويج
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.packages.map((pkg) => {
            const active = packageKey === pkg.key;
            const recommended = pkg.key === "POPULAR";
            return (
              <button
                key={pkg.key}
                type="button"
                onClick={() => setPackageKey(pkg.key)}
                className={`relative flex flex-col gap-2 rounded-2xl border-2 p-4 text-right transition ${
                  active
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 hover:border-amber-300"
                }`}
              >
                {recommended && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">
                    الأكثر طلباً
                  </span>
                )}
                <span className="font-black text-gray-900">{pkg.name}</span>
                <span className="flex items-center gap-1 text-xs font-bold text-gray-500">
                  <Clock size={13} /> {pkg.durationDays} يوم
                </span>
                <span className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                    انتشار {REACH_LABELS_AR[pkg.reach] || pkg.reach}
                  </span>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700">
                    أولوية {PRIORITY_LABELS_AR[pkg.priority] || pkg.priority}
                  </span>
                </span>
                <span className="mt-1 text-lg font-black text-amber-600">
                  {formatMoney(pkg.price.total)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* التوقيت وملخص السعر */}
      <section className="mt-6 grid gap-4 rounded-3xl border bg-white p-5 md:grid-cols-2">
        <div>
          <label className="mb-2 flex items-center gap-2 font-black text-gray-900">
            <Calendar size={18} className="text-amber-600" /> تاريخ ووقت انطلاق
            الحملة
          </label>
          <input
            type="datetime-local"
            className="w-full rounded-xl border p-3 font-semibold"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
          {endPreview && (
            <p className="mt-2 text-xs font-bold text-gray-500">
              تنتهي الحملة تقريباً في: {formatDate(endPreview.toISOString())}
            </p>
          )}
          {exceedsEventEnd && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-red-600">
              <AlertTriangle size={14} /> مدة الباقة تتجاوز نهاية الفعالية. اختر
              باقة أقصر أو تاريخ أقرب.
            </p>
          )}
        </div>
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="mb-2 font-black text-gray-900">ملخص السعر</p>
          {selectedPackage ? (
            <ul className="space-y-1.5 text-sm font-semibold text-gray-600">
              <li className="flex justify-between">
                <span>السعر الأساسي</span>
                <span>{formatMoney(selectedPackage.price.basePrice)}</span>
              </li>
              <li className="flex justify-between">
                <span>مضاعف الانتشار</span>
                <span>× {selectedPackage.price.reachMultiplier}</span>
              </li>
              <li className="flex justify-between">
                <span>مضاعف الأولوية</span>
                <span>× {selectedPackage.price.priorityMultiplier}</span>
              </li>
              <li className="mt-2 flex justify-between border-t pt-2 text-base font-black text-gray-900">
                <span>الإجمالي المحجوز</span>
                <span>{formatMoney(selectedPackage.price.total)}</span>
              </li>
            </ul>
          ) : (
            <p className="text-sm font-semibold text-gray-500">
              اختر باقة أولاً
            </p>
          )}
          {insufficientFunds && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-red-600">
              <AlertTriangle size={14} /> رصيدك المتاح لا يكفي لهذه الباقة.
            </p>
          )}
        </div>
      </section>

      <button
        onClick={submit}
        disabled={!canSubmit}
        className="mt-4 w-full rounded-2xl bg-amber-500 p-4 text-lg font-black text-white shadow-md transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "جاري حجز الميزانية..." : "إنشاء الحملة"}
      </button>
      {msg && (
        <p
          className={`mt-2 text-center text-sm font-bold ${msgOk ? "text-green-600" : "text-red-600"}`}
        >
          {msg}
        </p>
      )}

      {/* حملاتي */}
      <section className="mt-8">
        <h2 className="mb-3 font-black text-gray-900">حملاتي</h2>
        {data.campaigns.length ? (
          <div className="space-y-3">
            {data.campaigns.map((c) => {
              const status = PROMOTION_STATUS_LABELS_AR[c.status] || {
                label: c.status,
                className: "bg-gray-100 text-gray-600",
              };
              const budget = Number(c.budget) || 0;
              const spent = Number(c.spentAmount) || 0;
              const progress =
                budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (new Date(c.endAt).getTime() - Date.now()) / 86400000,
                ),
              );
              return (
                <div key={c.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <img
                      src={c.placeImage || "/icons/icon.svg"}
                      alt={c.placeName}
                      className="h-11 w-11 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-gray-900">
                        {c.placeName}
                      </p>
                      <p className="text-xs font-semibold text-gray-500">
                        {formatDate(c.startAt)} ← {formatDate(c.endAt)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-gray-600">
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                      <Eye size={13} /> {c.impressions} مشاهدة
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                      <MousePointerClick size={13} /> {c.clicks} نقرة
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                      <TrendingUp size={13} /> {c.conversions} تحويل
                    </span>
                    {c.status === "ACTIVE" && (
                      <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                        <Clock size={13} /> {daysLeft} يوم متبقّ
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs font-bold text-gray-500">
                      <span>
                        {formatMoney(spent)} منفق من {formatMoney(budget)}
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {c.status === "REJECTED" && c.rejectionReason && (
                    <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-red-50 p-2.5 text-xs font-bold text-red-600">
                      <XCircle size={14} /> {c.rejectionReason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border bg-white p-6 text-center text-gray-500">
            لا توجد حملات بعد.
          </div>
        )}
      </section>
    </main>
  );
}

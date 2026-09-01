"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Megaphone,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowRight,
  Eye,
  MousePointerClick,
  Target,
} from "lucide-react";
import {
  PROMOTION_STATUS_LABELS_AR,
  REACH_LABELS_AR,
  PRIORITY_LABELS_AR,
} from "@/lib/promotionPricing";

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
  placeItemType: string | null;
  partnerName: string;
  partnerEmail: string;
  impressions: number;
  clicks: number;
  conversions: number;
};

export default function AdminPromotionsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PENDING_REVIEW">(
    "PENDING_REVIEW",
  );

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promotions");
      const out = await res.json();
      if (!res.ok) throw new Error(out.message);
      setCampaigns(out.campaigns || []);
    } catch (e: any) {
      setError(e.message || "تعذر تحميل الحملات");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.message);
      setRejectingId(null);
      setReason("");
      await load();
    } catch (e: any) {
      setError(e.message || "تعذر تنفيذ الإجراء");
    } finally {
      setBusyId(null);
    }
  };

  const visible = campaigns.filter((c) =>
    filter === "ALL" ? true : c.status === "PENDING_REVIEW",
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-gray-800">
            <Megaphone className="text-fuchsia-600" />
            مراجعة حملات Funder Promote
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            راجع ووافق أو ارفض حملات ترويج الشركاء. الرفض يعيد المبلغ المحجوز
            فوراً إلى محفظة الشريك.
          </p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-gray-900"
        >
          <ArrowRight size={16} /> رجوع للوحة الإدارة
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter("PENDING_REVIEW")}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${filter === "PENDING_REVIEW" ? "bg-fuchsia-600 text-white" : "bg-white border text-gray-600"}`}
        >
          بانتظار المراجعة
        </button>
        <button
          onClick={() => setFilter("ALL")}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${filter === "ALL" ? "bg-fuchsia-600 text-white" : "bg-white border text-gray-600"}`}
        >
          كل الحملات
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-3 font-bold text-red-700"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-fuchsia-600" size={32} />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">
          لا توجد حملات لعرضها حالياً.
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((c) => {
            const statusInfo = PROMOTION_STATUS_LABELS_AR[c.status] || {
              label: c.status,
              className: "bg-gray-100 text-gray-600",
            };
            return (
              <div
                key={c.id}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {c.placeImage ? (
                      <img
                        src={c.placeImage}
                        alt={c.placeName}
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-gray-100" />
                    )}
                    <div>
                      <h3 className="font-black text-gray-800">{c.name}</h3>
                      <p className="text-sm text-gray-500">
                        المعلم: {c.placeName} — الشريك: {c.partnerName} (
                        {c.partnerEmail})
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(c.startAt).toLocaleDateString("ar-DZ")} ←{" "}
                        {new Date(c.endAt).toLocaleDateString("ar-DZ")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <Stat
                    label="الميزانية"
                    value={`${Number(c.budget).toLocaleString()} د.ج`}
                  />
                  <Stat
                    label="المحجوز"
                    value={`${Number(c.reservedAmount).toLocaleString()} د.ج`}
                  />
                  <Stat
                    label="المنفق"
                    value={`${Number(c.spentAmount).toLocaleString()} د.ج`}
                  />
                  <Stat
                    label="الانتشار"
                    value={REACH_LABELS_AR[c.reach] || c.reach}
                  />
                  <Stat
                    label="الأولوية"
                    value={PRIORITY_LABELS_AR[c.priority] || c.priority}
                  />
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye size={14} /> {c.impressions} مشاهدة
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick size={14} /> {c.clicks} نقرة
                  </span>
                  <span className="flex items-center gap-1">
                    <Target size={14} /> {c.conversions} تحويل
                  </span>
                </div>

                {c.rejectionReason && (
                  <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs font-bold text-red-600">
                    سبب الرفض السابق: {c.rejectionReason}
                  </p>
                )}

                {c.status === "PENDING_REVIEW" && (
                  <div className="mt-4 border-t pt-3">
                    {rejectingId === c.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className="flex-1 min-w-[200px] rounded-xl border p-2 text-sm"
                          placeholder="سبب الرفض…"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                        <button
                          disabled={busyId === c.id || !reason.trim()}
                          onClick={() => act(c.id, "reject")}
                          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                        >
                          {busyId === c.id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            "تأكيد الرفض"
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setReason("");
                          }}
                          className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          disabled={busyId === c.id}
                          onClick={() => act(c.id, "approve")}
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                        >
                          {busyId === c.id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          موافقة
                        </button>
                        <button
                          disabled={busyId === c.id}
                          onClick={() => setRejectingId(c.id)}
                          className="flex items-center gap-1 rounded-xl bg-white border border-red-200 px-4 py-2 text-sm font-bold text-red-600"
                        >
                          <XCircle size={16} /> رفض
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-2 text-center">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-sm font-black text-gray-800">{value}</p>
    </div>
  );
}

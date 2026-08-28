"use client";

import { useEffect, useState } from "react";
import { Ticket, Loader2, Plus, Copy, Power, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type VoucherRow = {
  code: string;
  amount: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { success, error: toastError, confirm: confirmDialog } = useToast();

  const [form, setForm] = useState({ code: "", amount: "", maxUses: "1", expiresAt: "" });

  const fetchVouchers = async () => {
    try {
      const res = await fetch("/api/admin/vouchers");
      if (res.ok) setVouchers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code || undefined,
          amount: form.amount,
          maxUses: form.maxUses,
          expiresAt: form.expiresAt || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        success("تم إنشاء القسيمة 🎉", `الرمز: ${data.code}`);
        setForm({ code: "", amount: "", maxUses: "1", expiresAt: "" });
        fetchVouchers();
      } else {
        toastError("فشل الإنشاء", data.message);
      }
    } catch (err) {
      toastError("خطأ في الاتصال", "تعذر الاتصال بالخادم.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (code: string, currentlyActive: boolean) => {
    const ok = await confirmDialog({
      title: currentlyActive ? "تعطيل القسيمة" : "تفعيل القسيمة",
      message: currentlyActive
        ? "سيتوقف السياح عن استخدام هذه القسيمة فوراً."
        : "سيصبح بإمكان السياح استخدام هذه القسيمة مجدداً.",
      confirmText: currentlyActive ? "تعطيل" : "تفعيل",
      danger: currentlyActive,
    });
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/vouchers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, isActive: !currentlyActive }),
      });
      if (res.ok) {
        setVouchers((prev) => prev.map((v) => (v.code === code ? { ...v, isActive: !currentlyActive } : v)));
      }
    } catch (err) {
      toastError("خطأ", "تعذر تحديث حالة القسيمة.");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    success("تم النسخ 📋", "تم نسخ رمز القسيمة.");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 py-10 px-4 pb-24" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-8">
          <Ticket className="text-blue-500" size={32} />
          <div>
            <h1 className="text-2xl font-black">إنشاء وإدارة قسائم فندر</h1>
            <p className="text-sm text-gray-500 font-bold mt-0.5">قسائم شحن المحفظة — يتم إنشاؤها هنا وتُستخدم فوراً من صفحة المحفظة</p>
          </div>
        </div>

        {/* 📝 نموذج إنشاء قسيمة جديدة */}
        <form onSubmit={handleCreate} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 mb-10 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-400 mb-1">رمز القسيمة (اختياري)</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="يُنشأ تلقائياً إن ترك فارغاً"
              className="w-full rounded-xl border border-gray-700 bg-gray-950 p-3 text-sm outline-none focus:border-blue-500 transition"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">المبلغ (د.ج)</label>
            <input
              required
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="مثال: 500"
              className="w-full rounded-xl border border-gray-700 bg-gray-950 p-3 text-sm outline-none focus:border-blue-500 transition"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">عدد مرات الاستخدام</label>
            <input
              required
              type="number"
              min="1"
              value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              className="w-full rounded-xl border border-gray-700 bg-gray-950 p-3 text-sm outline-none focus:border-blue-500 transition"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">تاريخ الانتهاء (اختياري)</label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full rounded-xl border border-gray-700 bg-gray-950 p-3 text-sm outline-none focus:border-blue-500 transition"
              dir="ltr"
            />
          </div>
          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={creating}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl transition disabled:opacity-60"
            >
              {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              {creating ? "جاري الإنشاء..." : "إنشاء القسيمة"}
            </button>
          </div>
        </form>

        {/* 📋 قائمة القسائم الموجودة */}
        <h2 className="mb-4 text-lg font-black text-gray-300 flex items-center gap-2">
          <Sparkles className="text-blue-500" size={18} /> القسائم الحالية
          <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full text-sm">{vouchers.length}</span>
        </h2>

        {vouchers.length === 0 ? (
          <div className="text-center py-16 text-gray-500 font-bold border-2 border-dashed border-gray-800 rounded-2xl">
            لا توجد قسائم بعد. أنشئ أول قسيمة من النموذج أعلاه.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-400 text-xs">
                <tr>
                  <th className="p-3 text-right font-bold">الرمز</th>
                  <th className="p-3 text-right font-bold">المبلغ</th>
                  <th className="p-3 text-right font-bold">الاستخدام</th>
                  <th className="p-3 text-right font-bold">الانتهاء</th>
                  <th className="p-3 text-right font-bold">الحالة</th>
                  <th className="p-3 text-right font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.code} className="border-t border-gray-800 hover:bg-gray-900/40 transition">
                    <td className="p-3 font-mono text-blue-300" dir="ltr">{v.code}</td>
                    <td className="p-3 font-bold" dir="ltr">{Number(v.amount)} د.ج</td>
                    <td className="p-3 text-gray-400" dir="ltr">{v.usedCount} / {v.maxUses}</td>
                    <td className="p-3 text-gray-400" dir="ltr">{v.expiresAt ? new Date(v.expiresAt).toLocaleDateString("ar-DZ") : "بلا انتهاء"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black ${v.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {v.isActive ? "نشطة" : "معطّلة"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyCode(v.code)}
                          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                          title="نسخ الرمز"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => handleToggle(v.code, v.isActive)}
                          className={`p-2 rounded-lg transition ${v.isActive ? "bg-red-500/10 hover:bg-red-500/20 text-red-400" : "bg-green-500/10 hover:bg-green-500/20 text-green-400"}`}
                          title={v.isActive ? "تعطيل" : "تفعيل"}
                        >
                          <Power size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

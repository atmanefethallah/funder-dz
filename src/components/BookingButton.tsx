"use client";

import { useState } from "react";
import { Ticket, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function BookingButton({
  placeId,
  price,
  isLoggedIn = true,
}: {
  placeId: string;
  price: number;
  isLoggedIn?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { success, error, warning, confirm } = useToast();

  const handleBooking = async () => {
    // 🌟 التحقق من الزائر
    if (!isLoggedIn) {
      warning("تسجيل الدخول مطلوب", "يرجى تسجيل الدخول أولاً لإتمام الحجز 🎫");
      window.location.href = "/login";
      return;
    }

    // 🌟 حساب العربون (10%) والمبلغ المتبقي
    const deposit = Math.round(price * 0.1 * 100) / 100;
    const remaining = Math.round((price - deposit) * 100) / 100;

    // 🌟 نافذة تأكيد أنيقة بدل confirm() الأصلية
    const isConfirmed = await confirm({
      title: price > 0 ? "تأكيد الحجز بالعربون" : "تأكيد الحجز المجاني",
      message:
        price > 0
          ? `سعر التذكرة ${price} د.ج. ستدفع الآن عربوناً (10%) بقيمة ${deposit} د.ج من محفظتك، ويتبقى ${remaining} د.ج تُدفع نقداً عند الوصول.`
          : "هذه التذكرة مجانية. هل تريد تأكيد حجزك؟",
      confirmText: price > 0 ? `ادفع ${deposit} د.ج` : "تأكيد الحجز",
      cancelText: "تراجع",
    });
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId }),
      });

      const data = await res.json();

      if (res.ok) {
        success("تم الحجز بنجاح! 🎉", data.message);
        router.refresh();
      } else if (res.status === 402) {
        // بوابة الباقة / رصيد غير كافٍ
        warning("رصيد غير كافٍ", data.message);
      } else {
        error("تعذر إتمام الحجز", data.message);
      }
    } catch (err) {
      error("خطأ في الاتصال", "حدث خطأ أثناء الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBooking}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-70"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
      {loading ? "جاري الحجز..." : "حجز بعربون (10%)"}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Check, X, Ticket, BedDouble, LayoutDashboard } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error: toastError } = useToast();

  // جلب الطلبات من الـ API
  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/partner/bookings");
      if (res.ok) {
        setBookings(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchBookings(); 
  }, []);

  // دالة القبول أو الرفض
  const handleAction = async (bookingId: string, action: "CONFIRMED" | "REJECTED") => {
    try {
      const res = await fetch("/api/partner/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action })
      });
      const data = await res.json();
      if (res.ok) {
        success(action === "CONFIRMED" ? "تم تأكيد الحجز ✅" : "تم رفض الحجز", data.message);
        fetchBookings(); // تحديث القائمة فوراً بعد الإجراء
      } else {
        toastError("فشل الإجراء", data.message);
      }
    } catch (error) {
      toastError("خطأ في الاتصال", "تعذر الاتصال بالخادم.");
    }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Ticket size={28} className="text-blue-600" /> إدارة طلبات الحجوزات 
        </h1>
        <Link href="/partner-dashboard" className="flex items-center gap-2 bg-gray-900 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-800 transition">
          <LayoutDashboard size={16} /> لوحة تحكمي الكاملة
        </Link>
      </div>
      
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        {bookings.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <Ticket size={48} className="mx-auto mb-4 opacity-30" />
            <p>لا توجد طلبات حجوزات معلقة حالياً.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {bookings.map((b) => (
              <div key={b.id} className="flex flex-col md:flex-row items-center justify-between border border-gray-100 bg-gray-50 p-4 rounded-xl">
                <div className="mb-4 md:mb-0">
                  <h4 className="font-bold text-gray-800 text-lg">{b.place.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">السائح: <span className="font-medium">{b.user.name}</span> ({b.user.email})</p>
                  <p className="text-sm text-blue-600 font-bold mt-2">العربون المدفوع: {b.amount} د.ج</p>
                  {b.roomType && (
                    <p className="text-xs text-cyan-700 font-bold mt-1 flex items-center gap-1"><BedDouble size={13} /> نوع الغرفة: {b.roomType}</p>
                  )}
                  <p className="text-xs text-gray-500">تاريخ الطلب: {new Date(b.createdAt).toLocaleDateString("ar-DZ")}</p>
                </div>
                
                {b.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAction(b.id, "CONFIRMED")} 
                      className="flex items-center gap-1 bg-green-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition hover:bg-green-700"
                    >
                      <Check size={18}/> قبول وتأكيد
                    </button>
                    <button 
                      onClick={() => handleAction(b.id, "REJECTED")} 
                      className="flex items-center gap-1 bg-red-100 text-red-600 font-bold px-4 py-2 rounded-lg text-sm transition hover:bg-red-200"
                    >
                      <X size={18}/> رفض
                    </button>
                  </div>
                ) : (
                  <span className={`text-sm font-bold px-4 py-2 rounded-lg ${b.status === "CONFIRMED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {b.status === "CONFIRMED" ? "✅ تم قبول الحجز" : "❌ مرفوض"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

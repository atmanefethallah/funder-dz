"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Loader2, CheckCircle, XCircle, ExternalLink, Users, Map as MapIcon, Ticket, Activity, Megaphone, Send, UserCheck } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function AdminDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, places: 0, bookings: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const { success, error: toastError, confirm: confirmDialog } = useToast();

  const fetchData = async () => {
    try {
      const reqRes = await fetch("/api/admin/requests");
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData);
      }

      const statsRes = await fetch("/api/admin/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (requestId: string, action: "APPROVE" | "REJECT") => {
    const okAction = await confirmDialog({
      title: action === "APPROVE" ? "تأكيد قبول الطلب" : "تأكيد رفض الطلب",
      message: action === "APPROVE" ? "سيتم شحن رصيد المستخدم بهذا المبلغ فوراً." : "سيتم رفض طلب الشحن هذا.",
      confirmText: action === "APPROVE" ? "قبول وشحن" : "رفض الطلب",
      danger: action === "REJECT",
    });
    if (!okAction) return;
    
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/admin/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      
      if (res.ok) {
        setRequests(requests.filter(req => req.id !== requestId));
      } else {
        toastError("فشل المعالجة", "حدث خطأ أثناء معالجة الطلب.");
      }
    } catch (error) {
      toastError("خطأ في الاتصال", "تعذر الاتصال بالخادم.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    
    const okSend = await confirmDialog({
      title: "إرسال إشعار جماعي",
      message: "سيصل هذا الإشعار إلى جميع السياح. هل أنت متأكد؟",
      confirmText: "إرسال للجميع",
    });
    if (!okSend) return;

    setNotificationLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: (form.elements.namedItem("title") as HTMLInputElement).value,
          message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
          link: (form.elements.namedItem("link") as HTMLInputElement).value,
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        success("تم الإرسال 🎉", data.message);
        form.reset();
      } else {
        toastError("فشل الإرسال", data.message);
      }
    } catch (error) {
      toastError("خطأ في الاتصال", "تعذر الاتصال بالخادم.");
    } finally {
      setNotificationLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-[70vh] flex-col gap-4 items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /><p className="font-bold text-gray-500">جاري تحميل بيانات المنصة...</p></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      
      {/* الترويسة العلوية */}
      <div className="mb-8 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3 text-red-600">
          <ShieldCheck size={36} />
          <div>
            <h1 className="text-3xl font-black text-gray-900">لوحة الإدارة المركزية</h1>
            <p className="text-sm font-bold text-gray-500 mt-1">غرفة العمليات الخاصة بالمنصة</p>
          </div>
        </div>
        <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-sm font-black border border-red-200 shadow-sm flex items-center gap-2">
          <Activity size={16} className="animate-pulse" /> STATUS: ONLINE
        </span>
      </div>

      {/* 🔗 روابط سريعة للأقسام الفرعية للإدارة */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Link href="/admin/vouchers" className="flex items-center gap-2 bg-white border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition rounded-xl px-4 py-2.5 font-bold text-sm text-gray-700">
          <Ticket size={18} className="text-blue-600" /> إدارة قسائم فندر
        </Link>
        <Link href="/admin/partner-requests" className="flex items-center gap-2 bg-white border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition rounded-xl px-4 py-2.5 font-bold text-sm text-gray-700">
          <UserCheck size={18} className="text-emerald-600" /> طلبات اعتماد الشركاء
        </Link>
      </div>

      {/* 📊 القسم الأول: إحصائيات المنصة */}
      <h2 className="mb-4 text-xl font-bold text-gray-800">نظرة عامة على الأداء</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-2xl p-6 border shadow-sm flex flex-col justify-center items-center text-center transition hover:-translate-y-1">
          <div className="bg-blue-50 p-4 rounded-full text-blue-600 mb-4"><Users size={32} /></div>
          <p className="text-sm text-gray-500 font-bold mb-1">إجمالي المستخدمين</p>
          <p className="text-3xl font-black text-gray-800">{stats.users}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border shadow-sm flex flex-col justify-center items-center text-center transition hover:-translate-y-1">
          <div className="bg-amber-50 p-4 rounded-full text-amber-600 mb-4"><MapIcon size={32} /></div>
          <p className="text-sm text-gray-500 font-bold mb-1">المعالم المسجلة</p>
          <p className="text-3xl font-black text-gray-800">{stats.places}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border shadow-sm flex flex-col justify-center items-center text-center transition hover:-translate-y-1">
          <div className="bg-purple-50 p-4 rounded-full text-purple-600 mb-4"><Ticket size={32} /></div>
          <p className="text-sm text-gray-500 font-bold mb-1">الحجوزات الناجحة</p>
          <p className="text-3xl font-black text-gray-800">{stats.bookings}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-2xl p-6 border border-green-600 shadow-lg flex flex-col justify-center items-center text-center transition hover:-translate-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 blur-2xl rounded-full"></div>
          <p className="text-sm text-green-100 font-bold mb-2">إجمالي حركة الأموال</p>
          <p className="text-3xl font-black" dir="ltr">{stats.revenue} د.ج</p>
        </div>
      </div>

      {/* 💸 القسم الثاني: طلبات الشحن المعلقة */}
      <h2 className="mb-4 text-xl font-bold text-gray-800 flex items-center gap-2">
        طلبات شحن الرصيد 
        <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-sm">{requests.length}</span>
      </h2>
      
      <div className="rounded-2xl border bg-white p-6 shadow-sm mb-12">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-gray-400">
            <ShieldCheck size={48} className="mb-4 opacity-50 text-green-500" />
            <p className="text-lg font-bold text-gray-600">لا توجد طلبات شحن معلقة حالياً.</p>
            <p className="text-sm mt-2 text-gray-400">لقد قمت بمعالجة كافة الطلبات بنجاح ✨</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => (
              <div key={req.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 shadow-sm transition hover:shadow-md bg-white">
                
                {/* صورة الوصل */}
                <div className="relative h-48 bg-gray-100 group">
                  <img src={req.receiptUrl} alt="وصل دفع" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <a href={req.receiptUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-900 hover:scale-105 transition">
                      <ExternalLink size={16} /> عرض الوصل كامل
                    </a>
                  </div>
                </div>

                {/* تفاصيل الطلب */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="mb-4 border-b border-gray-100 pb-3">
                    <p className="text-xs text-gray-500 mb-1">بيانات المستخدم:</p>
                    <p className="font-bold text-gray-800 truncate">{req.user.name}</p>
                    <p className="text-sm text-gray-500 truncate">{req.user.email}</p>
                  </div>

                  {/* عرض رقم العملية */}
                  <div className="mb-3 bg-gray-50 rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">رقم العملية (Transaction ID)</p>
                      <p className="font-mono text-sm font-bold text-gray-700 mt-0.5">{req.transactionId || "غير متوفر"}</p>
                    </div>
                    {req.transactionId && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(req.transactionId);
                          success("تم النسخ 📋", "تم نسخ رقم العملية بنجاح.");
                        }}
                        className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md transition border border-blue-100"
                      >
                        نسخ
                      </button>
                    )}
                  </div>
                  
                  <div className="mb-6 bg-blue-50/50 rounded-lg p-4 text-center border border-blue-100 mt-auto">
                    <p className="text-xs text-blue-600 font-bold mb-1">المبلغ المطلوب شحنه</p>
                    <p className="text-2xl font-black text-blue-700" dir="ltr">{req.amount} د.ج</p>
                  </div>

                  {/* أزرار القرار */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAction(req.id, "APPROVE")}
                      disabled={actionLoading === req.id}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} قبول 
                    </button>
                    
                    <button 
                      onClick={() => handleAction(req.id, "REJECT")}
                      disabled={actionLoading === req.id}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} رفض
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📢 القسم الثالث: إرسال إشعارات للسياح */}
      <h2 className="mb-4 text-xl font-bold text-gray-800 flex items-center gap-2">
        <Megaphone className="text-blue-600" /> بث إشعار عام للسياح
      </h2>
      <div className="rounded-2xl border bg-white p-6 shadow-sm md:w-2/3 lg:w-1/2">
        <form onSubmit={handleSendNotification} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">عنوان الإشعار</label>
            <input name="title" required placeholder="مثال: تخفيض 50% على تذاكر الغابة!" className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">محتوى الرسالة</label>
            <textarea name="message" required placeholder="اكتب تفاصيل الإعلان هنا..." className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition min-h-[120px] resize-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">رابط التوجيه (اختياري)</label>
            <input name="link" placeholder="مثال: /explore" className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-left" dir="ltr" />
            <p className="text-xs text-gray-500 mt-1">عندما يضغط السائح على الإشعار سينتقل لهذا الرابط.</p>
          </div>

          <button 
            type="submit" 
            disabled={notificationLoading}
            className="flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-3 mt-2 rounded-xl hover:bg-gray-800 transition disabled:opacity-70"
          >
            {notificationLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            {notificationLoading ? "جاري الإرسال للجميع..." : "بث الإشعار الآن 🚀"}
          </button>
        </form>
      </div>

    </div>
  );
}

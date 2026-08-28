"use client";

import { useEffect, useState } from "react";
import { UserCheck, CheckCircle2, XCircle, Loader2, FileText, Eye, ExternalLink, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function PartnerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالات عارض المستندات المنبثق (Modal)
  const [activeDocUrl, setActiveDocUrl] = useState<string | null>(null);
  const [activeDocTitle, setActiveDocTitle] = useState<string>("");
  const { success, error: toastError, confirm: confirmDialog } = useToast();

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/partner-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (userId: string, action: "APPROVE" | "REJECT") => {
    const okAction = await confirmDialog({
      title: action === "APPROVE" ? "اعتماد الشريك" : "رفض الوثائق",
      message: action === "APPROVE"
        ? "هل راجعت الوثائق وتريد منح صلاحيات الشريك لهذا الحساب؟"
        : "سيتم رفض الوثائق وإلزام الحساب برفع مستندات جديدة صالحة.",
      confirmText: action === "APPROVE" ? "اعتماد" : "رفض",
      danger: action === "REJECT",
    });
    if (!okAction) return;

    try {
      const res = await fetch("/api/admin/partner-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action })
      });
      const data = await res.json();

      if (res.ok) {
        success("تمت المعالجة", data.message);
        // تحديث الفلتر فوراً بإزالة الحساب المعالَج من الشاشة
        setRequests(requests.filter(req => req.id !== userId));
      } else {
        toastError("فشل الإجراء", data.message);
      }
    } catch (error) {
      toastError("خطأ", "حدث خطأ أثناء معالجة الطلب المالي والقانوني.");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-950 text-white"><Loader2 className="animate-spin text-red-500" size={40} /></div>;

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 py-10 px-4 pb-24 relative" dir="rtl">
      <div className="max-w-5xl mx-auto">
        
        {/* الترويسة السيادية */}
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-8">
          <UserCheck className="text-red-500" size={32} />
          <h1 className="text-2xl font-black">طلبات التفعيل واعتماد الشركاء التجارية</h1>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-bold border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
            لا توجد طلبات تفعيل معلقة حالياً. جميع منشآت الشركاء مراجعة ومحدثة! ✨
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((req) => (
              <div key={req.id} className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-md relative overflow-hidden group hover:border-gray-700 transition">
                <div>
                  
                  {/* بيانات مقدم الطلب */}
                  <div className="border-b border-gray-800/50 pb-3 mb-4">
                    <span className="text-[10px] font-mono text-gray-500 block mb-1">ID: #{req.id.slice(-6).toUpperCase()}</span>
                    <h3 className="font-black text-white text-xl leading-tight">{req.name}</h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">{req.email}</p>
                    {req.phone && <p className="text-xs text-gray-500 font-mono mt-0.5">📞 {req.phone}</p>}
                  </div>

                  {/* 📂 قسم استعراض الوثائق المرفوعة */}
                  <div className="space-y-2 mb-6">
                    <h4 className="text-xs font-black text-gray-500 tracking-wider mb-2 uppercase">المستندات المرفقة للتحقق الجنائي والتجاري:</h4>
                    
                    {/* وثيقة السجل التجاري */}
                    <div className="flex items-center justify-between p-3 bg-gray-950/60 rounded-xl border border-gray-800 text-sm">
                      <span className="flex items-center gap-2 font-bold text-gray-300">
                        <FileText size={16} className="text-blue-400" /> نسخة السجل التجاري
                      </span>
                      <button 
                        onClick={() => { setActiveDocUrl(req.commercialRegistry); setActiveDocTitle("نسخة السجل التجاري للمنشأة"); }}
                        className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                      >
                        <Eye size={12} /> فحص الوثيقة
                      </button>
                    </div>

                    {/* وثيقة بطاقة التعريف الوطنية */}
                    <div className="flex items-center justify-between p-3 bg-gray-950/60 rounded-xl border border-gray-800 text-sm">
                      <span className="flex items-center gap-2 font-bold text-gray-300">
                        <FileText size={16} className="text-emerald-400" /> بطاقة التعريف الوطنية
                      </span>
                      <button 
                        onClick={() => { setActiveDocUrl(req.idCard); setActiveDocTitle("بطاقة التعريف الوطنية للشريك"); }}
                        className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                      >
                        <Eye size={12} /> فحص الوثيقة
                      </button>
                    </div>
                  </div>

                </div>

                {/* أزرار اتخاذ القرار الفوري الحاسم */}
                <div className="flex gap-3 border-t border-gray-800/60 pt-4 mt-auto">
                  <button 
                    onClick={() => handleAction(req.id, "APPROVE")} 
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20"
                  >
                    <CheckCircle2 size={16} /> تفعيل الحساب وقبول الشراكة
                  </button>
                  <button 
                    onClick={() => handleAction(req.id, "REJECT")} 
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-black py-3 px-4 rounded-xl text-xs transition flex items-center justify-center"
                  >
                    <XCircle size={16} /> رفض المستندات
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* 🌟 نافذة العرض المنبثقة الذكية للوثائق (Document Viewer Modal) 🌟 */}
        {activeDocUrl && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl h-[85vh] rounded-3xl bg-gray-900 border border-gray-800 p-4 flex flex-col justify-between shadow-2xl relative animate-in fade-in zoom-in-95">
              
              {/* ترويسة نافذة الفحص */}
              <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">{activeDocTitle}</h2>
                  <a href={activeDocUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition" title="فتح في تبويب مستقل">
                    <ExternalLink size={16} />
                  </a>
                </div>
                <button 
                  onClick={() => { setActiveDocUrl(null); }} 
                  className="p-1.5 bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* جسم النافذة: التحقق التلقائي من نوع الملف لتعويمه (صورة أم PDF) */}
              <div className="flex-1 bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 relative p-2 flex items-center justify-center">
                {activeDocUrl.toLowerCase().endsWith(".pdf") ? (
                  <iframe src={activeDocUrl} className="w-full h-full rounded-xl" title="PDF Document Viewer" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeDocUrl} alt="Document Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
                )}
              </div>

              {/* تذييل زر الإغلاق السريع */}
              <button 
                onClick={() => { setActiveDocUrl(null); }} 
                className="mt-3 w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-xl transition text-xs"
              >
                إغلاق عارض المستندات
              </button>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}

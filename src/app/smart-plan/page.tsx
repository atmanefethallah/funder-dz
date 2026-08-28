"use client";

import { useState } from "react";
import { Sparkles, DollarSign, Utensils, Compass, Coffee, MapPin, Navigation, Loader2, AlertTriangle } from "lucide-react";

export default function SmartPlanPage() {
  const [budget, setBudget] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>(""); // 🌟 لحفظ وعرض الأخطاء المخفية

  const handleGeneratePlan = async () => {
    setLoading(true);
    setErrorMessage(""); // تصفية الأخطاء السابقة
    setPlan(null);

    console.log("🚀 جاري إرسال طلب توليد الخطة بفئة ميزانية:", budget);

    try {
      const res = await fetch("/api/smart-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget })
      });

      // التحقق مما إذا كان السيرفر يعيد صفحة خطأ غير متوقعة (مثل 404 أو 500)
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ السيرفر لم يرسل ملف JSON! أرسل شيئاً آخر.");
        setErrorMessage(`خطأ في استجابة الخادم (Status: ${res.status}). تأكد من أن ملف السيرفر موجود في المسار الصحيح: src/app/api/smart-plan/route.ts`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log("📥 البيانات القادمة من السيرفر بنجاح:", data);

      if (res.ok) {
        setPlan(data);
      } else {
        // إذا أعاد السيرفر خطأ معروف (مثل عدم تسجيل الدخول أو قاعدة بيانات فارغة)
        setErrorMessage(data.message || "حدث خطأ غير معروف في السيرفر.");
      }
    } catch (error: any) {
      console.error("💥 خطأ في الاتصال بالشبكة أو المتصفح:", error);
      setErrorMessage("فشل الاتصال بالخادم المحلي. تأكد من أن سيرفر npm run dev يعمل دون مشاكل.");
    } finally {
      setLoading(false);
    }
  };

  const timelineSteps = plan ? [
    { time: "09:00 صباحاً", title: "وجبة الإفطار 🥞", place: plan.breakfast, icon: <Utensils className="text-emerald-500" />, color: "border-emerald-500" },
    { time: "10:30 صباحاً", title: "النشاط الصباحي الرئيسي 🏛️", place: plan.morningActivity, icon: <Compass className="text-blue-500" />, color: "border-blue-500" },
    { time: "01:30 مساءً", title: "وجبة الغداء 🍲 (بالقرب من نشاطك الصباحي)", place: plan.lunch, icon: <Utensils className="text-orange-500" />, color: "border-orange-500" },
    { time: "04:00 مساءً", title: "الوجهة الترفيهية المسائية 🎡", place: plan.afternoonActivity, icon: <Compass className="text-purple-500" />, color: "border-purple-500" },
    { time: "06:30 مساءً", title: "وقت القهوة والاسترخاء ☕ (بالقرب من الوجهة الترفيهية)", place: plan.coffeeTime, icon: <Coffee className="text-amber-600" />, color: "border-amber-600" },
    { time: "08:30 مساءً", title: "وجبة العشاء والختام 🌙", place: plan.dinner, icon: <Utensils className="text-rose-500" />, color: "border-rose-500" },
  ] : [];

  return (
    <main className="min-h-screen bg-gray-50/50 py-12 px-4 pb-24" dir="rtl">
      <div className="max-w-4xl mx-auto">
        
        {/* العناوين والصدارة */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs mb-4 shadow-sm">
            <Sparkles size={14} className="animate-spin text-amber-500" /> خوارزمية التخطيط الجغرافي الذكي الفاخرة
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">الخطة الذكية لمنصتك الذكية ✨</h1>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">حدد ميزانيتك، ودع نظام Funder ينسق لك يومك بالكامل؛ يربط وجهاتك الترفيهية بأقرب المطاعم والمقاهي جغرافياً منعاً لتضييع الوقت!</p>
        </div>

        {/* ⚙️ صندوق إعدادات الميزانية */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-10">
          <h2 className="text-sm font-black text-gray-400 mb-4 tracking-wider">1. اختر فئة الميزانية المناسبة لرحلتك اليوم:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <button onClick={() => setBudget("LOW")} className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between h-28 ${budget === "LOW" ? "border-green-500 bg-green-50/30" : "border-gray-100 bg-gray-50/50 hover:bg-gray-50"}`}>
              <div className="w-8 h-8 rounded-xl bg-green-100 text-green-600 flex items-center justify-center font-bold"><DollarSign size={16} /></div>
              <div><h3 className="font-bold text-gray-800 text-sm">ميزانية منخفضة</h3><p className="text-[11px] text-gray-400 mt-0.5">معالم مجانية ووجبات اقتصادية شهية</p></div>
            </button>

            <button onClick={() => setBudget("MEDIUM")} className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between h-28 ${budget === "MEDIUM" ? "border-blue-500 bg-blue-50/30" : "border-gray-100 bg-gray-50/50 hover:bg-gray-50"}`}>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold"><DollarSign size={16} /><DollarSign size={16} /></div>
              <div><h3 className="font-bold text-gray-800 text-sm">ميزانية متوسطة</h3><p className="text-[11px] text-gray-400 mt-0.5">الخيار المتوازن والأكثر شعبية للعائلات</p></div>
            </button>

            <button onClick={() => setBudget("HIGH")} className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between h-28 ${budget === "HIGH" ? "border-purple-500 bg-purple-50/30" : "border-gray-100 bg-gray-50/50 hover:bg-gray-50"}`}>
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold"><DollarSign size={16} /><DollarSign size={16} /><DollarSign size={16} /></div>
              <div><h3 className="font-bold text-gray-800 text-sm">ميزانية عالية</h3><p className="text-[11px] text-gray-400 mt-0.5">رحلة فاخرة، فنادق متميزة ومطاعم راقية</p></div>
            </button>

          </div>

          <button onClick={handleGeneratePlan} disabled={loading} className="w-full mt-6 bg-gray-900 text-white p-4 rounded-xl font-black hover:bg-gray-800 transition shadow-md flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={18} className="text-yellow-400 fill-yellow-400" /> توليد جدول الرحلة الذكي فوراً</>}
          </button>
        </div>

        {/* 🚨 لوحة عرض الأخطاء المضافة حديثاً للكشف الجذري 🚨 */}
        {errorMessage && (
          <div className="mb-10 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 shadow-sm flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div className="text-right">
              <h3 className="font-black text-sm mb-1">تنبيه من خوارزمية Funder:</h3>
              <p className="text-xs font-bold leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 📜 عرض الجدول الزمني المطور */}
        {plan && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-md relative overflow-hidden animate-fade-in">
            <h2 className="text-xl font-black text-gray-900 mb-8 border-b pb-4 flex items-center gap-2">🗺️ مسارك المتناسق لليوم الحافل:</h2>
            
            <div className="relative border-r-2 border-dashed border-gray-200 mr-4 space-y-8 pb-4">
              {timelineSteps.map((step, index) => (
                <div key={index} className="relative pr-8">
                  
                  <div className={`absolute -right-[17px] top-0 w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center shadow-sm ${step.color}`}>
                    {step.icon}
                  </div>

                  <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:bg-gray-50">
                    <div className="text-right">
                      <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{step.time}</span>
                      <h3 className="font-bold text-gray-500 text-xs mt-1.5">{step.title}</h3>
                      <h4 className="text-base font-black text-gray-900 mt-1">{step.place?.name || "معلم سياحي معتمد"}</h4>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><MapPin size={12} /> التصنيف: {step.place?.category || "سياحة"}</p>
                    </div>

                    {step.place?.latitude && (
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${step.place.latitude},${step.place.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 px-3 py-2 rounded-xl transition shadow-sm whitespace-nowrap"
                      >
                        <Navigation size={12} className="fill-white" /> توجيه الخريطة
                      </a>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

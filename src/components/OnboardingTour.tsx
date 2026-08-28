"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowLeft, Check, Loader2 } from "lucide-react";

export default function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. التحقق من الذاكرة: هل أتم المستخدم الجولة سابقاً؟
    const hasSeenTour = localStorage.getItem("funder_global_tour_v1");
    
    if (!hasSeenTour) {
      // 2. إذا لم يرها، نجلب دوره من قاعدة البيانات لنوجهه بشكل صحيح
      const fetchRole = async () => {
        try {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const data = await res.json();
            setUserRole(data.role || "TOURIST"); // افتراضياً سائح
            setIsVisible(true);
          }
        } catch (error) {
          console.error("Failed to fetch role for onboarding");
        } finally {
          setLoading(false);
        }
      };
      fetchRole();
    } else {
      setLoading(false);
    }
  }, []);

  // 🎒 خطوات التوجيه الخاصة بالسائح (TOURIST)
  const touristSteps = [
    {
      title: "أهلاً بك في Funder! 🌍",
      description: "منصتك الأولى لاستكشاف أجمل المعالم السياحية، الغابات، والفعاليات في الجزائر. دعنا نريك كيف تعمل المنصة في ثوانٍ."
    },
    {
      title: "حجز ذكي ومريح 💳",
      description: "لا داعي لدفع المبلغ كاملاً! يمكنك حجز مكانك بدفع عربون رمزي (10%) فقط من محفظتك الإلكترونية في المنصة."
    },
    {
      title: "تذكرتك في هاتفك 📱",
      description: "بعد الحجز، ستحصل على تذكرة إلكترونية (QR Code). أظهرها عند بوابة المعلم السياحي، وادفع باقي المبلغ نقداً بكل سهولة!"
    }
  ];

  // 👔 خطوات التوجيه الخاصة بالشريك (PARTNER)
  const partnerSteps = [
    {
      title: "أهلاً بك كشريك معتمد! 🤝",
      description: "حسابك موثق قانونياً الآن. دعنا نأخذك في جولة خاطفة للتعرف على أدوات إدارة منشأتك السياحية."
    },
    {
      title: "إضافة معالمك الجغرافية 🗺️",
      description: "من الشريط السفلي، اضغط على 'إضافة معلم' لرفع صور منشأتك، تحديد السعر، وإسقاط دبوس موقعك على الخريطة."
    },
    {
      title: "مسح التذاكر وتحصيل الأموال 📸",
      description: "عند وصول السائح، افتح 'الماسح' من هاتفك وامسح تذكرته (QR Code). سيخبرك النظام بصلاحية التذكرة والمبلغ المتبقي لتحصيله نقداً."
    }
  ];

  // تحديد الخطوات بناءً على الدور
  const steps = userRole === "PARTNER" ? partnerSteps : touristSteps;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // حفظ الإكتمال في المتصفح لكي لا تظهر مرة أخرى
      localStorage.setItem("funder_global_tour_v1", "true");
      setIsVisible(false);
    }
  };

  if (loading || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-6 text-right text-white shadow-2xl relative animate-in slide-in-from-bottom-5" dir="rtl">
        
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${userRole === "PARTNER" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
          <Sparkles size={20} className="animate-pulse" />
        </div>

        <div className="absolute top-6 left-6 text-[10px] font-mono text-gray-500 font-bold bg-gray-800 px-2 py-1 rounded-md">
          {currentStep + 1} / {steps.length}
        </div>

        <h3 className="text-lg font-black text-white mb-2 leading-tight">{steps[currentStep].title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed font-medium mb-8 min-h-[60px]">{steps[currentStep].description}</p>

        <button 
          onClick={handleNext} 
          className={`w-full text-white font-black py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md ${userRole === "PARTNER" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-950/40" : "bg-amber-500 hover:bg-amber-600 shadow-amber-950/40 text-amber-950"}`}
        >
          {currentStep === steps.length - 1 ? (
            <>
              <Check size={16} /> يلا، نبدأ التجربة!
            </>
          ) : (
            <>
              التالي <ArrowLeft size={16} />
            </>
          )}
        </button>

      </div>
    </div>
  );
}

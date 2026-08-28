"use client";

import { useEffect, useRef, useState } from "react";
import { Move, Loader2 } from "lucide-react";

export default function VRViewer({ imageUrl, title }: { imageUrl: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 1. تحميل ملفات التنسيق (CSS) الخاصة بالمشغل ثلاثي الأبعاد
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
    document.head.appendChild(link);

    // 2. تحميل مكتبة الجافاسكريبت للمشغل
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
    script.async = true;
    script.onload = () => {
      if ((window as any).pannellum && containerRef.current) {
        // تشغيل البانوراما 360 درجة برمجياً
        (window as any).pannellum.viewer(containerRef.current, {
          type: "equirectangular",
          panorama: imageUrl,
          autoLoad: true,
          title: title,
          author: "منصة Funder السياحية",
          compass: true
        });
        setLoaded(true);
      }
    };
    document.body.appendChild(script);

    // تنظيف المستند عند الخروج من الصفحة
    return () => {
      link.remove();
      script.remove();
    };
  }, [imageUrl, title]);

  return (
    <div className="relative w-full h-[65vh] md:h-[75vh] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gray-950">
      
      {/* شاشة التحميل الذكية */}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-900 z-10 gap-3">
          <Loader2 className="animate-spin text-blue-500" size={40} />
          <p className="font-bold text-lg animate-pulse">🕶️ جاري تجهيز الجولة الافتراضية 360°...</p>
        </div>
      )}

      {/* الحاوية الفعلية للمشغل */}
      <div ref={containerRef} className="w-full h-full"></div>

      {/* إرشاد تفاعلي للمستخدم */}
      {loaded && (
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 pointer-events-none z-10">
          <Move size={16} className="animate-bounce" />
          <span>حرك الشاشة في كل الاتجاهات للاستكشاف</span>
        </div>
      )}
    </div>
  );
}

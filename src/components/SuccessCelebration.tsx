"use client";

import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

interface SuccessCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
}

export default function SuccessCelebration({ isOpen, onClose, title, subtitle }: SuccessCelebrationProps) {
  
  // إغلاق تلقائي بعد 4 ثوانٍ إذا لم يغلقها المستخدم
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => onClose(), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-gray-100 p-6 text-center shadow-2xl transition-all scale-in" dir="rtl">
        
        {/* زر الإغلاق السريع */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
          <X size={18} />
        </button>

        {/* أيقونة النجاح مع وهج سينمائي خلفي */}
        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500 border border-green-100">
          <div className="absolute inset-0 bg-green-400/10 rounded-full blur-md animate-pulse"></div>
          <CheckCircle2 size={44} className="relative z-10 animate-bounce" style={{ animationIterationCount: 1, animationDuration: '0.8s' }} />
        </div>

        {/* النصوص التوضيحية */}
        <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed font-medium px-2">{subtitle}</p>

        {/* خط تزييني سفلي نابض بالنجاح */}
        <div className="mt-6 h-1 w-full bg-gradient-to-r from-transparent via-green-500 to-transparent rounded-full opacity-40"></div>
      </div>
    </div>
  );
}

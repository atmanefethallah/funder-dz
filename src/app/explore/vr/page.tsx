import Link from "next/link";
import { ArrowRight, Glasses } from "lucide-react";

export default function VRPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4" dir="rtl">
      
      {/* أيقونة النظارات النابضة */}
      <div className="bg-purple-500/20 p-6 rounded-full mb-6 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.3)]">
        <Glasses size={64} className="text-purple-400 animate-pulse" />
      </div>

      <h1 className="text-3xl md:text-4xl font-black mb-4">جولات الواقع الافتراضي 360°</h1>
      
      <p className="text-gray-400 mb-10 text-center max-w-md leading-relaxed text-lg">
        نعمل حالياً على تجهيز هذه الميزة! قريباً ستتمكن من التجول داخل القلاع والمتاحف الغابات وكأنك هناك تماماً. 🚀
      </p>

      <Link 
        href="/explore" 
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-blue-900/50"
      >
        <ArrowRight size={20} /> العودة لصفحة الاستكشاف
      </Link>
      
    </main>
  );
}

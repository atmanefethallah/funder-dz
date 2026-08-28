import { queryOne } from "@/lib/db";
import { notFound } from "next/navigation";
import VRViewer from "@/components/VRViewer";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

type PlaceRow = {
  id: string;
  name: string;
  description: string | null;
  virtualTourUrl: string | null;
};

export default async function VRTourPage({ params }: { params: { id: string } }) {
  // جلب المعلم من قاعدة البيانات
  const place = await queryOne<PlaceRow>(`SELECT * FROM "Place" WHERE "id" = $1`, [params.id]);

  if (!place) return notFound();

  // 🌟 رابط صورة 360 تجريبية عالمية فائقة الدقة في حال لم يرفع الشريك صورة مخصصة بعد
  const default360Image = "https://pannellum.org/images/alma.jpg";
  const final360Url = place.virtualTourUrl || default360Image;

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 flex flex-col justify-between">
      <div className="mx-auto max-w-5xl w-full">
        
        {/* شريط علوي أنيق للعودة */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/explore" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition">
            <ArrowRight size={18} /> العودة للمعالم
          </Link>
          <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-4 py-1.5 rounded-full border border-yellow-400/20 text-xs font-bold">
            <Compass size={14} className="animate-spin" style={{ animationDuration: '6s' }} /> وضع التجول الगامر
          </div>
        </div>

        {/* ترويسة المعلم */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">{place.name}</h1>
          <p className="text-gray-400 text-sm max-w-2xl">{place.description}</p>
        </div>

        {/* عرض مشगل الـ 360 درجة الخارق */}
        <VRViewer imageUrl={final360Url} title={place.name} />

      </div>
      
      <div className="text-center text-xs text-gray-600 font-bold mt-8">
        منصة Funder © جميع الحقوق محفوظة لولاية مستगانم الرقمية
      </div>
    </div>
  );
}

import { queryOne } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import TicketQRCode from "@/components/Booking/TicketQRCode";
import { MapPin, Calendar, Users, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

type BookingRow = {
  id: string;
  userId: string;
  placeId: string;
  status: string;
  qrToken: string;
  tickets: number | null;
  place_name: string;
};

export default async function TicketPage({ params }: { params: { id: string } }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");
  const userId = sessionUser.id;

  // جلب بيانات الحجز مع تفاصيل المعلم
  const booking = await queryOne<BookingRow>(
    `SELECT b.*, p."name" AS place_name FROM "Booking" b JOIN "Place" p ON p."id" = b."placeId" WHERE b."id" = $1`,
    [params.id],
  );

  if (!booking || booking.userId !== userId) {
    notFound();
  }

  // 🛡️ رمز QR يُولّد محلياً من qrToken السري — لا خدمة خارجية ولا معرف حجز قابل للتخمين

  return (
    <main className="min-h-screen bg-gray-900 py-12 px-4 flex flex-col items-center selection:bg-blue-500/30" dir="rtl">
      
      <div className="w-full max-w-sm mb-6 flex justify-between items-center">
        <Link href="/explore" className="text-white/70 hover:text-white flex items-center gap-1 text-sm font-bold transition">
          <ArrowRight size={16} /> العودة للاستكشاف
        </Link>
        <h1 className="text-xl font-black text-white tracking-wider">Funder</h1>
      </div>

      {/* 🎫 جسم التذكرة الفاخرة */}
      <div className="w-full max-w-sm relative drop-shadow-2xl">
        
        {/* الجزء العلوي للتذكرة (البيانات) */}
        <div className="bg-white rounded-t-3xl p-6 relative overflow-hidden">
          
          {/* زخرفة الهوية */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-50"></div>

          <div className="flex justify-between items-start mb-6 relative z-10">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">VIP Ticket</span>
            <span className="text-gray-400 text-[10px] font-bold">رقم: #{booking.id.slice(-6).toUpperCase()}</span>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1 leading-tight">{booking.place_name}</h2>
          <p className="text-gray-500 text-xs font-bold mb-6 flex items-center gap-1">
            <MapPin size={12} className="text-blue-500" /> ولاية مستगانم - سياحة ذكية
          </p>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mb-1"><Users size={12} /> التذاكر</p>
              {/* 👈 التعديل هنا: تجاوز فحص النوع ووضع 1 كقيمة افتراضية */}
              <p className="text-base font-black text-gray-900">{(booking as any).tickets || 1} أشخاص</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mb-1"><Calendar size={12} /> الحالة</p>
              <p className={`text-sm font-black ${booking.status === 'USED' || booking.status === 'REJECTED' ? 'text-red-500' : 'text-green-600'}`}>
                {booking.status === 'USED' ? "مُستخدمة" : booking.status === 'REJECTED' ? "مرفوضة" : "صالحة للاستخدام"}
              </p>
            </div>
          </div>
        </div>

        {/* ✂️ فاصل التذكرة المقصوص (Perforated line) */}
        <div className="relative bg-white flex items-center h-8">
          <div className="absolute -left-4 w-8 h-8 bg-gray-900 rounded-full"></div>
          <div className="w-full border-t-2 border-dashed border-gray-200 mx-6"></div>
          <div className="absolute -right-4 w-8 h-8 bg-gray-900 rounded-full"></div>
        </div>

        {/* الجزء السفلي للتذكرة (QR Code) */}
        <div className="bg-white rounded-b-3xl p-8 flex flex-col items-center justify-center relative">
          <p className="text-xs text-gray-400 font-bold mb-4">قدم هذا الرمز عند نقطة الدخول</p>
          
          <div className="p-3 bg-white border-2 border-blue-100 rounded-2xl shadow-sm mb-4">
            <TicketQRCode value={booking.qrToken} size={160} dimmed={booking.status === 'USED' || booking.status === 'REJECTED'} />
          </div>

          <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
            <ShieldCheck size={14} /> تذكرة محمية بتقنية التشفير
          </div>
        </div>

      </div>

      <p className="text-white/40 text-[10px] font-bold mt-8">Powered by Funder Smart Tourism</p>
    </main>
  );
}

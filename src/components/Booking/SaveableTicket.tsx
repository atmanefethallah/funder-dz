"use client";

import { useRef, useState } from "react";
import { MapPin, Calendar, Users, ShieldCheck, Download, Loader2, Navigation, BedDouble } from "lucide-react";
import TicketQRCode from "./TicketQRCode";

type Props = {
  bookingId: string;
  placeName: string;
  status: string;
  ticketsCount: number;
  roomType?: string | null;
  qrToken: string;
  mapsHref: string | null;
};

/**
 * التذكرة القابلة للحفظ — تلتقط كل التذكرة (مع رمز الكيو أر كود) كصورة PNG حقيقية
 * يمكن حفظها/مشاركتها من الهاتف، بدل الاعتماد على الضفط المطول على عنصر canvas
 * الذي لا يعرض خيار "حفظ الصورة" في معظم متصفحات الهاتف.
 */
export default function SaveableTicket({
  bookingId,
  placeName,
  status,
  ticketsCount,
  roomType,
  qrToken,
  mapsHref,
}: Props) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const isDimmed = status === "USED" || status === "REJECTED";

  const handleSave = async () => {
    if (!ticketRef.current) return;
    setSaving(true);
    setSaveError("");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: "#111827",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `funder-ticket-${bookingId.slice(-6).toUpperCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error(err);
      setSaveError("تعذّر حفظ الصورة آلياً — يمكنك أخذ لقطة شاشة للشاشة كبديل.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      {/* 🎫 جسم التذكرة الفاخرة — هذا الديف هو الذي يُحفظ كصورة كاملة */}
      <div ref={ticketRef} className="w-full relative drop-shadow-2xl bg-gray-900 p-1 rounded-3xl">
        {/* الجزء العلوي للتذكرة (البيانات) */}
        <div className="bg-white rounded-t-3xl p-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-50"></div>

          <div className="flex justify-between items-start mb-6 relative z-10">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">VIP Ticket</span>
            <span className="text-gray-400 text-[10px] font-bold">رقم: #{bookingId.slice(-6).toUpperCase()}</span>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1 leading-tight">{placeName}</h2>
          <p className="text-gray-500 text-xs font-bold mb-6 flex items-center gap-1">
            <MapPin size={12} className="text-blue-500" /> ولاية مسطفانم - سياحة ذكية
          </p>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mb-1"><Users size={12} /> التذاكر</p>
              <p className="text-base font-black text-gray-900">{ticketsCount || 1} أشخاص</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mb-1"><Calendar size={12} /> الحالة</p>
              <p className={`text-sm font-black ${isDimmed ? 'text-red-500' : 'text-green-600'}`}>
                {status === 'USED' ? "مُستخدمة" : status === 'REJECTED' ? "مرفوضة" : "صالحة للاستخدام"}
              </p>
            </div>
            {roomType && (
              <div className="col-span-2 pt-2 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mb-1"><BedDouble size={12} /> نوع الغرفة</p>
                <p className="text-sm font-black text-cyan-700">{roomType}</p>
              </div>
            )}
          </div>
        </div>

        {/* ✂️ فاصل التذكرة المقصوص */}
        <div className="relative bg-white flex items-center h-8">
          <div className="absolute -left-4 w-8 h-8 bg-gray-900 rounded-full"></div>
          <div className="w-full border-t-2 border-dashed border-gray-200 mx-6"></div>
          <div className="absolute -right-4 w-8 h-8 bg-gray-900 rounded-full"></div>
        </div>

        {/* الجزء السفلي للتذكرة (QR Code) */}
        <div className="bg-white rounded-b-3xl p-8 flex flex-col items-center justify-center relative">
          <p className="text-xs text-gray-400 font-bold mb-4">قدّم هذا الرمز عند نقطة الدخول</p>

          <div className="p-3 bg-white border-2 border-blue-100 rounded-2xl shadow-sm mb-4">
            <TicketQRCode value={qrToken} size={160} dimmed={isDimmed} />
          </div>

          <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
            <ShieldCheck size={14} /> تذكرة محمية بتقنية التشفير
          </div>
        </div>
      </div>

      {/* 🔘 أزرار الحفظ وعرض المسار */}
      <div className="w-full flex gap-3 mt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-900 font-bold text-sm py-3 rounded-xl shadow-md hover:bg-gray-100 transition disabled:opacity-60"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
          {saving ? "جارٍ الحفظ..." : "حفظ التذكرة"}
        </button>

        {mapsHref && (
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-bold text-sm py-3 rounded-xl shadow-md hover:bg-green-700 transition"
          >
            <Navigation size={16} /> عرض المسار
          </a>
        )}
      </div>

      {saveError && (
        <p className="text-red-400 text-[11px] font-bold mt-2 text-center">{saveError}</p>
      )}
    </div>
  );
}

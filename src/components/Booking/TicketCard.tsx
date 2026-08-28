// src/components/booking/TicketCard.tsx
"use client";

import { QRCodeSVG } from "qrcode.react";
import { Calendar, MapPin, CheckCircle, Clock } from "lucide-react";

interface TicketProps {
  eventName: string;
  placeName: string;
  date: Date;
  qrHash: string;
  status: string;
}

export default function TicketCard({ eventName, placeName, date, qrHash, status }: TicketProps) {
  const isPending = status === "PENDING";

  return (
    <div className={`relative overflow-hidden rounded-3xl border-2 ${isPending ? 'border-blue-100 bg-white' : 'border-gray-200 bg-gray-50 opacity-80'} p-6 shadow-sm`}>
      
      {/* حالة التذكرة */}
      <div className="absolute left-0 top-0 rounded-br-2xl bg-gray-900 px-4 py-2 text-xs font-bold text-white">
        {isPending ? (
          <span className="flex items-center gap-1 text-green-400"><Clock size={14} /> صالحة للاستخدام</span>
        ) : (
          <span className="flex items-center gap-1 text-gray-400"><CheckCircle size={14} /> تم الاستخدام</span>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center border-b border-dashed border-gray-200 pb-6">
        <h3 className="mb-2 text-center text-xl font-bold text-gray-900">{eventName}</h3>
        <div className="flex gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><MapPin size={16} /> {placeName}</span>
          <span className="flex items-center gap-1"><Calendar size={16} /> {new Date(date).toLocaleDateString('ar-DZ')}</span>
        </div>
      </div>

      {/* منطقة الـ QR Code */}
      <div className="mt-6 flex justify-center">
        <div className={`rounded-2xl bg-white p-4 ${isPending ? 'shadow-md' : 'opacity-50 grayscale'}`}>
          <QRCodeSVG 
            value={qrHash} 
            size={180} 
            level="H" // مستوى عالي لتصحيح الأخطاء في حال كانت شاشة الهاتف مكسورة
            includeMargin={true}
          />
        </div>
      </div>
      
      <p className="mt-4 text-center text-xs text-gray-400">
        رقم التذكرة المشفر: {qrHash.substring(0, 8).toUpperCase()}
      </p>
    </div>
  );
}

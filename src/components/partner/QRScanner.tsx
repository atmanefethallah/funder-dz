// src/components/partner/QRScanner.tsx
"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { validateTicket } from "@/actions/scanner";

export default function QRScanner() {
  // 🛡️ تحديث الحالة لتتطابق مع البيانات الجديدة التي ترجعها دالة التحقق
  const [scanResult, setScanResult] = useState<{ 
    success: boolean; 
    message: string; 
    touristName?: string; 
    placeName?: string; 
    remainingAmount?: number;
  } | null>(null);
  
  const [isScanning, setIsScanning] = useState(true);

  const handleScan = async (text: string) => {
    if (text && isScanning) {
      setIsScanning(false); // إيقاف الكاميرا مؤقتاً لمنع المسح المتكرر
      
      // إرسال الرمز للخادم للتحقق منه
      const result = await validateTicket(text);
      setScanResult(result);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-2xl border bg-white shadow-lg" dir="rtl">
      <div className="bg-gray-900 p-4 text-center text-white">
        <h2 className="text-lg font-bold">بوابة التحقق - فندر</h2>
        <p className="text-xs text-gray-400">وجه الكاميرا نحو تذكرة الزائر</p>
      </div>

      {isScanning ? (
        <div className="p-4">
          <Scanner 
            // 🚀 تجاوز فحص TypeScript الصارم لخصائص المكتبة
            // @ts-ignore
            onResult={(text: any) => handleScan(text)} 
            // @ts-ignore
            onError={(error: any) => console.log(error?.message)} 
          />
        </div>
      ) : (
        <div className="p-8 text-center">
          {scanResult?.success ? (
            <div className="mb-4 rounded-xl bg-green-100 p-6 text-green-800 border border-green-200">
              <span className="mb-2 block text-4xl">✅</span>
              <h3 className="text-lg font-bold">{scanResult.message}</h3>
              
              {/* 💡 عرض تفاصيل الزائر إذا كانت متوفرة */}
              {scanResult.touristName && (
                <div className="mt-4 text-sm font-medium bg-white/50 p-3 rounded-lg text-right">
                  <p className="text-gray-700">الزائر: <span className="font-bold text-gray-900">{scanResult.touristName}</span></p>
                  <p className="text-gray-700">المعلم: <span className="font-bold text-gray-900">{scanResult.placeName}</span></p>
                  
                  {scanResult.remainingAmount !== undefined && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-green-900 font-black flex items-center justify-between">
                        <span>المبلغ المتبقي للتحصيل:</span>
                        <span className="text-lg">{scanResult.remainingAmount} د.ج</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-4 rounded-xl bg-red-100 p-6 text-red-800 border border-red-200">
              <span className="mb-2 block text-4xl">❌</span>
              <h3 className="text-lg font-bold">{scanResult?.message}</h3>
            </div>
          )}
          
          <button 
            onClick={resetScanner}
            className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow hover:bg-blue-700 transition"
          >
            مسح تذكرة أخرى
          </button>
        </div>
      )}
    </div>
  );
}

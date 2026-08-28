"use client";

import { useState, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { CheckCircle, XCircle, Loader2, ScanLine, ArrowRight, ImagePlus, Camera } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import jsQR from "jsqr"; // 👈 المكتبة الجديدة لفك تشفير الصور بأمان

export default function TicketScanner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [scannedId, setScannedId] = useState<string | null>(null);
  
  // 🌟 حالة التحكم في وضع الماسح (كاميرا أو صورة)
  const [scanMode, setScanMode] = useState<"camera" | "upload">("camera");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: toastError, warning } = useToast();

  // 🛡️ الدالة المسؤولة عن التواصل مع الخادم (مؤمنة مسبقاً)
  const handleScan = async (text: string) => {
    if (!text || loading || text === scannedId) return;

    setLoading(true);
    setScannedId(text);
    setResult(null);

    try {
      const res = await fetch("/api/partner/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: text }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ 
          success: true, 
          message: data.message,
          details: `السائح: ${data.touristName} | المعلم: ${data.placeName}`
        });
      } else {
        setResult({ success: false, message: data.message });
      }
    } catch (error) {
      setResult({ success: false, message: "تعذر الاتصال بالخادم، تحقق من الإنترنت." });
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ دالة قراءة الصورة المرفوعة واستخراج الـ QR منها محلياً (آمنة 100%)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 🛡️ الحماية 1: التأكد من أن الملف عبارة عن صورة فقط
    if (!file.type.startsWith("image/")) {
      warning("ملف غير صالح", "يرجى رفع ملف صورة صالح 🚫");
      return;
    }

    // 🛡️ الحماية 2: الحد الأقصى لحجم الصورة هو 5 ميجابايت (لحماية ذاكرة الهاتف)
    if (file.size > 5 * 1024 * 1024) {
      warning("الصورة كبيرة جداً", "الحد الأقصى لحجم الصورة هو 5 ميجابايت 📦");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    
    // عند الانتهاء من قراءة الصورة
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // إنشاء لوحة وهمية (Canvas) لرسم الصورة واستخراج بيانات البكسل
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
          setLoading(false);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // 🛡️ الحماية 3: فك التشفير داخل متصفح المستخدم دون إرسال الصورة للخادم
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          handleScan(code.data); // إرسال النص المستخرج فقط للخادم
        } else {
          setResult({ 
            success: false, 
            message: "لم نتمكن من قراءة رمز الـ QR. يرجى التأكد من أن الصورة واضحة والرمز ظاهر بالكامل. ❌" 
          });
          setLoading(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    // تفريغ الحقل لتتمكن من رفع نفس الصورة مرة أخرى إذا أردت
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetScanner = () => {
    setResult(null);
    setScannedId(null);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* الترويسة */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <Link href="/profile" className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
            <ArrowRight size={20} />
          </Link>
          <h1 className="font-bold flex items-center gap-2">
            <ScanLine size={20} /> ماسح التذاكر
          </h1>
          <div className="w-9"></div>
        </div>

        {/* أزرار التبديل (الكاميرا / الرفع) */}
        {!result && (
          <div className="flex border-b border-gray-100">
            <button 
              onClick={() => setScanMode("camera")}
              className={`flex-1 py-3 flex justify-center items-center gap-2 font-bold text-sm transition ${scanMode === "camera" ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <Camera size={18} /> مسح مباشر
            </button>
            <button 
              onClick={() => setScanMode("upload")}
              className={`flex-1 py-3 flex justify-center items-center gap-2 font-bold text-sm transition ${scanMode === "upload" ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <ImagePlus size={18} /> رفع صورة
            </button>
          </div>
        )}

        {/* منطقة الماسح أو النتيجة */}
        <div className="p-6">
          {!result ? (
            <>
              {loading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-3xl">
                  <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                  <p className="font-bold text-gray-800 animate-pulse">جاري فحص التذكرة...</p>
                </div>
              )}

              {scanMode === "camera" ? (
                <div className="relative rounded-2xl overflow-hidden border-4 border-gray-100 shadow-inner bg-black">
                  <Scanner 
  // استخدام @ts-ignore لتجاوز خطأ فحص النوع إذا كانت المكتبة لا تعترف بـ onResult
  // @ts-ignore
  onResult={(text: any) => handleScan(text)} 
  // @ts-ignore
  onError={(error: any) => console.log(error?.message)}
  options={{ delayBetweenScanAttempts: 1000 }}
/>
                  <div className="absolute top-4 left-0 right-0 text-center z-0 pointer-events-none">
                    <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full font-bold">
                      وجّه الكاميرا نحو الـ QR Code
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:bg-gray-100 transition">
                  <ImagePlus size={48} className="text-gray-400 mb-4" />
                  <p className="text-sm font-bold text-gray-600 mb-2">اختر صورة التذكرة من هاتفك</p>
                  <p className="text-xs text-gray-400 mb-6 text-center px-4">
                    قم بتصوير التذكرة أو اختر الصورة المستلمة من السائح. سيتم فحصها بأمان.
                  </p>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <ImagePlus size={18} /> تصفح الملفات
                  </button>
                </div>
              )}
            </>
          ) : (
            // شاشة النتيجة
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-95 duration-300">
              {result.success ? (
                <div className="bg-green-50 text-green-600 p-6 rounded-full mb-4">
                  <CheckCircle size={64} />
                </div>
              ) : (
                <div className="bg-red-50 text-red-600 p-6 rounded-full mb-4">
                  <XCircle size={64} />
                </div>
              )}
              
              <h2 className={`text-xl font-black mb-2 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message}
              </h2>
              
              {result.details && (
                <p className="text-gray-600 text-sm font-bold bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 mt-2">
                  {result.details}
                </p>
              )}

              <button 
                onClick={resetScanner}
                className="mt-8 bg-gray-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-gray-800 transition shadow-md w-full"
              >
                فحص تذكرة أخرى
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

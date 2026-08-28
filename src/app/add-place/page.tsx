"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, Upload, ShieldAlert, CheckCircle2, Clock, UploadCloud } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

// 🗺️ استدعاء خريطة تحديد الموقع ديناميكياً لتجنب مشاكل السيرفر
const LocationPickerMap = dynamic(() => import("@/components/LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center font-bold text-gray-400">جاري تحميل خريطة تحديد الموقع... 🗺️</div>
});

export default function AddPlacePage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  // 🛡️ --- متغيرات حالة التوثيق ---
  const [status, setStatus] = useState<"UNVERIFIED" | "PENDING" | "VERIFIED">("UNVERIFIED");
  const [pageLoading, setPageLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [registryFile, setRegistryFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);

  // 📝 --- متغيرات نموذج إضافة المعلم ---
  const [name, setName] = useState("");
  const [category, setCategory] = useState("تاريخي");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [virtualTourUrl, setVirtualTourUrl] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // 🔍 1. جلب حالة توثيق الشريك عند فتح الصفحة
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setStatus(data.verificationStatus || "UNVERIFIED");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setPageLoading(false);
      }
    };
    checkVerificationStatus();
  }, []);

  // 📁 2. دوال التعامل مع رفع الوثائق القانونية
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: Function) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toastError("نوع ملف غير مدعوم", "يرجى رفع صورة (JPG/PNG) أو ملف PDF فقط.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastError("الملف كبير جداً", "الحد الأقصى المسموح به هو 5 ميغابايت.");
      e.target.value = "";
      return;
    }

    setFile(file);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registryFile || !idCardFile) return;

    setUploadLoading(true);
    setVerifyMessage("");

    const formData = new FormData();
    formData.append("commercialRegistry", registryFile);
    formData.append("idCard", idCardFile);

    try {
      const res = await fetch("/api/partner/verify", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("PENDING");
        success("تم الإرسال", data.message);
      } else {
        setVerifyMessage(data.message);
      }
    } catch (error) {
      setVerifyMessage("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setUploadLoading(false);
    }
  };

  // 🗺️ 3. دوال إضافة المعلم الجغرافي
  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  // معالجة الإدخال اليدوي للإحداثيات
  const handleManualCoordinateChange = (type: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value);
    if (type === 'lat') {
      setLatitude(isNaN(numValue) ? null : numValue);
    } else {
      setLongitude(isNaN(numValue) ? null : numValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!latitude || !longitude) {
      setIsSuccess(false);
      setMessage("⚠️ يرجى تحديد موقع المعلم على الخريطة أو إدخال الإحداثيات يدوياً.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("virtualTourUrl", virtualTourUrl);
    formData.append("latitude", latitude.toString());
    formData.append("longitude", longitude.toString());

    if (image) {
      formData.append("image", image);
    }

    try {
      const res = await fetch("/api/places", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setMessage("تمت إضافة المعلم وتثبيته على الخريطة بنجاح! 🎉");
        setName("");
        setDescription("");
        setPrice("");
        setImage(null);
        setVirtualTourUrl(""); 
        setLatitude(null);
        setLongitude(null);
      } else {
        setIsSuccess(false);
        setMessage(data.message);
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage("حدث خطأ في الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 --- عرض الواجهات الديناميكية ---

  if (pageLoading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  // 🔒 الحالة 1: الطلب تحت المراجعة من المدير
  if (status === "PENDING") {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 text-center bg-white border border-gray-100 rounded-3xl shadow-xl animate-fade-in" dir="rtl">
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full mx-auto flex items-center justify-center mb-5 border border-amber-200">
          <Clock size={32} className="animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">وثائقك قيد المراجعة الفنية ⏳</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          لقد استلمنا نسخة من سجلّك التجاري وبطاقة تعريفك الوطنية بنجاح. تقوم الإدارة حالياً بمراجعة البيانات لتفعيل ميزة إضافة المعالم لحسابك.
        </p>
        <button onClick={() => router.push("/profile")} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition text-sm">
          الذهاب للملف الشخصي
        </button>
      </div>
    );
  }

  // 🔒 الحالة 2: الحساب غير مفعل (يجب رفع الوثائق القانونية)
  if (status === "UNVERIFIED") {
    return (
      <div className="max-w-xl mx-auto py-12 px-4" dir="rtl">
        <div className="bg-white border rounded-3xl p-8 shadow-md">
          <div className="mb-6 text-center border-b pb-5">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl mx-auto flex items-center justify-center mb-3">
              <ShieldAlert size={26} />
            </div>
            <h1 className="text-2xl font-black text-gray-900">تفعيل حساب الشريك مطلوب 🛡️</h1>
            <p className="text-xs text-gray-400 mt-1">تنفيذاً للقوانين؛ يتطلب تفعيل ميزة النشر رفع الوثائق القانونية التالية للمنشأة</p>
          </div>

          {verifyMessage && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg">{verifyMessage}</div>}

          <form onSubmit={handleVerifySubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">1. نسخة من السجل التجاري المعتمَد (صورة أو PDF):</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-5 bg-gray-50 hover:bg-gray-100/70 transition cursor-pointer relative">
                <UploadCloud size={28} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-500 font-bold text-center">{registryFile ? registryFile.name : "اضغط هنا لاختيار الملف (الحد الأقصى 5MB)"}</span>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, setRegistryFile)} className="hidden" required />
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">2. نسخة من بطاقة التعريف الوطنية (صورة أو PDF):</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-5 bg-gray-50 hover:bg-gray-100/70 transition cursor-pointer relative">
                <UploadCloud size={28} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-500 font-bold text-center">{idCardFile ? idCardFile.name : "اضغط هنا لاختيار الملف (الحد الأقصى 5MB)"}</span>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, setIdCardFile)} className="hidden" required />
              </label>
            </div>

            <button type="submit" disabled={uploadLoading} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition shadow-md disabled:opacity-70 flex items-center justify-center gap-2 text-sm">
              {uploadLoading ? <Loader2 className="animate-spin" size={20} /> : "إرسال المستندات للتفعيل الفوري 🚀"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ✅ الحالة 3: الحساب مفعل (VERIFIED) - واجهة إضافة المعلم الأصلية الخاصة بك
  return (
    <div className="mx-auto max-w-2xl px-4 py-12" dir="rtl">
      
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        
        <div className="mb-4 flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-xl border border-green-200">
          <CheckCircle2 size={20} />
          <span className="text-xs font-bold">حسابك مفعل وموثق قانونياً. يمكنك الآن إضافة المعالم.</span>
        </div>

        <div className="mb-8 flex items-center gap-3 border-b pb-4 text-blue-600">
          <MapPin size={28} />
          <h1 className="text-2xl font-bold">إضافة معلم سياحي جديد</h1>
        </div>

        {message && (
          <div className={`mb-6 flex items-center gap-2 rounded-lg p-4 font-bold ${isSuccess ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">اسم المعلم أو الفعالية</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: غابة بورحمة، مسرح مستغانم..." className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">صورة المعلم (اختياري)</label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition hover:bg-gray-100 hover:border-blue-400">
              <Upload size={32} className="mb-2 text-gray-400" />
              <span className="text-sm text-gray-500 font-medium">{image ? image.name : "اضغط هنا لاختيار صورة من جهازك"}</span>
              <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">التصنيف</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500 bg-white">
                <option value="تاريخي">تاريخي وثقافي</option>
                <option value="ترفيهي">ترفيهي ومغامرات</option>
                <option value="طبيعي">طبيعي (شواطئ وغابات)</option>
                <option value="فعالية">فعالية / مهرجان</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">سعر التذكرة (د.ج)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="اتركه فارغاً مجانياً" className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">
              رابط صورة 360 درجة (الجولة الافتراضية) 🕶️ <span className="text-gray-400 font-normal">(اختياري)</span>
            </label>
            <input 
              type="url" 
              placeholder="مثال: https://example.com/360-image.jpg" 
              value={virtualTourUrl} 
              onChange={(e) => setVirtualTourUrl(e.target.value)} 
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" 
            />
            <p className="text-xs text-gray-500">
              يجب أن يكون الرابط لصورة بانورامية بصيغة JPG أو PNG تدعم العرض المحيطي (Equirectangular).
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">وصف قصير</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اكتب نبذة عن المكان تجذب السياح..." rows={4} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" />
          </div>

          {/* 📍 قسم تحديد الموقع الجديد مع الإحداثيات اليدوية */}
          <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <label className="mb-3 block text-sm font-bold text-gray-700 flex items-center gap-2">
              <MapPin size={18} className="text-blue-600" /> حدد موقع المعلم الجغرافي <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">انقر على الخريطة لتثبيت الدبوس، أو أدخل الإحداثيات يدوياً من خرائط جوجل للحصول على دقة متناهية.</p>
            
            {/* إدخال الإحداثيات يدوياً */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">خط العرض (Latitude)</label>
                <input 
                  type="number" 
                  step="any"
                  value={latitude || ''} 
                  onChange={(e) => handleManualCoordinateChange('lat', e.target.value)}
                  placeholder="مثال: 35.931" 
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-blue-500 text-left" dir="ltr"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">خط الطول (Longitude)</label>
                <input 
                  type="number" 
                  step="any"
                  value={longitude || ''} 
                  onChange={(e) => handleManualCoordinateChange('lng', e.target.value)}
                  placeholder="مثال: 0.089" 
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-blue-500 text-left" dir="ltr"
                />
              </div>
            </div>

            <LocationPickerMap 
              onLocationSelect={handleLocationSelect} 
              // يمكنك تمرير الإحداثيات للخريطة إذا كانت تدعم عرض الدبوس بناءً عليها
              // initialLat={latitude} 
              // initialLng={longitude} 
            />
            
            {latitude && longitude && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-xs font-bold text-green-800 border border-green-200">
                ✅ تم تحديد الموقع: {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="mt-4 flex w-full items-center justify-center rounded-lg bg-blue-600 p-4 font-bold text-white transition hover:bg-blue-700 disabled:opacity-70 shadow-md gap-2">
            {loading ? <Loader2 className="animate-spin" size={24} /> : "نشر المعلم في المنصة 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}

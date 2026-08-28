"use client";

import { useEffect, useState } from "react";
import { MapPin, Loader2, Upload, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// 🗺️ استدعاء الخريطة ديناميكياً لتجنب مشاكل الخادم (SSR)
const LocationPickerMap = dynamic(() => import("@/components/LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-50 border-2 border-dashed border-gray-200 animate-pulse rounded-2xl flex items-center justify-center font-bold text-gray-400">جاري تحميل الخريطة التفاعلية... 🗺️</div>
});

export default function EditPlacePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("تاريخي");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [oldImageUrl, setOldImageUrl] = useState("");
  
  const [virtualTourUrl, setVirtualTourUrl] = useState("");

  // 📍 حالات الإحداثيات الجغرافية
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // جلب بيانات المعلم عند فتح الصفحة
  useEffect(() => {
    const fetchPlace = async () => {
      try {
        const res = await fetch(`/api/places`);
        const places = await res.json();
        const currentPlace = places.find((p: any) => p.id === params.id);
        
        if (currentPlace) {
          setName(currentPlace.name);
          setCategory(currentPlace.category);
          setDescription(currentPlace.description || "");
          setPrice(currentPlace.price ? currentPlace.price.toString() : "");
          setOldImageUrl(currentPlace.imageUrl || "");
          setVirtualTourUrl(currentPlace.virtualTourUrl || "");
          
          // 📍 جلب الإحداثيات القديمة إن وجدت
          setLatitude(currentPlace.latitude || null);
          setLongitude(currentPlace.longitude || null);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlace();
  }, [params.id]);

  // 📍 دالة التقاط الإحداثيات من الخريطة
  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage("");

    // 🛑 التحقق من تحديد الموقع
    if (!latitude || !longitude) {
      setIsSuccess(false);
      setMessage("⚠️ يرجى تحديد موقع المعلم على الخريطة.");
      setSubmitLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("virtualTourUrl", virtualTourUrl);
    
    // 📍 إرسال الإحداثيات الجديدة للسيرفر
    formData.append("latitude", latitude.toString());
    formData.append("longitude", longitude.toString());

    if (image) {
      formData.append("image", image);
    }

    try {
      const res = await fetch(`/api/places/${params.id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setMessage("✅ تم تعديل المعلم وتحديث موقعه بنجاح! سيتم توجيهك...");
        setTimeout(() => router.push("/explore"), 2000);
      } else {
        setIsSuccess(false);
        setMessage(data.message);
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage("حدث خطأ في الاتصال بالخادم.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12" dir="rtl">
      <Link href="/explore" className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-6 hover:text-blue-600 w-max transition">
        <ArrowRight size={18} /> العودة للمعالم
      </Link>

      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3 border-b pb-4 text-blue-600">
          <MapPin size={28} />
          <h1 className="text-2xl font-bold">تعديل المعلم السياحي</h1>
        </div>

        {message && (
          <div className={`mb-6 flex items-center gap-2 rounded-lg p-4 font-bold ${isSuccess ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">اسم المعلم</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">تحديث الصورة (اختياري)</label>
            {oldImageUrl && !image && (
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                ✅ توجد صورة مرفوعة مسبقاً. ارفع صورة جديدة فقط إذا أردت تغييرها.
              </div>
            )}
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition hover:bg-gray-100 hover:border-blue-400">
              <Upload size={32} className="mb-2 text-gray-400" />
              <span className="text-sm text-gray-500 font-medium">{image ? image.name : "اضغط لرفع صورة جديدة"}</span>
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
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" />
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
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">وصف قصير</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" />
          </div>

          {/* 📍 الخريطة لتعديل الموقع الجغرافي 📍 */}
          <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <label className="mb-2 block text-sm font-bold text-gray-700 flex items-center gap-1">
              <MapPin size={16} className="text-blue-600" /> تعديل الموقع الجغرافي على الخريطة
            </label>
            <p className="text-xs text-gray-500 mb-3">إذا كان موقع المعلم الحالي غير دقيق، انقر في أي مكان جديد على الخريطة لتحديث الدبوس.</p>
            
            <LocationPickerMap 
              onLocationSelect={handleLocationSelect} 
              initialLat={latitude} 
              initialLng={longitude} 
            />

            {latitude && longitude && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 border border-blue-100">
                📍 الإحداثيات المعتمدة: ({latitude.toFixed(4)}, {longitude.toFixed(4)})
              </div>
            )}
          </div>

          <button type="submit" disabled={submitLoading} className="mt-4 flex w-full items-center justify-center rounded-lg bg-blue-600 p-4 font-bold text-white transition hover:bg-blue-700 disabled:opacity-70 text-base shadow-md">
            {submitLoading ? <Loader2 className="animate-spin" size={24} /> : "حفظ التعديلات وتحديث الخريطة 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}

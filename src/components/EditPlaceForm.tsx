"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, Save, ArrowRight } from "lucide-react";
import Link from "next/link";

const LocationPickerMap = dynamic(() => import("@/components/LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center font-bold text-gray-400">جاري تحميل خريطة تحديد الموقع... 🗺️</div>
});

export default function EditPlaceForm({ place }: { place: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // ملء الحالات بالبيانات الحالية للمعلم القادمة من قاعدة البيانات
  const [name, setName] = useState(place.name);
  const [category, setCategory] = useState(place.category);
  const [description, setDescription] = useState(place.description || "");
  const [price, setPrice] = useState(place.price.toString());
  const [virtualTourUrl, setVirtualTourUrl] = useState(place.virtualTourUrl || "");
  
  // 📍 حالات الإحداثيات الجغرافية الحالية
  const [latitude, setLatitude] = useState<number | null>(place.latitude);
  const [longitude, setLongitude] = useState<number | null>(place.longitude);

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!latitude || !longitude) {
      setIsSuccess(false);
      setMessage("⚠️ يرجى تحديد موقع المعلم على الخريطة.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("virtualTourUrl", virtualTourUrl);
    
    // 📍 إرسال الإحداثيات الجديدة أو المحدثة
    formData.append("latitude", latitude.toString());
    formData.append("longitude", longitude.toString());

    try {
      const res = await fetch(`/api/places/${place.id}`, {
        method: "PUT", // أو PATCH حسب نظام الـ API لديك
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setMessage("✅ تم تحديث بيانات المعلم وتعديل موقعه الجغرافي بنجاح!");
        router.refresh();
      } else {
        setIsSuccess(false);
        setMessage(data.message || "حدث خطأ أثناء التحديث.");
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage("حدث خطأ في الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12" dir="rtl">
      
      <Link href="/explore" className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-700 mb-4 transition">
        <ArrowRight size={14} /> إلغاء والتراجع
      </Link>

      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3 border-b pb-4 text-blue-600">
          <MapPin size={28} />
          <h1 className="text-2xl font-bold">تعديل بيانات المعلم السياحي</h1>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg font-bold text-sm border ${isSuccess ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">اسم المعلم</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500 text-sm" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">التصنيف</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500 text-sm bg-white">
                <option value="تاريخي">تاريخي وثقافي</option>
                <option value="ترفيهي">ترفيهي ومغامرات</option>
                <option value="طبيعي">طبيعي (شواطئ وغابات)</option>
                <option value="فعالية">فعالية / مهرجان</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">سعر التذكرة (د.ج)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">رابط الجولة الافتراضية 360°</label>
            <input type="url" value={virtualTourUrl} onChange={(e) => setVirtualTourUrl(e.target.value)} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500 text-sm" placeholder="https://..." />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">الوصف</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500 text-sm" />
          </div>

          {/* 📍 قسم تعديل وتحديث الموقع الجغرافي الخريطة 📍 */}
          <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <label className="mb-2 block text-sm font-bold text-gray-700 flex items-center gap-1">
              <MapPin size={16} className="text-blue-600" /> تعديل الموقع الجغرافي على الخريطة
            </label>
            <p className="text-xs text-gray-500 mb-3">إذا كان موقع المعلم الحالي غير دقيق، انقر في أي مكان جديد على الخريطة لتحديث الدبوس.</p>
            
            {/* تمرير الإحداثيات الحالية لتظهر فوق الخريطة تلقائياً عند فتحها */}
            <LocationPickerMap 
              onLocationSelect={handleLocationSelect} 
              initialLat={place.latitude} 
              initialLng={place.longitude} 
            />

            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 border border-blue-100">
              📍 الإحداثيات المعتمدة الحالية: ({latitude?.toFixed(4)}, {longitude?.toFixed(4)})
            </div>
          </div>

          <button type="submit" disabled={loading} className="mt-4 flex w-full items-center justify-center rounded-lg bg-gray-900 p-4 font-bold text-white transition hover:bg-gray-800 disabled:opacity-70 shadow-md gap-2 text-sm">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> حفظ التغييرات وتحديث الخريطة الحية 🚀</>}
          </button>
        </form>
      </div>
    </div>
  );
}

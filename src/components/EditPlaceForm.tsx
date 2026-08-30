"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, Save, ArrowRight, Link2, CalendarClock, BedDouble, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { parseGoogleMapsLink } from "@/lib/mapsLink";

const LocationPickerMap = dynamic(() => import("@/components/LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center font-bold text-gray-400">جاري تحميل خريطة تحديد الموقع... 🗺️</div>
});

type RoomType = { name: string; price: string };

function toDatetimeLocalValue(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const [mapsLink, setMapsLink] = useState("");
  const [mapsLinkError, setMapsLinkError] = useState("");

  // 🎉 حالات العرض الإعلاني المؤقت (فعالية/حفل)
  const [isEvent, setIsEvent] = useState<boolean>(!!place.isEvent);
  const [eventEndsAt, setEventEndsAt] = useState<string>(toDatetimeLocalValue(place.eventEndsAt));

  // 🏨 أنواع الغرف (تظهر فقط لتصنيف "فندق")
  const initialRoomTypes: RoomType[] = Array.isArray(place.roomTypes)
    ? place.roomTypes.map((r: any) => ({ name: r.name || "", price: String(r.price ?? "") }))
    : (() => {
        try {
          const parsed = place.roomTypes ? JSON.parse(place.roomTypes) : [];
          return Array.isArray(parsed) ? parsed.map((r: any) => ({ name: r.name || "", price: String(r.price ?? "") })) : [];
        } catch {
          return [];
        }
      })();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(initialRoomTypes);

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const applyMapsLink = () => {
    const parsed = parseGoogleMapsLink(mapsLink);
    if (!parsed) {
      setMapsLinkError("تعذر استخراج الإحداثيات من هذا الرابط. تأكد من نسخ رابط موقع من جوجل ماب يحتوي على إحداثيات.");
      return;
    }
    setMapsLinkError("");
    setLatitude(parsed.lat);
    setLongitude(parsed.lng);
  };

  const addRoomType = () => setRoomTypes((prev) => [...prev, { name: "", price: "" }]);
  const removeRoomType = (idx: number) => setRoomTypes((prev) => prev.filter((_, i) => i !== idx));
  const updateRoomType = (idx: number, field: keyof RoomType, value: string) =>
    setRoomTypes((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));

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

    if (isEvent && !eventEndsAt) {
      setIsSuccess(false);
      setMessage("⚠️ يرجى تحديد تاريخ ووقت انتهاء الفعالية.");
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

    // 🎉 العرض الإعلاني المؤقت
    formData.append("isEvent", isEvent ? "1" : "0");
    if (isEvent && eventEndsAt) {
      formData.append("eventEndsAt", new Date(eventEndsAt).toISOString());
    } else {
      formData.append("eventEndsAt", "");
    }

    // 🏨 أنواع الغرف لتصنيف الفندق
    if (category === "فندق") {
      const cleanRoomTypes = roomTypes
        .filter((r) => r.name.trim() && r.price.trim())
        .map((r) => ({ name: r.name.trim(), price: Number(r.price) || 0 }));
      formData.append("roomTypes", JSON.stringify(cleanRoomTypes));
    } else {
      formData.append("roomTypes", "[]");
    }

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
                <option value="فندق">فندق وإقامة</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">{category === "فندق" ? "سعر أساسي (د.ج)" : "سعر التذكرة (د.ج)"}</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500 text-sm" />
            </div>
          </div>

          {/* 🏨 أنواع الغرف للفنادق فقط */}
          {category === "فندق" && (
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-cyan-800">
                <BedDouble size={16} /> أنواع الغرف وأسعارها
              </label>
              <p className="text-xs text-cyan-700 mb-3">أضف كل نوع غرفة (لشخص، شخصين، ثلاثة، جناح...) مع سعره الخاص. سيختار السائح النوع عند الحجز.</p>
              <div className="flex flex-col gap-2">
                {roomTypes.map((rt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="مثال: غرفة لشخصين"
                      value={rt.name}
                      onChange={(e) => updateRoomType(idx, "name", e.target.value)}
                      className="flex-1 rounded-lg border p-2 text-sm outline-none focus:border-cyan-500"
                    />
                    <input
                      type="number"
                      placeholder="السعر (د.ج)"
                      value={rt.price}
                      onChange={(e) => updateRoomType(idx, "price", e.target.value)}
                      className="w-32 rounded-lg border p-2 text-sm outline-none focus:border-cyan-500"
                    />
                    <button type="button" onClick={() => removeRoomType(idx)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addRoomType} className="mt-1 flex items-center justify-center gap-1 rounded-lg border-2 border-dashed border-cyan-300 p-2 text-xs font-bold text-cyan-700 hover:bg-cyan-100 transition">
                  <Plus size={14} /> إضافة نوع غرفة جديد
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">رابط الجولة الافتراضية 360°</label>
            <input type="url" value={virtualTourUrl} onChange={(e) => setVirtualTourUrl(e.target.value)} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500 text-sm" placeholder="https://..." />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">الوصف</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500 text-sm" />
          </div>

          {/* 🎉 قسم العرض الإعلاني المؤقت (فعالية/حفل) */}
          <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
            <label className="flex items-center gap-2 text-sm font-bold text-pink-800 cursor-pointer">
              <input type="checkbox" checked={isEvent} onChange={(e) => setIsEvent(e.target.checked)} className="w-4 h-4 accent-pink-600" />
              <CalendarClock size={16} /> هذا عرض إعلاني مؤقت لفعالية أو حفل
            </label>
            <p className="text-xs text-pink-700 mt-1 mb-2">سيختفي هذا العرض تلقائياً من المنصة بعد الوقت المحدد أدناه.</p>
            {isEvent && (
              <input
                type="datetime-local"
                value={eventEndsAt}
                onChange={(e) => setEventEndsAt(e.target.value)}
                className="w-full rounded-lg border border-pink-300 p-2.5 text-sm outline-none focus:border-pink-500"
                required={isEvent}
              />
            )}
          </div>

          {/* 📍 قسم تعديل وتحديث الموقع الجغرافي الخريطة 📍 */}
          <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <label className="mb-2 block text-sm font-bold text-gray-700 flex items-center gap-1">
              <MapPin size={16} className="text-blue-600" /> تعديل الموقع الجغرافي على الخريطة
            </label>
            <p className="text-xs text-gray-500 mb-3">إذا كان موقع المعلم الحالي غير دقيق، انقر في أي مكان جديد على الخريطة لتحديث الدبوس.</p>

            {/* 🔗 لصق رابط جوجل ماب مباشرة */}
            <div className="mb-3">
              <label className="mb-1 flex items-center gap-1 text-xs font-bold text-gray-600">
                <Link2 size={14} className="text-blue-600" /> أو الصق رابط الموقع من جوجل ماب مباشرة
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={mapsLink}
                  onChange={(e) => setMapsLink(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="flex-1 rounded-lg border p-2.5 text-sm outline-none focus:border-blue-500"
                  dir="ltr"
                />
                <button type="button" onClick={applyMapsLink} className="rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 transition">
                  استخدم الرابط
                </button>
              </div>
              {mapsLinkError && <p className="text-[11px] text-red-600 mt-1">{mapsLinkError}</p>}
            </div>

            {/* تمرير الإحداثيات الحالية لتظهر فوق الخريطة تلقائياً عند فتحها */}
            <LocationPickerMap
              onLocationSelect={handleLocationSelect}
              initialLat={latitude ?? place.latitude}
              initialLng={longitude ?? place.longitude}
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

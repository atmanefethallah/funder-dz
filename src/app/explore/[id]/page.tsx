"use client";

import { useEffect, useState } from "react";
import { MapPin, CalendarClock, DollarSign, Compass, ArrowRight, Loader2, ShieldAlert, Navigation, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PlaceDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [place, setPlace] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. جلب تفاصيل المعلم وبيانات المستخدم الحالي عند فتح الصفحة
  useEffect(() => {
    const loadData = async () => {
      try {
        // جلب المعلم المفرد من الـ API الخاص بالمعالم
        const placeRes = await fetch("/api/places");
        const places = await placeRes.json();
        const currentPlace = places.find((p: any) => p.id === params.id);
        setPlace(currentPlace);

        // جلب بيانات الحساب الحالي لمعرفة الصلاحية (سائح أم شريك)
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUserRole(profileData?.role || null);
        }
      } catch (error) {
        console.error("Error loading place details:", error);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  // 2. دالة معالجة الحجز والدفع بالعربون
  const handleBooking = async () => {
    setBookingLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: place.id }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setMessage("🎉 تم الحجز وخصم العربون بنجاح! يمكنك العثور على تذكرتك في حسابك الشخصي.");
        setTimeout(() => router.push("/profile"), 2500);
      } else {
        setIsSuccess(false);
        setMessage(data.message || "فشل إتمام الحجز.");
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-gray-500 gap-2">
        <ShieldAlert size={40} className="text-red-500" />
        <h2 className="text-xl font-bold">المعلم السياحي غير موجود أو تم حذفه.</h2>
        <Link href="/explore" className="text-blue-600 underline text-sm mt-2">العودة لصفحة الاستكشاف</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 pb-24" dir="rtl">
      <div className="max-w-4xl mx-auto">
        
        {/* زر العودة الخلفي */}
        <Link href="/explore" className="inline-flex items-center gap-1 text-xs font-black text-gray-400 hover:text-gray-700 mb-6 transition">
          <ArrowRight size={14} /> العودة للاستكشاف
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* الجانب الأيمن الكبيير: تفاصيل وصور المعلم */}
          <div className="md:col-span-2 space-y-6">
            
            {/* عرض الصورة أو صورة افتراضية */}
            <div className="w-full h-64 md:h-96 rounded-3xl overflow-hidden border bg-gray-200 shadow-sm relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={place.imageUrl || "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800"} 
                alt={place.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-black/50 text-white font-bold px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                📍 {place.category}
              </div>
            </div>

            {/* الاسم والموقع الجغرافي */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h1 className="text-3xl font-black text-gray-900 mb-2">{place.name}</h1>
              <p className="text-gray-500 text-sm flex items-center gap-1 font-medium">
                <MapPin size={16} className="text-blue-600" /> ولاية مستغانم - الجزائر جغرافياً
              </p>
              
              <h3 className="text-sm font-black text-gray-400 mt-6 mb-2 tracking-wider">عن هذا المعلم:</h3>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">{place.description || "لا يوجد وصف متوفر حالياً لهذا المعلم الفريد في ولاية مستغانم."}</p>
            </div>

            {/* أزرار التوجيه والجولة الافتراضية */}
            <div className="grid grid-cols-2 gap-4">
              {place.latitude && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white p-4 rounded-2xl font-bold transition shadow-md text-sm text-center"
                >
                  <Navigation size={16} className="fill-white" /> فتح المسار بالخريطة
                </a>
              )}

              {place.virtualTourUrl ? (
                <a 
                  href={place.virtualTourUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 p-4 rounded-2xl font-bold transition border border-blue-100 shadow-sm text-sm text-center"
                >
                  <Eye size={16} /> جولة افتراضية 360° 🕶️
                </a>
              ) : (
                <div className="flex items-center justify-center bg-gray-100 text-gray-400 p-4 rounded-2xl font-bold text-xs text-center border-2 border-dashed">
                  لا توجد جولة 360° حالياً
                </div>
              )}
            </div>

          </div>

          {/* الجانب الأيسر: بطاقة الحجز المالي المحمية */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md sticky top-24">
              
              <div className="border-b pb-4 mb-4">
                <p className="text-xs font-bold text-gray-400 mb-1">سعر تذكرة الدخول الكلي</p>
                <h3 className="text-3xl font-black text-gray-900 flex items-baseline gap-1">
                  {place.price || "0"} <span className="text-sm font-normal text-gray-500">د.ج</span>
                  {place.price === 0 && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-md border border-green-100 mr-2">دخول مجاني</span>}
                </h3>
              </div>

              {message && (
                <div className={`mb-4 p-4 rounded-xl text-xs font-bold border ${isSuccess ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                  {message}
                </div>
              )}

              {/* 🛡️ غلاف الحماية للواجهة الأمامية لمنع الشركاء وتوجيه السياح */}
              {userRole === "PARTNER" ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-2xl text-center shadow-sm">
                  <div className="font-black text-sm mb-1">🛡️ حساب شريك معتمد</div>
                  <p className="text-[11px] font-bold leading-relaxed">
                    خاصية الحجز متاحة فقط لحسابات السياح. حسابك الحالي مخصص حصرياً لرفع وإدارة المنشآت والمعالم ومسح التذاكر.
                  </p>
                </div>
              ) : (
                <button 
                  onClick={handleBooking} 
                  disabled={bookingLoading || place.price === 0} 
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold p-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md text-sm"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> جاري معالجة الدفع...
                    </>
                  ) : place.price === 0 ? (
                    "المعلم مجاني (لا يحتاج لحجز) ✨"
                  ) : (
                    "احجز الآن وادفع عربون (10%) 💳"
                  )}
                </button>
              )}

              <div className="mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100 text-[11px] text-gray-400 font-medium leading-relaxed">
                ℹ️ نظام Funder يضمن لك الحجز الفوري؛ تدفع 10% فقط كعربون لتوليد الـ QR Code وباقي المبلغ يتم تسويته عند بوابات الدخول.
              </div>

            </div>
          </div>

        </div>

      </div>
    </main>
  );
}

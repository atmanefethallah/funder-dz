"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Users, Glasses, ShieldCheck, Loader2, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

type PlaceType = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  virtualTourUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  user: { name: string };
};

export default function PlaceDetailsClient({ 
  place, 
  isLoggedIn, 
  canReview = false // 👈 استقبال صلاحية التقييم من السيرفر
}: { 
  place: PlaceType; 
  isLoggedIn: boolean; 
  canReview?: boolean;
}) {
  const router = useRouter();
  const { success, error: toastError, warning } = useToast();
  
  // حالات الحجز
  const [ticketCount, setTicketCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showTour, setShowTour] = useState(false); 

  // حالات التقييم
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const totalPrice = place.price * ticketCount;

  // رابط الملاحة المباشر لموقع المعلم الدقيق حسب الإدّحيات التي وضعها الشريك
  const hasCoords = place.latitude != null && place.longitude != null;
  const mapsHref = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
    : "/map";

  // 🚀 دالة الحجز للمعالم المدفوعة
  const handleBooking = async () => {
    if (!isLoggedIn) {
      router.push("/register");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: place.id,
          tickets: ticketCount,
          totalAmount: totalPrice,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        success("تم الحجز بنجاح! 🎉", "جاري توجيهك لتذكرة الـ QR الخاصة بك.");
        router.push(`/tickets/${data.bookingId}`);
      } else {
        toastError("فشل تأكيد الحجز", "حدث خطأ أثناء تأكيد الحجز، يرجى المحاولة لاحقاً.");
      }
    } catch (error) {
      toastError("خطأ في الاتصال", "تعذر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  // ⭐️ دالة إرسال التقييم
  const submitReview = async () => {
    if (rating === 0) {
      warning("تقييم ناقص", "يرجى تحديد عدد النجوم أولاً.");
      return;
    }
    setReviewLoading(true);
    try {
      // نفترض أنك ستنشئ (أو تملك) مسار /api/reviews
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: place.id,
          rating: rating,
          comment: comment,
        }),
      });

      if (response.ok) {
        setReviewSuccess(true);
      } else {
        toastError("فشل إرسال التقييم", "حدث خطأ أثناء إرسال التقييم.");
      }
    } catch (error) {
      toastError("خطأ في الاتصال", "تعذر الاتصال بالخادم.");
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-16 pt-6 selection:bg-blue-200" dir="rtl">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* زر العودة للخلف */}
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-900 mb-6 transition">
          <ArrowRight size={16} /> العودة للاستكشاف
        </Link>

        {/* 📸 معرض الصور */}
        <div className="w-full h-[350px] md:h-[480px] rounded-3xl overflow-hidden relative shadow-md border-4 border-white bg-gray-200">
          {place.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-300">
              <MapPin size={64} />
            </div>
          )}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black text-blue-600 shadow-sm border border-white/20">
            {place.category}
          </div>
        </div>

        {/* 🧱 تخطيط الصفحة: عمودين */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 items-start">
          
          {/* ℹ️ العمود الأيمن الكبير: تفاصيل المعلم والتقييمات */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* قسم التفاصيل */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h1 className="text-3xl font-black text-gray-900 mb-3">{place.name}</h1>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium">
                <MapPin size={16} className="text-blue-500" />
                <span>مستغانم، الجزائر</span>
                <span className="text-gray-300">•</span>
                <span>بواسطة: <strong className="text-gray-700">{place.user?.name || "منصة Funder"}</strong></span>
              </div>

              <hr className="border-gray-100 my-6" />

              <h2 className="text-lg font-black text-gray-900 mb-3">عن هذا المعلم السياحي</h2>
              <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
                {place.description || "لا يوجد وصف متوفر حالياً لهذا المعلم."}
              </p>

              {/* 🕶️ الجولة الافتراضية */}
              {place.virtualTourUrl && (
                <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-right">
                    <h3 className="font-bold text-purple-900 text-sm mb-1 flex items-center gap-1">
                      <Glasses size={18} /> متوفر جولة افتراضية 360°!
                    </h3>
                    <p className="text-xs text-purple-600">يمكنك التجوّل داخل المكان واكتشافه افتراضياً الآن قبل الذهاب.</p>
                  </div>
                  <button 
                    onClick={() => setShowTour(true)}
                    className="bg-purple-600 text-white text-xs font-black px-5 py-3 rounded-xl hover:bg-purple-700 transition shadow-md shadow-purple-600/20 whitespace-nowrap"
                  >
                    ابدأ الجولة الافتراضية عِش التجربة 🕶️
                  </button>
                </div>
              )}
            </div>

            {/* ⭐️ قسم التقييم الذكي: يظهر فقط إذا كان مسموحاً له بالتقييم */}
            {canReview && (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h2 className="text-xl font-black text-gray-900 mb-2">شاركنا تجربتك 🌟</h2>
                <p className="text-sm text-gray-500 mb-6">ما رأيك في زيارتك لهذا المكان؟ تقييمك يساعد سياحاً آخرين!</p>
                
                {reviewSuccess ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-2xl text-center">
                    <span className="text-4xl block mb-2">🎉</span>
                    <h3 className="font-bold text-lg">شكراً لتقييمك!</h3>
                    <p className="text-sm">تم إرسال رأيك بنجاح وسيتم عرضه قريباً.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* النجوم التفاعلية */}
                    <div className="flex items-center gap-1 flex-row-reverse justify-end">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star 
                            size={32} 
                            className={`${(hoverRating || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} transition-colors`} 
                          />
                        </button>
                      ))}
                    </div>
                    
                    <textarea 
                      placeholder="اكتب تعليقك هنا (اختياري)..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-none h-24"
                    ></textarea>

                    <button 
                      onClick={submitReview}
                      disabled={reviewLoading}
                      className="bg-gray-900 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-gray-800 transition disabled:opacity-70 flex items-center gap-2"
                    >
                      {reviewLoading ? <Loader2 size={16} className="animate-spin" /> : "نشر التقييم"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🎫 العمود الأيسر: صندوق الحجز التكيفي (مجاني / مدفوع) */}
          <div className="lg:sticky lg:top-6">
            {place.price === 0 ? (
              // 🌿 واجهة المعلم المجاني
              <div className="bg-white border border-green-100 rounded-3xl p-6 shadow-md text-center">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
                  <MapPin size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">معلم مجاني للجميع 🌿</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  هذا المكان السياحي مفتوح للعامة ولا يتطلب حجز تذاكر مسبقة. يمكنك زيارته والاستمتاع به في أي وقت!
                </p>
                <Link
                  href={mapsHref}
                  target={hasCoords ? "_blank" : "_self"}
                  rel={hasCoords ? "noopener noreferrer" : undefined}
                  className="w-full bg-green-600 text-white p-4 rounded-xl font-black text-base hover:bg-green-700 transition shadow-md shadow-green-600/20 flex items-center justify-center gap-2"
                >
                  <MapPin size={20} /> عرض المسار والانطلاق
                </Link>
                {!hasCoords && (
                  <p className="text-[10px] text-amber-600 text-center mt-2">
                    لم يحدّد الشريك موقعاً دقيقاً لهذا المعلم بعد.
                  </p>
                )}
              </div>
            ) : (
              // 🎫 واجهة الحجز للمعلم المدفوع
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-md">
                <div className="flex justify-between items-baseline mb-6">
                  <span className="text-xs font-bold text-gray-400">سعر التذكرة</span>
                  <div>
                    <span className="text-2xl font-black text-gray-900">{place.price}</span>
                    <span className="text-xs font-bold text-gray-500 mr-1">د.ج / شخص</span>
                  </div>
                </div>

                <hr className="border-gray-100 my-4" />

                {/* محدد عدد التذاكر */}
                <div className="space-y-3 mb-6">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Users size={14} className="text-gray-400" /> عدد الأشخاص
                  </label>
                  <div className="flex items-center justify-between border border-gray-200 rounded-xl p-2 bg-gray-50">
                    <button 
                      onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                      className="w-10 h-10 rounded-lg bg-white border text-lg font-black text-gray-600 hover:bg-gray-100 flex items-center justify-center transition"
                    >
                      -
                    </button>
                    <span className="font-black text-gray-900 text-base">{ticketCount}</span>
                    <button 
                      onClick={() => setTicketCount(ticketCount + 1)}
                      className="w-10 h-10 rounded-lg bg-white border text-lg font-black text-gray-600 hover:bg-gray-100 flex items-center justify-center transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* الحساب الإجمالي */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-6 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>حساب التذاكر ({ticketCount})</span>
                    <span>{totalPrice} د.ج</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>رسوم الخدمة</span>
                    <span className="text-green-600 font-bold">مجانية 🎁</span>
                  </div>
                  <hr className="border-gray-200 my-2" />
                  <div className="flex justify-between font-black text-gray-900 text-base">
                    <span>المبلغ الإجمالي</span>
                    <span className="text-blue-600">{totalPrice} د.ج</span>
                  </div>
                </div>

                {/* زر تأكيد الحجز */}
                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white p-4 rounded-xl font-black text-base hover:bg-blue-700 transition shadow-md shadow-blue-600/10 flex items-center justify-center disabled:bg-gray-300"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : !isLoggedIn ? (
                    "سجل دخولك لتأكيد الحجز 🔐"
                  ) : (
                    "تأكيد الحجز وتوليد التذكرة 🚀"
                  )}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                  <ShieldCheck size={12} className="text-green-500" /> دفع آمن ونظام تذاكر رقمي
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 🕶️ النافذة المنبثقة للجولة الافتراضية */}
      {showTour && place.virtualTourUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative border border-gray-800">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
              <h3 className="text-white font-black text-sm flex items-center gap-2">🕶️ الجولة الافتراضية: {place.name}</h3>
              <button 
                onClick={() => setShowTour(false)}
                className="bg-red-500/20 text-red-400 font-black px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition text-xs"
              >
                إغلاق الجولة ✖
              </button>
            </div>
            <div className="w-full h-[500px] bg-black">
              <iframe 
                src={place.virtualTourUrl} 
                className="w-full h-full border-0"
                allowFullScreen
                allow="accelerometer; gyroscope; magnetometer"
              ></iframe>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">قم بالسحب بإصبعك أو حرك الفأرة للتنقل واستكشاف المكان بزاوية 360 درجة.</p>
        </div>
      )}
    </main>
  );
}

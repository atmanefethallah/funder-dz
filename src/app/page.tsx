import Link from "next/link";
import OnboardingTour from "@/components/OnboardingTour";
import nextDynamic from "next/dynamic"; // 👈 قمنا بتغيير الاسم هنا إلى nextDynamic لحل التعارض
import { Compass, Sparkles, Map, QrCode, Glasses, ShieldCheck, LayoutDashboard, LogIn } from "lucide-react";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import RecommendedPlaces from "@/components/RecommendedPlaces";

// 🚀 إجبار الصفحة على التحديث الديناميكي مع كل طلب لقراءة الكوكيز فوراً ومنع الوميض
export const dynamic = "force-dynamic";

// استدعاء مكون الخريطة بشكل ديناميكي (استخدمنا الاسم الجديد هنا)
const MapComponent = nextDynamic(() => import('@/components/InteractiveMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-gray-100 animate-pulse rounded-3xl flex items-center justify-center border-4 border-white shadow-lg">
      <span className="font-bold text-gray-400 text-lg flex items-center gap-2">
        <Map className="animate-bounce text-blue-400" /> جاري تحميل الخريطة...
      </span>
    </div>
  )
});

type PlaceRow = {
  id: string;
  name: string;
  category: string;
  price: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  isEvent: boolean | null;
  eventEndsAt: Date | null;
};

export default async function HomePage() {
  // 🔐 الجلسة الموقّعة من NextAuth — لا كوكي يدوي قابل للتزوير
  const sessionUser = await getSessionUser();
  const user = sessionUser
    ? { name: sessionUser.name, role: sessionUser.role }
    : null;
  const isLoggedIn = !!user;

  // 📥 جلب المعالم الحقيقية من قاعدة البيانات للخريطة
  // ⚠️ لا نترك خطأ اتصال قاعدة البيانات يُسقط الصفحة كاملة (Application error)؛
  // نعرض الصفحة بلا نقاط على الخريطة وسجل الخطأ في السيرفر لسهولة التتبع.
  let realPlaces: Array<{ id: string; name: string; category: string; price: number; latitude: number | null; longitude: number | null; imageUrl: string | null; isEvent: boolean | null; eventEndsAt: string | null }> = [];
  try {
    const rawPlaces = await query<PlaceRow>(
      `SELECT "id", "name", "category", "price", "latitude", "longitude", "imageUrl", "isEvent", "eventEndsAt"
       FROM "Place"
       WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL
         AND ("isEvent" IS NOT TRUE OR "eventEndsAt" IS NULL OR "eventEndsAt" > NOW())`, 
    );

    // تحويل Decimal إلى Number قبل التمرير لمكونات العميل (Client Components)
    realPlaces = rawPlaces.map((p) => ({ ...p, price: Number(p.price), eventEndsAt: p.eventEndsAt ? p.eventEndsAt.toISOString() : null }));
  } catch (error) {
    console.error("❌ فشل الاتصال بقاعدة البيانات في الصفحة الرئيسية:", error);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col selection:bg-blue-200">
      
      {/* 🌟 المرشد السياحي الذكي */}
      <OnboardingTour />

      {/* 🌟 القسم البطل (Hero Section) */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-32 pb-24 overflow-hidden z-10">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-100/50 blur-3xl"></div>
          <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-amber-100/40 blur-3xl"></div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold text-sm mb-8 shadow-sm">
          <Sparkles size={16} className="animate-pulse" /> المنصة السياحية الرائدة في مستغانم وقريباً كل الجزائر
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight max-w-4xl">
          اكتشف سحر السياحة مع <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Funder</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed">
          دليلك الرقمي الشامل. احجز تذاكرك بضغطة زر، استكشف المعالم عبر الخريطة التفاعلية، وعِش تجربة الواقع المعزز 360° كأنك هناك!
        </p>

        {/* 🎛️ أزرار التوجيه الديناميكية (تتغير حسب تسجيل الدخول والدور) */}
        <div className="flex flex-col items-center gap-4 w-full justify-center">
          {user ? (
            // ✅ واجهة المستخدم المسجل
            <div className="flex flex-col items-center gap-5 w-full">
              <p className="text-lg font-bold text-gray-600">
                مرحباً بك مجدداً، <span className="text-blue-600 font-black">{user.name}</span> 👋
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full">
                <Link href="/explore" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-lg shadow-blue-600/30">
                  <Compass size={24} /> استكشف المعالم
                </Link>
                
                {user.role === "PARTNER" && (
                  <Link href="/partner/bookings" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all">
                    <LayoutDashboard size={24} /> لوحتي كشريك
                  </Link>
                )}
                
                {user.role === "ADMIN" && (
                  <Link href="/admin/partner-requests" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-600/30">
                    <ShieldCheck size={24} /> لوحة الإدارة
                  </Link>
                )}
              </div>
            </div>
          ) : (
            // 👤 واجهة الزائر الجديد
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full">
              <Link href="/explore" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-lg shadow-blue-600/30">
                <Compass size={24} /> ابدأ الاستكشاف الآن
              </Link>
              <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-800 border-2 border-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:border-gray-300 hover:bg-gray-50 transition-all">
                <LogIn size={24} className="text-gray-500" /> تسجيل الدخول
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 🗺️ قسم الخريطة التفاعلية */}
      <section className="py-12 bg-transparent relative z-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">استكشف المعالم من الأعلى</h2>
            <p className="text-gray-500 max-w-xl mx-auto">تصفح المعالم القريبة، تحقق من أسعار التذاكر، واحجز وجهتك المفضلة مباشرة من الخريطة.</p>
          </div>
          
          <MapComponent places={realPlaces as any} isLoggedIn={isLoggedIn} />
        </div>
      </section>

      {/* 📊 مؤشرات ثقة سريعة تضيف وضوحاً وجمالية للواجهة الرئيسية */}
      <section className="relative z-10 px-4 pb-14">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl shadow-blue-900/5 backdrop-blur md:grid-cols-4 md:p-6">
          {[
            [String(realPlaces.length), "وجهة على الخريطة"],
            ["360°", "جولات افتراضية"],
            ["24/7", "حجز رقمي آمن"],
            ["QR", "تذاكر فورية"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-gradient-to-br from-gray-50 to-blue-50/60 p-4 text-center">
              <p className="text-2xl font-black text-blue-600">{value}</p>
              <p className="mt-1 text-xs font-bold text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ✨ قسم التوصيات المخصصة */}
      <RecommendedPlaces />

      {/* 🚀 قسم المميزات */}
      <section className="py-20 bg-white z-10 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">لماذا منصة Funder؟</h2>
            <p className="text-gray-500 max-w-xl mx-auto">جمعنا لك أحدث التقنيات العالمية لنقدم لك تجربة سياحية لا تُنسى.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><Map size={32} /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">خريطة تفاعلية</h3>
              <p className="text-gray-500 text-sm">استكشف كافة المعالم السياحية والمسالك المتاحة حولك عبر خريطة حية ومباشرة.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><QrCode size={32} /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">تذاكر رقمية (QR)</h3>
              <p className="text-gray-500 text-sm">وداعاً للطوابير! احجز تذكرتك وادفع من محفظتك واعرض كود الـ QR عند الدخول.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><Glasses size={32} /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">جولات 360° غامرة</h3>
              <p className="text-gray-500 text-sm">تجوّل داخل القلاع، المتاحف، والغابات افتراضياً قبل زيارتها على أرض الواقع.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><ShieldCheck size={32} /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">آمنة وموثوقة</h3>
              <p className="text-gray-500 text-sm">نظام إدارة مركزي، محفظة رقمية آمنة، وتقييمات حقيقية من السياح تضمن لك الجودة.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🏁 التذييل */}
      <section className="bg-gray-900 py-20 mt-auto z-10 relative">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">هل أنت مستعد لرحلتك القادمة؟</h2>
          <p className="text-gray-400 mb-10 text-lg">انضم إلى مئات السياح والشركاء الذين يثقون بمنصة Funder يومياً.</p>
          {!isLoggedIn && (
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-10 py-4 rounded-xl font-black text-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">
              إنشاء حساب مجاني
            </Link>
          )}
          <div className="mt-16 pt-8 border-t border-gray-800 text-gray-500 text-sm font-bold">
            © {new Date().getFullYear()} Funder Platform. 
          </div>
        </div>
      </section>

    </main>
  );
}

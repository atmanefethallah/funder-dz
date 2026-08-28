"use client";

import Link from "next/link";
import { Sparkles, QrCode, Wallet, Compass, UserPlus, ArrowLeft, ShieldCheck, MapPin } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col justify-between">
      
      {/* 🌌 قسم الـ Hero الرئيسي مع تأثير بصري خلفي */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-blue-600 py-24 text-center text-white px-4">
        {/* دوائر ضوئية جمالية في الخلفية */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="mx-auto max-w-3xl relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/30 border border-blue-400/30 px-4 py-1.5 text-sm font-bold text-yellow-300 mb-6 backdrop-blur-sm animate-pulse">
            <Sparkles size={16} /> المنصة السياحية الأولى في مستغانم
          </span>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
            سافر بذكاء، واستكشف <br />
            <span className="text-yellow-400">مستغانم</span> كما لم ترها من قبل!
          </h1>
          
          <p className="text-lg md:text-xl text-blue-100/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            انضم إلى آلاف السياح الذين يخططون لرحلاتهم برمجياً، ويدفعون بأمان عبر المحفظة الإلكترونية، ويستمتعون بمسارات حصرية وذكية تناسب ميزانياتهم.
          </p>

          {/* أزرار الحث السريع على التسجيل */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="flex items-center gap-2 w-full sm:w-auto justify-center rounded-full bg-yellow-400 px-8 py-4 text-lg font-black text-blue-950 shadow-xl shadow-yellow-500/10 transition hover:bg-yellow-300 hover:scale-105">
              <UserPlus size={20} /> أنشئ حسابك مجاناً الآن
            </Link>
            <Link href="/" className="flex items-center gap-2 w-full sm:w-auto justify-center rounded-full bg-white/10 border border-white/20 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition hover:bg-white/20">
              تصفح كزائر أولاً <ArrowLeft size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* 🚀 قسم الإقناع والمميزات السحرية الأربعة */}
      <div className="mx-auto -mt-12 max-w-5xl px-4 relative z-20 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* الميزة 1 */}
          <div className="rounded-2xl border bg-white p-6 shadow-xl shadow-gray-200/50 flex flex-col items-start transition hover:-translate-y-1">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 mb-4">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">الخطة الذكية بضغطة زر</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              أدخل ميزانيتك ونوع أجوائك المفضلة، وسيقوم النظام بتوليد مسار سياحي متكامل يناسب جيبك تلقائياً.
            </p>
          </div>

          {/* الميزة 2 */}
          <div className="rounded-2xl border bg-white p-6 shadow-xl shadow-gray-200/50 flex flex-col items-start transition hover:-translate-y-1">
            <div className="rounded-xl bg-green-50 p-3 text-green-600 mb-4">
              <Wallet size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">احجز بـ عربون 10%</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              لا داعي لدفع المبالغ كاملة مسبقاً! ادفع 10% فقط لتأكيد تذكرتك برمجياً، وسدّد الباقي عند وصولك للمكان.
            </p>
          </div>

          {/* الميزة 3 */}
          <div className="rounded-2xl border bg-white p-6 shadow-xl shadow-gray-200/50 flex flex-col items-start transition hover:-translate-y-1">
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600 mb-4">
              <QrCode size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">تذاكر QR مشفرة ومحمية</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              تذاكرك محفوظة في جيبك كصورة QR كود معتمدة، يتم مسحها وتأكيدها برمجياً عند بوابات الدخول لمنع التزوير.
            </p>
          </div>

          {/* الميزة 4 */}
          <div className="rounded-2xl border bg-white p-6 shadow-xl shadow-gray-200/50 flex flex-col items-start transition hover:-translate-y-1">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600 mb-4">
              <Compass size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">تجارب واقع معزز حصري</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              احصل على أدلة صوتية وقصص تاريخية حية ومعلومات غنية لكل معلم تزوره داخل ولاية مستغانم الساحرة.
            </p>
          </div>

        </div>
      </div>

      {/* 👥 شاشات حث مخصصة حسب نوع المستخدم (سائح ضد شريك) */}
      <div className="mx-auto max-w-5xl px-4 mb-24 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-800">اختر نوع حسابك وانطلق معنا</h2>
          <p className="text-sm text-gray-500 mt-1">نوفر تجارب مخصصة لكل فئة لضمان أعلى مستويات الفائدة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* كرت السائح */}
          <div className="rounded-2xl border bg-gradient-to-br from-white to-blue-50/30 p-8 shadow-sm flex flex-col justify-between items-start group hover:border-blue-300 transition">
            <div>
              <div className="bg-blue-600 text-white rounded-full px-3 py-1 text-xs font-bold w-max mb-4">
                حساب سياحي مخصص
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-3">أنا زائر / سائح</h3>
              <ul className="text-sm text-gray-600 space-y-2 mb-8">
                <li className="flex items-center gap-2">✅ شحن سريع للمحفظة عبر بريدي موب / CCP</li>
                <li className="flex items-center gap-2">✅ توليد فوري للخطط الذكية وحجز التذاكر بالعربون</li>
                <li className="flex items-center gap-2">✅ تحميل التذاكر كصورة والوصول السريع بدون طوابير</li>
              </ul>
            </div>
            <Link href="/register" className="w-full text-center rounded-xl bg-blue-600 p-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md">
              التسجيل كـ سائح مستكشف
            </Link>
          </div>

          {/* كرت الشريك */}
          <div className="rounded-2xl border bg-gradient-to-br from-white to-yellow-50/20 p-8 shadow-sm flex flex-col justify-between items-start group hover:border-yellow-400 transition">
            <div>
              <div className="bg-yellow-500 text-blue-950 rounded-full px-3 py-1 text-xs font-bold w-max mb-4">
                حساب تجاري استثماري
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-3">أنا صاحب معلم / مستثمر</h3>
              <ul className="text-sm text-gray-600 space-y-2 mb-8">
                <li className="flex items-center gap-2">✅ إضافة معالمك، فعالياتك ومطاعمك مجاناً للمنصة</li>
                <li className="flex items-center gap-2">✅ لوحة تحكم ذكية لقبول ورفض الحجوزات وإدارة الأرباح</li>
                <li className="flex items-center gap-2">✅ تطبيق كاميرا مدمج (Scanner) لمسح تذاكر الزوار برمجياً</li>
              </ul>
            </div>
            <Link href="/register" className="w-full text-center rounded-xl bg-gray-900 p-3 text-sm font-bold text-white transition hover:bg-gray-800 shadow-md">
              التسجيل كـ شريك مروّج
            </Link>
          </div>

        </div>

        {/* ضمان الأمان */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-bold bg-white border rounded-xl p-3 max-w-md mx-auto shadow-sm">
          <ShieldCheck size={16} className="text-green-500" />
          <span>بياناتك وحسابك محمي وتخضع المنصة لشروط حماية المستهلك الجزائري</span>
        </div>
      </div>

    </div>
  );
}

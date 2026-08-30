"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Sparkles, Heart, User, Plus, LayoutDashboard, ScanLine, MapPin, ShieldCheck, Megaphone, UserCheck } from "lucide-react";

export default function BottomNav({ userRole }: { userRole?: string | null }) {
  const pathname = usePathname();

  // 🛑 إخفاء الشريط في صفحات الدخول والتسجيل، ولغير الآدمن في صفحات الإدارة
  if (pathname === "/login" || pathname === "/register" || (pathname.startsWith("/admin") && userRole !== "ADMIN")) {
    return null;
  }

  // 👑 1. تصميم شريط التحكم السيادي والخاص بالمسؤول (ADMIN) 👑
  if (userRole === "ADMIN") {
    return (
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-gray-950 border-t border-gray-800 flex justify-around items-center px-2 pb-safe md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" dir="rtl">
        
        {/* أقصى اليمين: ملف الإدارة (حيث توجد طلبات الشحن والمحفظة) */}
        <Link href="/profile" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/profile" ? "text-red-500" : "text-gray-500 hover:text-gray-400"}`}>
          <User size={22} className={pathname === "/profile" ? "fill-red-500/10" : ""} />
          <span className="text-[10px] font-bold">حسابي</span>
        </Link>

        {/* يمين الوسط: طلبات اعتماد الشركاء (بدلاً من المستخدمين) */}
        <Link href="/admin/partner-requests" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/admin/partner-requests" ? "text-red-500" : "text-gray-500 hover:text-gray-400"}`}>
          <UserCheck size={22} />
          <span className="text-[10px] font-bold">طلبات الشركاء</span>
        </Link>

        {/* 🚨 المنتصف: الإدارة المركزية (زر عائم سيادي مضيء بالأحمر) 🚨 */}
        <Link href="/admin" className="relative flex flex-col items-center justify-center w-full h-full group -mt-6">
          <div className="absolute inset-0 bg-red-600/20 rounded-full blur-xl animate-pulse"></div>
          <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 to-gray-900 border-[3px] border-gray-950 shadow-[0_8px_20px_rgba(220,38,38,0.3)] text-white transition-transform active:scale-95 ${pathname === "/admin" ? "ring-2 ring-red-500 ring-offset-2 ring-offset-gray-950" : ""}`}>
            <ShieldCheck size={26} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black text-red-500 mt-1">التحكم المركزي</span>
        </Link>

        {/* يسار الوسط: بث إعلان مباشر للسياح (بدلاً من طلبات الشحن) */}
        <Link href="/admin/notifications" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/admin/broadcast" ? "text-red-500" : "text-gray-500 hover:text-gray-400"}`}>
          <Megaphone size={22} className={pathname === "/admin/notifications" ? "fill-red-500/10" : ""} />
          <span className="text-[10px] font-bold">بث إعلان</span>
        </Link>

        {/* أقصى اليسار: مراقبة واستكشاف كل المعالم */}
        <Link href="/explore" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/explore" ? "text-red-500" : "text-gray-500 hover:text-gray-400"}`}>
          <MapPin size={22} />
          <span className="text-[10px] font-bold">كل المعالم</span>
        </Link>

      </div>
    );
  }

  // 👔 2. تصميم الشريط السفلي الخاص بالشريك (PARTNER) 👔
  if (userRole === "PARTNER") {
    return (
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-100 flex justify-around items-center px-2 pb-safe md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.08)]" dir="rtl">
        <Link href="/profile" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/profile" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
          <User size={22} className={pathname === "/profile" ? "fill-blue-100" : ""} />
          <span className="text-[10px] font-bold">حسابي</span>
        </Link>

        <Link href="/explore" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/explore" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
          <MapPin size={22} className={pathname === "/explore" ? "fill-blue-100" : ""} />
          <span className="text-[10px] font-bold">معالمي</span>
        </Link>

        <Link href="/add-place" className="relative flex flex-col items-center justify-center w-full h-full group -mt-6">
          <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-xl"></div>
          <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 border-[3px] border-white shadow-[0_8px_15px_rgba(37,99,235,0.3)] text-white transition-transform active:scale-95 ${pathname === "/add-place" ? "ring-2 ring-blue-300 ring-offset-2" : ""}`}>
            <Plus size={28} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-black text-blue-600 mt-1">إضافة معلم</span>
        </Link>

        <Link href="/partner" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/partner" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
          <ScanLine size={22} />
          <span className="text-[10px] font-bold">الماسح</span>
        </Link>

        <Link href="/partner/bookings" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/partner/bookings" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
          <LayoutDashboard size={22} className={pathname === "/partner/bookings" ? "fill-blue-100" : ""} />
          <span className="text-[10px] font-bold">لوحتي</span>
        </Link>
      </div>
    );
  }

  // 🎒 3. تصميم الشريط السفلي الخاص بالسياح والزوار (TOURIST / GUEST) 🎒
  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-100 flex justify-around items-center px-2 pb-safe md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.08)]" dir="rtl">
      <Link href="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
        <Home size={22} className={pathname === "/" ? "fill-blue-100" : ""} />
        <span className="text-[10px] font-bold">الرئيسية</span>
      </Link>

      <Link href="/explore" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/explore" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
        <Compass size={22} className={pathname === "/explore" ? "fill-blue-100" : ""} />
        <span className="text-[10px] font-bold">استكشاف</span>
      </Link>

      <Link href="/smart-plan" className="relative flex flex-col items-center justify-center w-full h-full group -mt-6">
        <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-pulse"></div>
        <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-[3px] border-white shadow-[0_0_15px_rgba(251,191,36,0.6)] text-amber-950 transition-transform active:scale-95 ${pathname === "/smart-plan" ? "ring-2 ring-amber-300 ring-offset-2" : ""}`}>
          <Sparkles size={24} className="fill-white/40" />
        </div>
        <span className="text-[10px] font-black text-amber-600 mt-1">الخطة الذكية</span>
      </Link>

      <Link href="/wishlist" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/wishlist" ? "text-red-500" : "text-gray-400 hover:text-gray-600"}`}>
        <Heart size={22} className={pathname === "/wishlist" ? "fill-red-100" : ""} />
        <span className="text-[10px] font-bold">المفضلة</span>
      </Link>

      <Link href="/profile" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/profile" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
        <User size={22} className={pathname === "/profile" ? "fill-blue-100" : ""} />
        <span className="text-[10px] font-bold">حسابي</span>
      </Link>
    </div>
  );
}

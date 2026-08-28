import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { User, Wallet, Map, PlusCircle, Heart, LayoutDashboard, Compass, Crown } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import LogoutButton from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Navbar() {
  // 🔐 الجلسة الموقّعة من NextAuth فقط — لا كوكي يدوي قابل للتزوير
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user;

  let balance = 0;
  if (sessionUser?.id) {
    const dbUser = await queryOne<{ balance: string }>(
      `SELECT "balance" FROM "User" WHERE "id" = $1`,
      [sessionUser.id],
    );
    balance = dbUser ? Number(dbUser.balance) : 0;
  }

  const user = sessionUser
    ? { name: sessionUser.name, role: sessionUser.role, balance }
    : null;

  return (
    <>
      {/* 🖥️ شريط التنقل العلوي */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b bg-white px-4 py-3 md:px-6 md:py-4 shadow-sm">

        {/* الشعار */}
        <Link href={user ? "/explore" : "/"} className="text-xl md:text-2xl font-black text-blue-600 tracking-tight">
          Funder
        </Link>

        {/* روابط المنتصف (تختفي في الهاتف) */}
        <div className="hidden md:flex gap-6">
          <Link href="/explore" className="flex items-center gap-2 text-lg font-bold text-gray-700 hover:text-blue-600 transition">
            <Map className="h-5 w-5" /> المعالم والمسالك
          </Link>
          <Link href="/pricing" className="flex items-center gap-2 text-lg font-bold text-amber-600 hover:text-amber-700 transition">
            <Crown className="h-5 w-5" /> الباقات
          </Link>
        </div>

        {/* الأزرار العلوية */}
        <div className="flex items-center gap-3 md:gap-4">
          {user ? (
            <>
              {/* 🌙 مبدّل الوضع الليلي */}
              <ThemeToggle />

              {/* 🔔 جرس الإشعارات */}
              <NotificationBell />

              {/* 💰 الرصيد */}
              <Link href="/wallet" className="flex items-center gap-1.5 md:gap-2 rounded-full bg-blue-50 px-3 py-1.5 md:px-4 md:py-2 text-blue-600 font-bold transition hover:bg-blue-100 border border-blue-100">
                <span dir="ltr" className="text-sm md:text-base">
                  {user.balance.toLocaleString("en-DZ")} د.ج
                </span>
                <Wallet size={16} className="md:w-5 md:h-5" />
              </Link>

              {/* 👑 أزرار الشريك (في الحاسوب فقط) */}
              {user.role === "PARTNER" && (
                <div className="hidden md:flex items-center gap-3">
                  <Link href="/partner-dashboard" className="flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-blue-600 transition">
                    <LayoutDashboard size={16} /> لوحتي
                  </Link>
                  <Link href="/add-place" className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline">
                    <PlusCircle size={16} /> إضافة معلم
                  </Link>
                </div>
              )}

              {/* أزرار الحساب للحاسوب */}
              <div className="hidden md:flex items-center gap-3 border-l-2 border-gray-100 pl-3 ml-1">
                {user.role === "TOURIST" && (
                  <Link href="/wishlist" className="rounded-full bg-red-50 p-2 text-red-500 transition hover:bg-red-100 hover:scale-105 border border-red-100 shadow-sm" aria-label="المفضلة">
                    <Heart size={20} className="fill-red-500" />
                  </Link>
                )}

                <LogoutButton variant="desktop" />

                <Link href="/profile" className="rounded-full bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200" aria-label="حسابي">
                  <User size={20} />
                </Link>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 md:gap-4">
              <ThemeToggle />
              <Link href="/login" className="text-sm md:text-base font-bold text-blue-600 hover:underline">دخول</Link>
              <Link href="/register" className="rounded-lg bg-blue-600 px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base font-bold text-white transition hover:bg-blue-700">حساب جديد</Link>
            </div>
          )}
        </div>
      </nav>

      {/* 📱 شريط التنقل السفلي — يظهر فقط في الهاتف */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-2 pt-2 h-16 shadow-[0_-10px_25px_rgba(0,0,0,0.05)] rounded-t-3xl">
          <div className="relative flex items-center justify-between px-6 h-full">

            {/* الجزء الأيمن */}
            <div className="flex items-center w-1/3 justify-start">
              {user.role === "TOURIST" && (
                <Link href="/wishlist" className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 transition active:scale-95">
                  <Heart size={24} />
                  <span className="text-[10px] font-bold">مفضلتي</span>
                </Link>
              )}

              {user.role === "PARTNER" && (
                <Link href="/partner-dashboard" className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition active:scale-95">
                  <LayoutDashboard size={24} />
                  <span className="text-[10px] font-bold">لوحتي</span>
                </Link>
              )}
            </div>

            {/* 🌟 الزر العائم في المنتصف */}
            <div className="absolute left-1/2 -top-6 -translate-x-1/2 flex flex-col items-center">
              <Link
                href="/explore"
                className="flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-full shadow-[0_8px_20px_rgba(37,99,235,0.4)] border-4 border-white text-white hover:scale-105 active:scale-95 transition-all"
                aria-label="استكشاف"
              >
                <Compass size={28} />
              </Link>
              <span className="text-[10px] font-bold text-blue-600 mt-1">استكشاف</span>
            </div>

            {/* الجزء الأيسر */}
            <div className="flex items-center w-1/3 justify-end gap-6">
              <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition active:scale-95">
                <User size={24} />
                <span className="text-[10px] font-bold">حسابي</span>
              </Link>

              <LogoutButton variant="mobile" />
            </div>

          </div>
        </div>
      )}
    </>
  );
}

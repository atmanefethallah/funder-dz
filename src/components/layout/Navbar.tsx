import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { User, Wallet, Map, PlusCircle, Heart, LayoutDashboard, Crown } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import LogoutButton from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Navbar() {
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

  const user = sessionUser ? { role: sessionUser.role, balance } : null;

  return (
    <nav className="sticky top-0 z-50 flex min-h-16 items-center justify-between border-b bg-white/95 px-3 py-3 shadow-sm backdrop-blur md:px-6">
      <Link href={user ? "/explore" : "/"} className="shrink-0 text-xl font-black tracking-tight text-blue-600 md:text-2xl touch-manipulation">
        Funder
      </Link>

      <div className="hidden items-center gap-6 md:flex">
        <Link href="/explore" className="flex items-center gap-2 text-base font-bold text-gray-700 transition-colors hover:text-blue-600 touch-manipulation">
          <Map className="h-5 w-5" /> المعالم والمسالك
        </Link>
        <Link href="/pricing" className="flex items-center gap-2 text-base font-bold text-amber-600 transition-colors hover:text-amber-700 touch-manipulation">
          <Crown className="h-5 w-5" /> الباقات
        </Link>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 md:gap-3">
        {user ? (
          <>
            <div className="hidden sm:block"><ThemeToggle /></div>
            <NotificationBell />

            <Link href="/wallet" aria-label="المحفظة" className="flex shrink-0 items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-2 font-bold text-blue-600 transition-colors hover:bg-blue-100 md:px-4 touch-manipulation">
              <span dir="ltr" className="hidden text-sm sm:inline">{user.balance.toLocaleString("en-DZ")} د.ج</span>
              <Wallet size={18} />
            </Link>

            {user.role === "PARTNER" && (
              <div className="hidden items-center gap-3 lg:flex">
                <Link href="/partner-dashboard" className="flex items-center gap-1 text-sm font-bold text-gray-600 transition-colors hover:text-blue-600 touch-manipulation"><LayoutDashboard size={16} /> لوحتي</Link>
                <Link href="/add-place" className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline touch-manipulation"><PlusCircle size={16} /> إضافة معلم</Link>
              </div>
            )}

            <div className="hidden items-center gap-2 border-r border-gray-100 pr-2 md:flex">
              {user.role === "TOURIST" && (
                <Link href="/wishlist" className="rounded-full border border-red-100 bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100" aria-label="المفضلة"><Heart size={19} className="fill-red-500" /></Link>
              )}
              <Link href="/profile" className="rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200" aria-label="حسابي"><User size={19} /></Link>
            </div>

            {/* أيقونة خروج واحدة وثابتة في أقصى شريط التنقل، ظاهرة في الهاتف والحاسوب */}
            <LogoutButton variant="desktop" />
          </>
        ) : (
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-bold text-blue-600 hover:underline md:text-base touch-manipulation">دخول</Link>
            <Link href="/register" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 md:px-4 md:text-base touch-manipulation">حساب جديد</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

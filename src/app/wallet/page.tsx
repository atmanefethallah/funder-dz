// src/app/wallet/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { redirect } from "next/navigation";
import TopUpForm from "@/components/wallet/TopUpForm";
import { Wallet, CreditCard, History, ArrowDownLeft, ArrowUpRight, Ticket, Coins, Percent, RefreshCcw, ShieldCheck, Star } from "lucide-react";

// 🚀 إجبار الصفحة على التحديث الديناميكي لضمان عمل الجلسات
export const dynamic = "force-dynamic";

// خريطة أنواع العمليات إلى عناوين وأيقونات
const TX_META: Record<string, { label: string; icon: any }> = {
  VOUCHER_TOPUP: { label: "شحن بقسيمة", icon: Ticket },
  RECHARGE_TOPUP: { label: "شحن عبر وصل", icon: Coins },
  BOOKING_DEPOSIT: { label: "عربون حجز", icon: Percent },
  BOOKING_REFUND: { label: "استرداد عربون", icon: RefreshCcw },
  PARTNER_EARNING: { label: "أرباح من حجز", icon: ShieldCheck },
  PARTNER_REFUND_DEDUCTION: { label: "خصم استرداد", icon: RefreshCcw },
  ADMIN_ADJUSTMENT: { label: "اشتراك / تعديل", icon: Star },
};

type WalletTransactionRow = {
  id: string;
  type: string;
  direction: string;
  amount: string;
  reference: string | null;
  note: string | null;
  createdAt: Date;
};

export default async function WalletPage() {
  // 1. التحقق من جلسة المستخدم
  const session = await getServerSession(authOptions);

  if (!(session?.user as any)?.id) {
    redirect("/login");
  }

  const userId = session!.user!.id;

  // 2. جلب الرصيد + أحدथ 20 عملية من دفتر الأستاذ بالتوازي
  const [user, transactions] = await Promise.all([
    queryOne<{ balance: string; name: string }>(
      `SELECT "balance", "name" FROM "User" WHERE "id" = $1`,
      [userId],
    ),
    query<WalletTransactionRow>(
      `SELECT * FROM "WalletTransaction" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 20`,
      [userId],
    ),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8 px-4" dir="rtl">

      {/* رأس الصفحة يعرض الرصيد الحالي */}
      <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2 opacity-80">
            <Wallet size={20} />
            <span className="text-sm font-medium">الرصيد الحالي</span>
          </div>
          <div className="flex items-end gap-2">
            <h1 className="text-5xl font-extrabold tracking-tight">
              {Number(user?.balance ?? 0).toLocaleString("en-DZ")}
            </h1>
            <span className="mb-1 text-xl text-gray-300">د.ج</span>
          </div>
          <p className="mt-4 text-sm text-gray-400">مرحباً بك يا {user?.name}، رصيدك جاهز لحجز التذاكر.</p>
        </div>
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl"></div>
      </div>

      {/* نموذج شحن الرصيد — الهوية تُؤخذ من الجلسة في الخادم */}
      <TopUpForm />

      {/* 📒 سجل العمليات الحقيقي من دفتر الأستاذ */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-full bg-green-100 p-2 text-green-600"><History size={18} /></div>
          <h3 className="text-lg font-bold text-gray-900">سجل العمليات</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <History size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">لا توجد عمليات بعد. اشحن رصيدك أو اجز تذكرة لترى سجلك هنا.</p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-50">
            {transactions.map((t) => {
              const meta = TX_META[t.type] || { label: t.type, icon: History };
              const Icon = meta.icon;
              const isCredit = t.direction === "CREDIT";
              const amount = Number(t.amount);
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`rounded-full p-2 shrink-0 ${isCredit ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                      {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                        <Icon size={13} className="opacity-50" /> {meta.label}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {t.note || t.reference || "—"} · {new Date(t.createdAt).toLocaleDateString("ar-DZ", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <span dir="ltr" className={`text-sm font-black shrink-0 ${isCredit ? "text-green-600" : "text-red-500"}`}>
                    {isCredit ? "+" : "-"}{amount.toLocaleString("en-DZ")} د.ج
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ميزة قادمة */}
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center gap-4 rounded-2xl border bg-gray-50 p-4 opacity-70">
          <div className="rounded-full bg-blue-100 p-3 text-blue-600"><CreditCard size={20} /></div>
          <div>
            <h4 className="font-bold text-gray-800">البطاقة الذهبية</h4>
            <p className="text-xs text-gray-500">قريباً عبر SATIM — الدفع المباشر بالبطاقة</p>
          </div>
        </div>
      </div>
    </div>
  );
}

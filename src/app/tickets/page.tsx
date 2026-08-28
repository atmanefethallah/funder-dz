// src/app/tickets/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import TicketCard from "@/components/Booking/TicketCard";
import { Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

type TicketRow = {
  id: string;
  qrToken: string;
  status: string;
  createdAt: Date;
  place_name: string;
  place_category: string | null;
};

export default async function MyTicketsPage() {
  const session = await getServerSession(authOptions);
  
  // 🛡️ 1. تأمين الجلسة وتجاوز فحص الأنواع الصارم لمكتبة NextAuth
  if (!(session?.user as any)?.id) {
    redirect("/login");
  }

  // استخراج الـ ID بشكل آمن لتجنب خطأ (possibly 'null')
  const userId = (session!.user as any).id;

  // 🚀 2. جلب الحجوزات مع بيانات المعلم المرتبط بالحجز
  const tickets = await query<TicketRow>(
    `SELECT b."id", b."qrToken", b."status", b."createdAt", p."name" AS place_name, p."category" AS place_category
     FROM "Booking" b
     JOIN "Place" p ON p."id" = b."placeId"
     WHERE b."userId" = $1
     ORDER BY b."createdAt" DESC`,
    [userId],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8 px-4" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-indigo-100 p-3 text-indigo-600">
          <Ticket size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تذاكري وحجوزاتي</h1>
          <p className="text-sm text-gray-500">أظهر رمز الـ QR عند بوابة الدخول.</p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-500 font-medium">
          لم تقم بحجز أي تذاكر بعد. استكشف المعالم المتاحة في مستगانم وبادر بالحجز! 🌟
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {tickets.map((ticket) => (
            <TicketCard 
              key={ticket.id}
              // 🔄 3. تمرير البيانات الصحيحة لتجنب أي أخطاء في البطاقة
              eventName={ticket.place_name} // اسم المعلم
              placeName={ticket.place_category || "وجهة سياحية"} // فئة المعلم
              date={ticket.createdAt} // تاريخ الحجز
              qrHash={ticket.qrToken} // رمز QR السري العشوائي — لا معرف الحجز
              status={ticket.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// src/app/partner/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import QRScanner from "@/components/partner/QRScanner";
import Link from "next/link";
import { ScanLine, LayoutDashboard } from "lucide-react";

export default async function PartnerDashboard() {
  const session = await getServerSession(authOptions);

  // حماية الصفحة: طرد أي شخص ليس شريكاً
  if (!session || (session.user as any).role === "TOURIST") {
    redirect("/"); 
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 px-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-3 text-blue-600">
            <ScanLine size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم المنظمين</h1>
            <p className="text-sm text-gray-500">مرحباً {session.user?.name}، يمكنك التحقق من التذاكر من هنا.</p>
          </div>
        </div>
        <Link href="/partner-dashboard" className="flex items-center gap-2 bg-gray-900 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-800 transition">
          <LayoutDashboard size={16} /> لوحة تحكمي الكاملة
        </Link>
      </div>

      {/* استدعاء مكون كاميرا المسح الضوئي */}
      <QRScanner />
    </div>
  );
}

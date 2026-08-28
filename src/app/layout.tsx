import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/BottomNav";
import { getSessionUser } from "@/lib/session";
import { ToastProvider } from "@/components/ui/Toast";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const cairo = Cairo({ subsets: ["latin", "arabic"] });

export const metadata: Metadata = {
  title: "Funder - منصتك السياحية",
  description: "اكتشف واحجز أفضل المعالم السياحية في مستغانم",
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 🔐 الدور من جلسة NextAuth الموقّعة (JWT) — لا كوكي يدوي، ولا استعلام قاعدة بيانات هنا
  const sessionUser = await getSessionUser();
  const userRole = sessionUser?.role ?? null;

  return (
    <html lang="ar" dir="rtl">
      <head></head>
      <body className={`${cairo.className} pb-16 md:pb-0`}>
        <ServiceWorkerRegister />
        <ToastProvider>
          {/* شريط التنقل العلوي */}
          <Navbar />

          {children}

          {/* الشريط السفلي — يتغير حسب الدور */}
          <BottomNav userRole={userRole} />
        </ToastProvider>

      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Script from "next/script";
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
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          .goog-te-banner-frame.skiptranslate,
          .skiptranslate > iframe {
            display: none !important;
          }

          body {
            top: 0px !important;
            position: relative !important;
          }

          #google_translate_element {
            overflow: hidden !important;
            border-radius: 9999px !important;
            border: 2px solid #3b82f6 !important;
            background-color: #ffffff !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
            display: inline-flex !important;
            align-items: center !important;
            transition: all 0.3s ease !important;
          }

          #google_translate_element:hover {
            border-color: #1d4ed8 !important;
            box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2) !important;
          }

          .goog-te-gadget {
            font-size: 0px !important;
            color: transparent !important;
            display: flex !important;
          }
          .goog-te-gadget img,
          .goog-logo-link,
          .goog-te-gadget > span > a {
            display: none !important;
          }

          select.goog-te-combo {
            padding: 8px 16px !important;
            border: none !important;
            background-color: transparent !important;
            color: #1e40af !important;
            font-weight: 800 !important;
            font-size: 14px !important;
            cursor: pointer !important;
            outline: none !important;
            margin: 0 !important;
            font-family: inherit !important;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
          }
        `}} />
      </head>
      <body className={`${cairo.className} pb-16 md:pb-0`}>
        <ServiceWorkerRegister />
        <ToastProvider>
          {/* شريط التنقل العلوي */}
          <Navbar />

        {/* 🌐 أداة الترجمة — مؤقتة حتى يُفعَّل next-intl رسمياً (انظر خارطة الطريق P1) */}
        <div className="fixed top-24 left-4 z-[9999]">
          <div id="google_translate_element"></div>
        </div>

        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'ar',
                includedLanguages: 'ar,en,fr,es,de,it,zh-CN,ru',
                autoDisplay: false
              }, 'google_translate_element');
            }
          `}
        </Script>

          {children}

          {/* الشريط السفلي — يتغير حسب الدور */}
          <BottomNav userRole={userRole} />
        </ToastProvider>

      </body>
    </html>
  );
}

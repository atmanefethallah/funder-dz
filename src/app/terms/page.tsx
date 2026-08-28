"use client";

import { useState } from "react";
import { ShieldCheck, FileText, ArrowRight, Wallet, Lock, ShieldAlert, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function TermsAndPrivacyPage() {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-12">
      {/* الترويسة العلوية */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white py-12 px-4 text-center shadow-md">
        <h1 className="text-3xl font-black mb-2">الاتفاقيات القانونية والخصوصية</h1>
        <p className="text-blue-100 text-sm max-w-md mx-auto">
          يرجى قراءة شروط الاستخدام سياسة الخصوصية الخاصة بمنصة Funder بعناية لضمان تجربة آمنة لجميع الأطراف.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8">
        {/* أزرار التبديل التفاعلية */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("terms")}
            className={`flex-1 py-3 flex justify-center items-center gap-2 rounded-xl font-bold text-sm transition ${
              activeTab === "terms" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <FileText size={18} /> شروط الاستخدام
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex-1 py-3 flex justify-center items-center gap-2 rounded-xl font-bold text-sm transition ${
              activeTab === "privacy" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <ShieldCheck size={18} /> سياسة الخصوصية
          </button>
        </div>

        {/* محتوى شروط الاستخدام */}
        {activeTab === "terms" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 animate-in fade-in duration-200 leading-relaxed text-gray-700 space-y-6">
            <h2 className="text-xl font-black text-gray-900 border-b pb-2 flex items-center gap-2">
              <ShieldAlert className="text-blue-600" size={22} /> شروط استخدام المنصة
            </h2>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">1. طبيعة الحسابات الصلاحيات</h3>
              <p className="text-sm text-gray-600">
                تنقسم الحسابات في منصة Funder إلى حساب (سائح) وحساب (شريك مروّج). يتعهد المستخدم بتقديم معلومات حقيقية عند التسجيل (الاسم الكامل ورقم الهاتف) ويتحمل الشريك المسؤولية الكاملة عن صحة المعالم والأسعار التي يرفعها.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">2. النظام المالي والمحفظة الرقمية</h3>
              <p className="text-sm text-gray-600">
                تقوم المنصة بتوفير محفظة افتراضية بالدينار الجزائري (د.ج). عند طلب شحن الرصيد يتعهد المستخدم بإرسال وصل دفع حقيقي ورقم عملية صحيح تابع لمكتب البريد (BaridiMob/CCP) أو البنك. أي محاولة لتكرار رقم عملية مستخدم مسبقاً أو تزوير وصل دفع تعتبر **جريمة احتيال مالي** تؤدي لحظر الحساب نهائياً والملاحقة القانونية.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">3. سياسة الحجوزات والعربون (10%)</h3>
              <p className="text-sm text-gray-600">
                يتم تأكيد الحجوزات عبر خصم عربون قيمته 10% من سعر المعلم من محفظة السائح. في حال تم إلغاء أو رفض الحجز من قبل الشريك المروّج، يتم إرجاع قيمة العربون تلقائياً وبشكل فوري لمحفظة السائح.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">4. تذاكر QR Code وبوابات الدخول</h3>
              <p className="text-sm text-gray-600">
                عند قبول الحجز، يمنح السائح تذكرة رقمية مشفرة برمز QR. التذكرة صالحة للاستخدام **لمرة واحدة فقط** ويتم فحصها عند بوابة المعلم بواسطة ماسح الشريك. لا تتحمل المنصة مسؤولية ضياع التذكرة أو مشاركتها مع أطراف أخرى.
              </p>
            </div>
          </div>
        )}

        {/* محتوى سياسة الخصوصية */}
        {activeTab === "privacy" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 animate-in fade-in duration-200 leading-relaxed text-gray-700 space-y-6">
            <h2 className="text-xl font-black text-gray-900 border-b pb-2 flex items-center gap-2">
              <Lock className="text-blue-600" size={22} /> سياسة حماية بيانات المستخدمين
            </h2>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">1. البيانات التي نجمعها</h3>
              <p className="text-sm text-gray-600">
                نجمع البيانات الأساسية الضرورية لتقديم الخدمات السياحية والتأكيدات المالية وتشمل: الاسم الكامل، البريد الإلكتروني، كلمة المرور المشفرة، رقم الهاتف، وصور وصولات الدفع للعمليات المالية.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">2. مشاركة البيانات مع الشركاء</h3>
              <p className="text-sm text-gray-600">
                لحماية السياح وتأمين التنقل، تظهر المنصة **رقم هاتف السائح واسمه** للشريك المروّج المسؤول عن المعلم المحجوز **فقط بعد تأكيد الحجز**، وذلك لتمكين التواصل والتنسيق المباشر عند الضرورة. ولا يتم بيع أو مشاركة البيانات مع أي أطراف إعلانية خارجية.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">3. أمن الملفات المرفوعة</h3>
              <p className="text-sm text-gray-600">
                يتم فحص وتحليل كافة صور وصولات الدفع قبل تخزينها للتأكد من خلوها من أي برمجيات خبيثة ولضمان عدم تجاوز الحجم المسموح به (5 ميجابايت). تُخزن البيانات بشكل آمن ومحمي بالكامل داخل قواعد بياناتنا المشفرة.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">4. تعديل وحذف البيانات</h3>
              <p className="text-sm text-gray-600">
                يملك المستخدم الحق الكامل في تعديل بياناته الشخصية (مثل الاسم ورقم الهاتف) في أي وقت من خلال صفحة الملف الشخصي لضمان دقة التواصل مع إدارة المنصة والشركاء المروجين.
              </p>
            </div>
          </div>
        )}

        {/* زر العودة الذكي للموبايل */}
        <div className="mt-8 text-center">
          <Link href="/register" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline">
            <ArrowRight size={16} /> العودة لصفحة التسجيل
          </Link>
        </div>
      </div>
    </div>
  );
}

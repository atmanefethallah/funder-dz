"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Briefcase, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  
  // حالات تخزين بيانات النموذج
  const [role, setRole] = useState("TOURIST");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAgreed, setIsAgreed] = useState(false); // 👈 الحالة الجديدة للموافقة على الشروط
  
  // حالات واجهة المستخدم (تحميل، خطأ، نجاح)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // الدالة المسؤولة عن إرسال البيانات عند الضغط على الزر
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 🛡️ التحقق الأمني الإضافي للموافقة
    if (!isAgreed) {
      setError("يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة. ⚠️");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "حدث خطأ أثناء التسجيل");
      }

      // إذا نجح التسجيل
      setSuccess(true);
      
      // تحويل المستخدم لصفحة الدخول بعد ثانيتين
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-blue-600">إنشاء حساب جديد</h1>
          <p className="mt-2 text-sm text-gray-600">انضم إلينا لاكتشاف روح مستغانم</p>
        </div>

        {/* عرض رسائل الخطأ أو النجاح */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 border border-green-100">
            تم إنشاء الحساب بنجاح! جاري تحويلك لتسجيل الدخول...
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* حقل اختيار نوع الحساب */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">نوع الحساب</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole("TOURIST")}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  role === "TOURIST"
                    ? "border-blue-600 bg-blue-50/50 text-blue-600"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                <Compass size={24} className={role === "TOURIST" ? "text-blue-600" : "text-gray-400"} />
                <span className="text-sm font-bold">سائح</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("PARTNER")}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  role === "PARTNER"
                    ? "border-blue-600 bg-blue-50/50 text-blue-600"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                <Briefcase size={24} className={role === "PARTNER" ? "text-blue-600" : "text-gray-400"} />
                <span className="text-sm font-bold">شريك مروّج</span>
              </button>
            </div>
          </div>

          {/* الحقول النصية (تم ربطها بـ State) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">الاسم الكامل</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك الكامل" 
              className="w-full rounded-lg border p-3 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              required 
              disabled={loading || success}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com" 
              className="w-full rounded-lg border p-3 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-left" 
              dir="ltr"
              required 
              disabled={loading || success}
            />
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">كلمة المرور</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full rounded-lg border p-3 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-left" 
              dir="ltr"
              required 
              disabled={loading || success}
            />
          </div>

          {/* 🛡️ مربع الموافقة الإلزامية على الشروط والخصوصية */}
          <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <input
              id="terms-checkbox"
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
              required
              disabled={loading || success}
            />
            <label htmlFor="terms-checkbox" className="text-xs font-medium text-gray-600 leading-relaxed cursor-pointer select-none">
              أوافق على{" "}
              <Link href="/terms" target="_blank" className="font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5">
                شروط الاستخدام
              </Link>{" "}
              و{" "}
              <Link href="/terms" target="_blank" className="font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5">
                سياسة الخصوصية
              </Link>{" "}
              الخاصة بمنصة Funder وأتحمل المسؤولية القانونية عن دقة بياناتي المالية والشخصية.
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading || success || !isAgreed} // 👈 إضافة isAgreed لمنع الضغط
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-blue-600 p-3 font-bold text-white transition hover:bg-blue-700 shadow-sm disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              `إنشاء الحساب كـ ${role === "TOURIST" ? "سائح" : "شريك"}`
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-bold text-blue-600 hover:underline">
            تسجيل الدخول
          </Link>
        </p>

      </div>
    </div>
  );
}

// src/app/login/page.tsx — تسجيل الدخول عبر NextAuth فقط (جلسة JWT موقّعة)
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 🔐 المصادقة عبر NextAuth — تنشئ كوكي JWT موقّعاً بـ NEXTAUTH_SECRET
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (res?.error) {
        throw new Error("بيانات الدخول غير صحيحة");
      }

      setSuccess(true);

      setTimeout(() => {
        router.push("/");
        router.refresh(); // تحديث مكونات الخادم لتعكس حالة الدخول
      }, 800);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-blue-600">تسجيل الدخول</h1>
          <p className="mt-2 text-sm text-gray-600">مرحباً بك مجدداً في منصة فندر</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 border border-green-100" role="status">
            تم تسجيل الدخول بنجاح! جاري التوجيه...
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-lg border p-3 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-left"
              dir="ltr"
              autoComplete="email"
              required
              disabled={loading || success}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">كلمة المرور</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border p-3 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-left"
              dir="ltr"
              autoComplete="current-password"
              required
              disabled={loading || success}
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-blue-600 p-3 font-bold text-white transition hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "دخول"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          ليس لديك حساب؟{" "}
          <Link href="/register" className="font-bold text-blue-600 hover:underline">
            سجل الآن
          </Link>
        </p>

      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { chargeWallet } from "@/actions/wallet";

// نموذج شحن الرصيد بالقسائم — الهوية تُؤخذ من الجلسة في الخادم (لا من العميل)
export default function TopUpForm() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    const result = await chargeWallet(code);
    setStatus(result);
    setIsLoading(false);

    if (result.success) setCode("");
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-gray-900">شحن الرصيد الفوري</h3>

      {status && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm font-medium ${
            status.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
          role="status"
        >
          {status.message}
        </div>
      )}

      <form onSubmit={handleTopUp} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="أدخل رمز قسيمة فندر"
          className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-left uppercase"
          required
          maxLength={32}
        />
        <button
          type="submit"
          disabled={isLoading || !code}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
        >
          {isLoading ? "جاري الشحن..." : "تأكيد الشحن"}
        </button>
      </form>

      {/* 💡 تعليمات الشحن */}
      <div className="mt-6 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
        >
          <span>💡 كيف أشحن رصيدي؟</span>
          <span className={`transform transition-transform text-xs ${isHelpOpen ? "rotate-180" : ""}`}>▼</span>
        </button>

        {isHelpOpen && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm bg-gray-50 p-5 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
            <div>
              <h4 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">🇩🇿</span> للسياح المحليين
              </h4>
              <ul className="space-y-3 text-gray-600 leading-relaxed">
                <li><strong className="text-gray-800">قسائم فندر:</strong> أدخل رمز القسيمة المطبوعة في الخانة أعلاه للشحن الفوري.</li>
                <li><strong className="text-gray-800">بريدي موب (BaridiMob):</strong> حوّل المبلغ ثم ارفع صورة الوصل من صفحة حسابك.</li>
                <li className="opacity-70"><strong className="text-gray-800 text-[10px] bg-gray-200 px-1.5 py-0.5 rounded mr-1">قريباً</strong> <strong className="text-gray-800">البطاقة الذهبية:</strong> الدفع المباشر عبر SATIM.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">✈️</span> للسياح الدوليين (International)
              </h4>
              <ul className="space-y-3 text-gray-600 leading-relaxed">
                <li><strong className="text-gray-800">قسائم فندر (Vouchers):</strong> يمكنك شراء قسائم الشحن نقداً من الفنادق والوكالات المعتمدة في مستغانم بمجرد وصولك.</li>
                <li className="opacity-70"><strong className="text-gray-800 text-[10px] bg-gray-200 px-1.5 py-0.5 rounded mr-1">Soon</strong> <strong className="text-gray-800">Visa / Mastercard:</strong> الدفع الإلكتروني المباشر بالبطاقات الدولية.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

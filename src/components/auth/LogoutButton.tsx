"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";

/** أيقونة خروج موحّدة، تمنع النقر المتكرر أثناء إنهاء الجلسة. */
export default function LogoutButton({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label="تسجيل الخروج"
      title="تسجيل الخروج"
      className={variant === "mobile"
        ? "flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 touch-manipulation"
        : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-500 shadow-sm transition-colors hover:bg-red-100 disabled:opacity-50 touch-manipulation"}
    >
      {loading ? <Loader2 size={19} className="animate-spin" /> : <LogOut size={variant === "mobile" ? 23 : 19} />}
    </button>
  );
}

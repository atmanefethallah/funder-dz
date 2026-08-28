"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

/** زر تسجيل الخروج — يدمّر جلسة NextAuth الموقّعة (بديل كوكي user_session اليدوي) */
export default function LogoutButton({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  if (variant === "mobile") {
    return (
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 transition active:scale-95"
      >
        <LogOut size={24} />
        <span className="text-[10px] font-bold">خروج</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm font-bold text-red-500 hover:underline flex items-center gap-1"
    >
      <LogOut size={16} /> خروج
    </button>
  );
}

"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

/** زر تسجيل الخروج — أيقونة فقط بدل النص، يدمّر جلسة NextAuth الموقّعة */
export default function LogoutButton({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  if (variant === "mobile") {
    return (
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        aria-label="تسجيل الخروج"
        title="تسجيل الخروج"
        className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 transition active:scale-95"
      >
        <LogOut size={24} />
      </button>
    );
  }

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      aria-label="تسجيل الخروج"
      title="تسجيل الخروج"
      className="flex items-center justify-center rounded-full bg-red-50 p-2 text-red-500 transition hover:bg-red-100 hover:scale-105 border border-red-100 shadow-sm"
    >
      <LogOut size={18} />
    </button>
  );
}

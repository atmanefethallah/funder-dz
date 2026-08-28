"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/** مبدّل الوضع الليلي — يبدّل class "dark" على <html> ويحفظ التفضيل */
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    const root = document.documentElement;
    if (next) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // تجنّب وميض عدم التطابق قبل التركيب
  if (!mounted) {
    return <div className="w-9 h-9" aria-hidden="true" />;
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "التبديل للوضع الفاتح" : "التبديل للوضع الليلي"}
      title={isDark ? "الوضع الفاتح" : "الوضع الليلي"}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700 transition active:scale-90"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

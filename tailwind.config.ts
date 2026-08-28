import type { Config } from "tailwindcss";

const config: Config = {
  // 🌙 تفعيل الوضع الليلي عبر class على <html> (يدعم التبديل اليدوي + التفضيل المحفوظ)
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ألوان دلالية مرتبطة بمتغيرات CSS لتسهيل الوضع الليلي مستقبلاً
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;

// src/i18n/routing.ts — إعداد التوجيه متعدد اللغات (next-intl v3+)
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // اللغات المدعومة
  locales: ["ar", "en", "fr"],
  // اللغة الافتراضية
  defaultLocale: "ar",
  // إظهار بادئة اللغة دائماً في المسار
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

# 🌐 دليل تفعيل next-intl (الترجمة الكاملة)

> الحالة الحالية: **الأساس جاهز** — ملفات الترجمة معبّأة + ملفات الإعداد موجودة.
> التفعيل الكامل يتطلب إعادة هيكلة المسارات، ويُنصح بتنفيذه على بيئة بناء محلية عاملة (`npm run build` يعمل).

---

## ✅ ما هو جاهز الآن

| الملف | الغرض |
|---|---|
| `messages/ar.json` | النصوص العربية (المصدر) — معبّأة |
| `messages/en.json` | الترجمة الإنجليزية |
| `messages/fr.json` | الترجمة الفرنسية |
| `src/i18n/routing.ts` | تعريف اللغات (ar/en/fr) والافتراضية |
| `src/i18n/request.ts` | تحميل ملف الترجمة لكل طلب |

---

## 🔧 خطوات التفعيل الكامل (على بيئة محلية)

### 1) دمج middleware اللغة مع حارس المصادقة
الملف الحالي `src/middleware.ts` يحرس المسارات. أضف middleware الخاص بـ next-intl:

```ts
// src/middleware.ts
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { withAuth } from "next-auth/middleware";

const intlMiddleware = createIntlMiddleware(routing);

// ادمج الاثنين: اللغة أولاً ثم المصادقة
export default withAuth(
  function middleware(req) {
    return intlMiddleware(req);
  },
  { callbacks: { authorized: ({ token }) => !!token } }
);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

### 2) فعّل البلجن في next.config
```js
// next.config.mjs
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
export default withNextIntl(nextConfig);
```

### 3) انقل الصفحات إلى مجلد اللغة
```
src/app/page.tsx          →  src/app/[locale]/page.tsx
src/app/explore/page.tsx  →  src/app/[locale]/explore/page.tsx
src/app/layout.tsx        →  src/app/[locale]/layout.tsx
... (كل الصفحات)
```

### 4) حدّث layout الجذري
```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export default async function LocaleLayout({ children, params: { locale } }) {
  const messages = await getMessages();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 5) استبدل النصوص الثابتة بالمفاتيح
```tsx
// قبل
<h1>اكتشف مستغانم الذكية</h1>

// بعد
import { useTranslations } from "next-intl";
const t = useTranslations("explore");
<h1>{t("title")}</h1>
```

### 6) أضف مبدّل اللغة
أنشئ مكوّناً يستخدم `useRouter` من `@/i18n/routing` للتبديل بين `/ar` و`/en` و`/fr`.

### 7) احذف ودجت Google Translate
بعد عمل next-intl، احذف من `layout.tsx`:
- `<div id="google_translate_element">`
- سكربتَي `translate.google.com`
- كتلة `<style>` الخاصة بها

---

## ⚠️ لماذا لم يُفعَّل تلقائياً؟
إعادة هيكلة ~20 صفحة إلى `[locale]/` + استبدال مئات النصوص بدون بيئة بناء عاملة يخاطر بكسر التطبيق دون إمكانية تحقق. الأساس هنا يجعل التفعيل عملية ميكانيكية آمنة عندما يكون `npm run build` متاحاً محلياً.

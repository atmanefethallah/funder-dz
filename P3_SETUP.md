# ✨ إعداد ميزات P3 (الوضع الليلي + PWA + الإشعارات الفورية)

> هذه الميزات مبنية ومربوطة بالكود. بعضها يحتاج خطوات إعداد لمرة واحدة أدناه.

---

## 🌙 1. الوضع الليلي — جاهز بالكامل (لا إعداد)
يعمل فوراً. زر الشمس/القمر في شريط التنقل، والتفضيل يُحفظ في المتصفح ويُطبَّق دون وميض.
التغطية تشمل الهيكل العام والأسطح والنصوص والحقول عبر `globals.css`.

## 📱 2. PWA — يحتاج أيقونات PNG
- عامل الخدمة `public/sw.js` جاهز (تخزين مؤقت + عمل دون اتصال + إشعارات).
- `manifest.json` محدّث. **المتبقي**: ولّد أيقونتَي PNG من `public/icons/icon.svg`:
  ```bash
  # باستخدام أي أداة (مثل https://realfavicongenerator.net أو sharp):
  # أنشئ public/icons/icon-192.png (192×192) و public/icons/icon-512.png (512×512)
  ```
- التسجيل يعمل في الإنتاج فقط (`NODE_ENV=production`) عبر `ServiceWorkerRegister`.
- للاختبار محلياً: `npm run build && npm start` ثم افتح DevTools → Application → Service Workers.

## 🔔 3. الإشعارات الفورية — تحتاج مفاتيح VAPID

### أ) ثبّت مكتبة الإرسال وولّد المفاتيح:
```bash
npm install web-push
npx web-push generate-vapid-keys
```

### ب) أضف المفاتيح إلى `.env`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY="المفتاح_العام_هنا"
VAPID_PRIVATE_KEY="المفتاح_الخاص_هنا"
VAPID_SUBJECT="mailto:admin@funder-dz.com"
```

### ج) طبّق هجرة قاعدة البيانات:
```bash
psql "$DIRECT_URL" -f prisma/migrations/0003_p3_push_subscriptions/migration.sql
npx prisma migrate resolve --applied 0003_p3_push_subscriptions
npx prisma generate
```

### د) أضف زر التفعيل أينما تريد (مثلاً في الملف الشخصي):
```tsx
import PushNotificationToggle from "@/components/PushNotificationToggle";
<PushNotificationToggle />
```

### هـ) الإرسال من الخادم (مثال — عند تأكيد حجز):
```ts
import webpush from "web-push";
webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
const subs = await prisma.pushSubscription.findMany({ where: { userId } });
for (const s of subs) {
  await webpush.sendNotification(
    { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
    JSON.stringify({ title: "✅ تم تأكيد حجزك!", body: `تذكرتك في ${placeName} جاهزة.`, link: "/tickets" })
  ).catch(() => {}); // تجاهل الاشتراكات المنتهية
}
```

---

## 💡 4. التوصيات المخصصة — جاهزة بالكامل (لا إعداد)
قسم "مقترح لك خصيصاً" يظهر في الصفحة الرئيسية تلقائياً:
- للمسجّل: يوصي بمعالم من تصنيفات مفضلته وحجوزاته لم يرَها بعد.
- للزائر: يعرض الأعلى تقييماً.
المحرك في `src/lib/recommendations.ts` والمكوّن في `src/components/RecommendedPlaces.tsx`.

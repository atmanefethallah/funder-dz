# 🛡️ حزمة إصلاحات P0 الأمنية — منصة Funder

> تاريخ الترقية: 2026-08-27 · النطاق: إغلاق الثغرات الحرجة + سلامة الأموال + أساس الاشتراكات

---

## 🚨 خطوات ما بعد فك الضغط (إلزامية قبل التشغيل)

```bash
# 1) ثبّت الحزم
npm install

# 2) أنشئ ملف .env من القالب واملأ القيم (انظر .env.example)
cp .env.example .env
# ⚠️ ولّد NEXTAUTH_SECRET قوياً:
openssl rand -base64 32
# ⚠️ بدّل كلمة مرور قاعدة البيانات فوراً — الأصلية تسرّبت في ملف ZIP سابق

# 3) طبّق ترقية قاعدة البيانات (من SQL Editor في Supabase أو psql)
psql "$DIRECT_URL" -f prisma/migrations/0001_p0_security_hardening/migration.sql
npx prisma migrate resolve --applied 0001_p0_security_hardening
npx prisma generate

# 4) ازرع البيانات الأولية (قسائم + باقات + مدير)
#    اضبط ADMIN_EMAIL و ADMIN_PASSWORD في .env أولاً
npm run db:seed

# 5) شغّل
npm run dev
```

---

## ✅ ما أُصلح في هذه الحزمة

### 1. المصادقة — الثغرة الأخطر (أُغلقت بالكامل)
- **حُذف** كوكي `user_session` اليدوي الذي كان يخزّن معرف المستخدم كنص صريح قابل للتزوير من DevTools (كان يتيح انتحال هوية أي أدمن).
- **التوحيد** على NextAuth (JWT موقّع بـ NEXTAUTH_SECRET) عبر `src/lib/session.ts` (`getSessionUser` / `requireRole`).
- **حُذفت** المسارات اليتيمة: `/api/auth/login`، `/api/logout`، `/api/auth/logout`، والمسار المسدود `/api/admin/recharges`.
- **`src/middleware.ts`** جديد: حماية على الحدود لمسارات `/admin` و`/partner` و`/wallet` و`/profile` وغيرها مع فحص الدور.
- صفحة الدخول تستخدم `signIn` من NextAuth؛ الخروج عبر `signOut` (مكوّن `LogoutButton` جديد).

### 2. ثغرات تفويض حرجة أُغلقت
| الثغرة السابقة | الإصلاح |
|---|---|
| `PUT /api/partner/bookings` بلا أي مصادقة — أي زائر يؤكد/يرفض أي حجز | `requireRole` + فحص ملكية المعلم + منع إعادة المعالجة |
| `PUT /api/places/[id]` بلا فحص ملكية — أي مستخدم يعدّل سعر أي معلم | فحص الملكية (المالك أو المدير فقط) |
| التسجيل يقبل `role` من العميل — تصعيد مباشر إلى ADMIN | قائمة بيضاء: TOURIST/PARTNER فقط |
| `PUT /api/notifications` يعلّم إشعارات الغير كمقروءة | `updateMany` مقيّد بـ userId |
| إضافة معلم كانت متاحة لأي مستخدم مسجل | شركاء موثّقون (`VERIFIED`) فقط |
| رسالة "لا يوجد حساب بهذا البريد" تكشف المسجّلين | رسالة موحّدة غير كاشفة |

### 3. سلامة الأموال
- **`Float` → `Decimal`** لكل الحقول المالية (`balance`, `price`, `amount`).
- **دفتر أستاذ `WalletTransaction`**: كل خصم/إيداع موثّق (حجز، استرداد، شحن، قسيمة).
- **رفض الحجز**: كان يعيد العربون للسائح دون خصمه من الشريك (طباعة مال!) — الآن خصمٌ من الشريك وإعادةٌ للسائح في معاملة ذرّية واحدة.
- **حذف التذكرة**: يسترد العربون تلقائياً (PENDING/CONFIRMED)، ويمنع حذف التذاكر المستخدمة.
- **إحصائيات الإدارة**: الإيراد = العربون المحصّل فعلياً (كان يعرض السعر الكامل — مضخّم 10x).
- **الحجز**: خصم شرطي ذرّي (`updateMany` مع `balance >= deposit`) + منع تكرار حجز نشط لنفس المعلم + رمز QR عشوائي.

### 4. القسائم والتذاكر
- **القسائم من قاعدة البيانات** (جدول `Voucher` + `VoucherRedemption`): استخدام واحد لكل مستخدم، حد أقصى للاستخدامات، صلاحية، وتعطيل — بدل الأكواد الثابتة المكشوفة في الكود.
- **`qrToken`**: رمز عشوائي 32 حرفاً منفصل عن معرف الحجز — التذاكر لم تعد قابلة للتخمين/التزوير.
- **الماسح يستهلك التذكرة فعلياً** (`updateMany` ذرّي يمنع المسح المزدوج المتزامن) — سابقاً لم تُوسم كمستخدمة أبداً.
- صفحة التذكرة: توليد QR **محلياً** (مكوّن `TicketQRCode`) بدل إرسال معرف الحجز لخدمة خارجية.

### 5. رفع الملفات والمدخلات
- فحص **Magic Bytes** الفعلي (JPG/PNG/WEBP/PDF) بدل ترويسة MIME المزوّرة (`src/lib/file-checks.ts`).
- **Rate Limiting** في الذاكرة (`src/lib/rate-limit.ts`): التسجيل، الشحن، الحجز، القسائم، رفع الوثائق.
- سياسة كلمة مرور: 8+ أحرف مع حروف وأرقام، bcrypt بتكلفة 12، تطبيع البريد (lowercase).
- **Security Headers** في `next.config.mjs` (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy للكاميرا).
- `profile GET` لم يعد يحذف تذاكر السائح بصمت (كانت آثاراً جانبية خطيرة داخل GET).

### 6. إصلاحات وظيفية اكتُشفت أثناء العمل
- صفحة `explore/[id]` كانت تستدعي `GET /api/places` **غير الموجود** (404 دائم) — أُضيف المسار العام بحقول محدودة.
- صفحة التذكرة كانت تقارن بحالة `COMPLETED` غير الموجودة — صُحّحت إلى `USED`.
- تحويل `Decimal` إلى `Number` عند تمرير البيانات لمكونات العميل (كان سيسبب أخطاء React).

### 7. أساس نظام الاشتراكات (P2)
- جدولا `Plan` و`Subscription` في المخطط + بذرهما في `prisma/seed.js`:
  - شركاء: مجاني (1 معلم، عمولة 15%) · احترافي 2,500 د.ج (10 معالم، 10%) · أعمال 6,000 د.ج (∞، 7%).
  - سياح: Funder Plus ‏499 د.ج/شهر (عربون مخفّض 5%، خطط ذكية ∞، VR حصري).

---

## ⏭️ ما تبقى (خارطة الطريق — لم يُنفَّذ بعد)

**P1:** تفعيل `next-intl` وحذف ويدجت Google Translate · استبدال `alert/confirm/prompt` بـ Toasts وModals · تاريخ الحجز وعدد الزوار · سجل العمليات في واجهة المحفظة · ترقيم الصفحات · نقل الصور من Base64 إلى Supabase Storage/R2.

**P2:** واجهات الباقات وصفحة الأسعار · Feature Gates الفعلية (`maxPlaces`…) · تكامل SATIM/BaridiMob/Stripe · تجديد تلقائي عبر Cron · لوحة MRR/Churn.

**P3:** Dark Mode · توصيات مخصصة · Push Notifications · PWA كامل.

---

## 📁 ملفات جديدة في هذه الحزمة

```
src/lib/session.ts          — التحقق الموحد من الجلسة
src/lib/ledger.ts           — دفتر الأستاذ المالي
src/lib/rate-limit.ts       — تحديد معدل الطلبات
src/lib/file-checks.ts      — فحص Magic Bytes
src/middleware.ts           — حارس المسارات
src/types/next-auth.d.ts    — أنواع الجلسة (id + role)
src/components/auth/LogoutButton.tsx
src/components/Booking/TicketQRCode.tsx
prisma/seed.js              — قسائم + باقات + مدير
prisma/migrations/0001_p0_security_hardening/migration.sql
.env.example
```

> ملاحظة التحقق: تعذّر تشغيل `npm run build` داخل بيئة المعاينة بسبب انقطاع الشبكة المتكرر.
> الكود مُراجَع وجاهز — نفّذ خطوات "ما بعد فك الضغط" أعلاه محلياً لبناء المشروع والتحقق.

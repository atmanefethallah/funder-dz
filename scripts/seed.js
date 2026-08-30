// scripts/seed.js — بذر البيانات الأولية: القسائم، باقات الاشتراك، وحساب المدير
// تم تحويله من Prisma إلى SQL خام مباشر عبر مكتبة "pg" — لا يوجد ORM هنا بعد الآن.
// التشغيل: npm run db:seed   (أو: node scripts/seed.js)
require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  // 🎫 1. قسائم الشحن الأولية (عدّلها أو أضف غيرها من لوحة الإدارة لاحقاً)
  const vouchers = [
    { code: "FUNDER1000", amount: 1000, maxUses: 100 },
    { code: "FUNDER2000", amount: 2000, maxUses: 100 },
    { code: "MOSTAGANEM5000", amount: 5000, maxUses: 50 },
  ];

  for (const v of vouchers) {
    await pool.query(
      `INSERT INTO "Voucher" ("code", "amount", "maxUses", "expiresAt")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("code") DO NOTHING`,
      [v.code, v.amount, v.maxUses, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)],
    );
  }
  console.log("✅ تم بذر القسائم:", vouchers.map((v) => v.code).join(", "));

  // 💎 2. باقات الاشتراك (أساس نظام P2)
  const plans = [
    {
      key: "PARTNER_FREE",
      name: "الباقة المجانية",
      targetRole: "PARTNER",
      priceMonthly: 0,
      priceYearly: 0,
      features: { maxPlaces: 1, commissionRate: 0.15, vrTours: 0, featured: false, promoNotificationsPerMonth: 0, analytics: "basic" },
    },
    {
      key: "PARTNER_PRO",
      name: "الباقة الاحترافية",
      targetRole: "PARTNER",
      priceMonthly: 2500,
      priceYearly: 25000, // شهرين مجاناً
      features: { maxPlaces: 10, commissionRate: 0.1, vrTours: 3, featured: true, promoNotificationsPerMonth: 2, analytics: "advanced" },
    },
    {
      key: "PARTNER_BUSINESS",
      name: "باقة الأعمال",
      targetRole: "PARTNER",
      priceMonthly: 6000,
      priceYearly: 60000,
      features: { maxPlaces: -1, commissionRate: 0.07, vrTours: -1, featured: true, promoNotificationsPerMonth: 10, analytics: "advanced_export", accountManager: true },
    },
    {
      key: "TOURIST_FREE",
      name: "السائح",
      targetRole: "TOURIST",
      priceMonthly: 0,
      priceYearly: 0,
      features: { smartPlansPerMonth: 3, depositRate: 0.1, exclusiveVr: false, priorityBooking: false },
    },
    {
      key: "TOURIST_PLUS",
      name: "Funder Plus",
      targetRole: "TOURIST",
      priceMonthly: 499,
      priceYearly: 3990,
      features: { smartPlansPerMonth: -1, depositRate: 0.05, exclusiveVr: true, priorityBooking: true, partnerDiscounts: true },
    },
  ];

  for (const p of plans) {
    await pool.query(
      `INSERT INTO "Plan" ("key", "name", "targetRole", "priceMonthly", "priceYearly", "features")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("key") DO UPDATE SET
         "features" = EXCLUDED."features",
         "priceMonthly" = EXCLUDED."priceMonthly",
         "priceYearly" = EXCLUDED."priceYearly",
         "name" = EXCLUDED."name"`,
      [p.key, p.name, p.targetRole, p.priceMonthly, p.priceYearly, JSON.stringify(p.features)],
    );
  }
  console.log("✅ تم بذر الباقات:", plans.map((p) => p.key).join(", "));

  // 👑 3. حساب المدير الأول — يُنشأ فقط إذا وفّرت ADMIN_PASSWORD في البيئة
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@funder-dz.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminPassword && adminPassword.length >= 8) {
    const hash = await bcrypt.hash(adminPassword, 12);
    await pool.query(
      `INSERT INTO "User" ("name", "email", "password", "role", "isVerified", "verificationStatus")
       VALUES ($1, $2, $3, 'ADMIN', true, 'VERIFIED')
       ON CONFLICT ("email") DO UPDATE SET "role" = 'ADMIN'`,
      ["مدير المنصة", adminEmail, hash],
    );
    console.log("✅ حساب المدير جاهز:", adminEmail);
  } else {
    console.log("ℹ️  لم يتم ضبط ADMIN_PASSWORD — تخطّي إنشاء المدير (فعّلها في .env ثم أعد البذر)");
  }
}

main()
  .catch((e) => {
    console.error("❌ فشل البذر:", e);
    process.exit(1);
  })
  .finally(() => pool.end());

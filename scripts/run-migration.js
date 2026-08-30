// تشغيل ملف SQL مباشرة عبر مكتبة pg (بديل عن psql غير المتوفر في هذه البيئة)
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("الاستخدام: node scripts/run-migration.js <path-to-sql-file>");
    process.exit(1);
  }
  const sql = fs.readFileSync(path.resolve(file), "utf8");
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("لا يوجد DIRECT_URL أو DATABASE_URL في .env");
    process.exit(1);
  }
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("✅ تم تنفيذ الملف بنجاح:", file);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌ فشل تنفيذ الترحيل:", err.message);
  process.exit(1);
});

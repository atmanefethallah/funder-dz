// src/lib/db.ts — الوصول المباشر لقاعدة بيانات Postgres (المستضافة لدى Supabase)
// يستبدل هذا الملف مكتبة Prisma بالكامل: لا يوجد ORM، فقط SQL خام
// مع معاملات محمية (اسم مستخدم معلم) عبر المكتبة "pg".
//
// ملاحظة: لم يكن مفتاح Supabase REST (SUPABASE_URL / SUPABASE_ANON_KEY) موجوداً في
// مشروعك أصلاً — فقط DATABASE_URL/DIRECT_URL لقاعدة Postgres نفسها. لهذا نعتمد هنا
// الاتصال المباشر بقاعدة Supabase عبر "pg" (وهو نفس ما كانت Prisma تسط عليه).
// إن ركت مستقبلاً المرور لمكتبة supabase-js الرسمية، أضف SUPABASE_URL و
// SUPABASE_SERVICE_ROLE_KEY إلى .env واستبدل هذا الملف.

import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL غير مضبوط في متطيرات البيئة.");
  }
  return new Pool({
    connectionString,
    // مجمّع اتصالات Supabase (pgbouncer) يتطلّب SSL
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
  });
}

export const pool: Pool = global.__pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") global.__pgPool = pool;

/** ينفّذ استعلاماً واحداً ويعيد كل الصفوف. */
export async function query<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params: ReadonlyArray<unknown> = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params as unknown[]);
  return result.rows;
}

/** ينفّذ استعلاماً ويعيد الصف الأول أو null. */
export async function queryOne<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params: ReadonlyArray<unknown> = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * يشفّل مجموعة عمليات ضمن معاملة واحدة (BEGIN/COMMIT/ROLLBACK) لضمان الذرّة،
 * تماماً كما كان يفعل prisma.$transaction. مررر العميل (client) لإرسال
 * الاستعلامات داخل المعاملة ذاتها.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export type { PoolClient };

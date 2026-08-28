import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

type VoucherRow = {
  code: string;
  amount: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
};

// 🎫 تولدرمز قسيمة عشوائي قوي ومقروء بوضوح (بدون أحرف ملتبسة 0/O أو 1/I)
function generateVoucherCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(10);
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return `FUNDER-${code.slice(0, 5)}-${code.slice(5, 10)}`;
}

// 🔍 جلب كل القسائم (للمدير فقط)
export async function GET() {
  try {
    const admin = await requireRole("ADMIN");
    if (!admin) return NextResponse.json({ message: "محور" }, { status: 403 });

    const vouchers = await query<VoucherRow>(
      `SELECT "code", "amount", "maxUses", "usedCount", "isActive", "expiresAt", "createdAt"
       FROM "Voucher" ORDER BY "createdAt" DESC LIMIT 200`,
    );

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error("GET Vouchers Error:", error);
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}

// ➕ إنشاء قسيمة جديدة (للمدير فقط)
export async function POST(req: Request) {
  try {
    const admin = await requireRole("ADMIN");
    if (!admin) return NextResponse.json({ message: "محور" }, { status: 403 });

    const body = await req.json().catch(() => null);
    const amount = Number(body?.amount);
    const maxUses = Number(body?.maxUses) || 1;
    const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null;
    let code = (body?.code || "").trim().toUpperCase();

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "يرجى إدخال مبلـ قسيمة صالح (أكبر من 0)" }, { status: 400 });
    }
    if (maxUses <= 0) {
      return NextResponse.json({ message: "يجب أن يكون عدد مرات الاستخدام أكبر من 0" }, { status: 400 });
    }
    if (expiresAt && isNaN(expiresAt.getTime())) {
      return NextResponse.json({ message: "تاريخ الانتهاء في الصلاحية فير صالح" }, { status: 400 });
    }

    if (!code) {
      code = generateVoucherCode();
    }

    const existing = await queryOne(`SELECT "code" FROM "Voucher" WHERE "code" = $1`, [code]);
    if (existing) {
      return NextResponse.json({ message: "هذا الرمز موجود مسبقاً، جرّب رمزاً آخر" }, { status: 409 });
    }

    await query(
      `INSERT INTO "Voucher" ("code", "amount", "maxUses", "usedCount", "isActive", "expiresAt")
       VALUES ($1, $2, $3, 0, true, $4)`,
      [code, amount, maxUses, expiresAt],
    );

    return NextResponse.json({ message: `✅ تم إنشاء القسيمة بنجاح!`, code });
  } catch (error) {
    console.error("POST Voucher Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم أثناء الإنشاء" }, { status: 500 });
  }
}

// 🔄 تفعيل/تعطيل قسيمة موجودة (للمدير فقط)
export async function PUT(req: Request) {
  try {
    const admin = await requireRole("ADMIN");
    if (!admin) return NextResponse.json({ message: "محور" }, { status: 403 });

    const body = await req.json().catch(() => null);
    const code = (body?.code || "").trim().toUpperCase();
    const isActive = Boolean(body?.isActive);

    if (!code) {
      return NextResponse.json({ message: "رمز القسيمة مطلوب" }, { status: 400 });
    }

    const result = await query(`UPDATE "Voucher" SET "isActive" = $1 WHERE "code" = $2`, [isActive, code]);

    return NextResponse.json({ message: isActive ? "تم تفعيل القسيمة" : "تم تعطيل القسيمة" });
  } catch (error) {
    console.error("PUT Voucher Error:", error);
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}

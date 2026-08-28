// src/app/api/auth/register/route.ts — تسجيل محصّن: سياسة كلمة مرور + تحديد معدل + قائمة أدوار بيضاء
import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const ALLOWED_ROLES = ["TOURIST", "PARTNER"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    // تحديد المعدل: 5 محاولات تسجيل في الساعة لكل عنوان IP
    const ip = clientIp(request);
    const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { message: `محاولات تسجيل كثيرة جداً. حاول بعد ${Math.ceil(rl.retryAfterSec / 60)} دقيقة.` },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const role = body?.role;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: "يرجى ملء جميع الحقول المطلوبة" }, { status: 400 });
    }

    // 🛡️ قائمة بيضاء للأدوار — منع تصعيد الصلاحيات (لا يمكن التسجيل كـ ADMIN أبداً)
    if (!(ALLOWED_ROLES as readonly string[]).includes(role)) {
      return NextResponse.json({ message: "نوع الحساب गير صالح" }, { status: 400 });
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ message: "صيगة البريد الإلكتروني गير صحيحة" }, { status: 400 });
    }

    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ message: "الاسم يجب أن يكون بين 2 و 60 حرفاً" }, { status: 400 });
    }

    // 🛡️ سياسة كلمة المرور: 8 أحرف على الأقل، حروف + أرقام
    if (password.length < 8) {
      return NextResponse.json(
        { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
        { status: 400 },
      );
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { message: "كلمة المرور يجب أن تحتوي على حروف وأرقام معاً" },
        { status: 400 },
      );
    }

    const existingUser = await queryOne<{ id: string }>(`SELECT "id" FROM "User" WHERE "email" = $1`, [email]);
    if (existingUser) {
      return NextResponse.json(
        { message: "هذا البريد الإلكتروني مستخدم بالفعل" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12); // تكلفة 12 بدلاً من 10

    const newUser = await queryOne<{ id: string }>(
      `INSERT INTO "User" ("name", "email", "password", "role") VALUES ($1, $2, $3, $4) RETURNING "id"`,
      [name, email, hashedPassword, role],
    );

    return NextResponse.json(
      { message: "تم إنشاء الحساب بنجاح", userId: newUser?.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ داخلي في السيرفر، يرجى المحاولة لاحقاً" },
      { status: 500 },
    );
  }
}

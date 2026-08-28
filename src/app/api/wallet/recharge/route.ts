import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { isValidImage } from "@/lib/file-checks";

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: "يرجى تسجيل الدخول" }, { status: 401 });
    }

    // تحديد المعدل: 5 طلبات شحن في الساعة لكل مستخدم
    const rl = rateLimit(`recharge:${sessionUser.id}`, 5, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { message: `طلبات كثيرة جداً. حاول بعد ${Math.ceil(rl.retryAfterSec / 60)} دقيقة.` },
        { status: 429 },
      );
    }

    const data = await request.formData();
    const transactionId = data.get("transactionId") as string;
    const amount = data.get("amount") as string;
    const file = data.get("receipt");

    const parsedAmount = Number(amount);
    if (!amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 10_000_000) {
      return NextResponse.json({ message: "مبلغ الشحن غير صالح" }, { status: 400 });
    }

    if (!transactionId || transactionId.trim() === "") {
      return NextResponse.json({ message: "يرجى إدخال رقم العملية" }, { status: 400 });
    }

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ message: "يرجى إرفاق صورة وصل الدفع" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "حجم الصورة كبير جداً! الحد الأقصى هو 5 ميجابايت" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 🛡️ فحص المحتوى الفعلي (Magic Bytes) — ترويسة MIME وحدها قابلة للتزوير
    if (!isValidImage(buffer)) {
      return NextResponse.json(
        { message: "الملف المرفق ليس صورة صالحة (JPG/PNG/WEBP)" },
        { status: 400 },
      );
    }

    const base64Image = buffer.toString("base64");
    const receiptDataUri = `data:${file.type};base64,${base64Image}`;

    try {
      await query(
        `INSERT INTO "RechargeRequest" ("amount", "receiptUrl", "transactionId", "userId") VALUES ($1, $2, $3, $4)`,
        [parsedAmount, receiptDataUri, transactionId.trim(), sessionUser.id],
      );
    } catch (dbError: unknown) {
      // انتهاك القيد الفريد — رقم العملية مستخدم مسبقاً في طلب آخر (محمي الآن على مستوى القاعدة)
      const pgErr = dbError as { code?: string };
      if (pgErr?.code === "23505") {
        return NextResponse.json(
          { message: "عذراً، رقم العملية هذا تم استخدامه مسبقاً في طلب آخر!" },
          { status: 400 },
        );
      }
      throw dbError;
    }

    return NextResponse.json(
      { message: "تم إرسال طلب الشحن للإدارة بنجاح!" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Recharge Upload Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ في الخادم أثناء رفع الوصل" },
      { status: 500 },
    );
  }
}

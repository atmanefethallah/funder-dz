import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { isValidDocument } from "@/lib/file-checks";

// رفع وثائق توثيق الشريك (السجل التجاري + بطاقة التعريف)
export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 401 });
    }

    const rl = rateLimit(`verify:${sessionUser.id}`, 5, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { message: `محاولات كثيرة. حاول بعد ${Math.ceil(rl.retryAfterSec / 60)} دقيقة.` },
        { status: 429 }
      );
    }

    const data = await req.formData();
    const registryFile = data.get("commercialRegistry") as File | null;
    const idCardFile = data.get("idCard") as File | null;

    if (!registryFile || !idCardFile) {
      return NextResponse.json(
        { message: "⚠️ يرجى رفع كل من السجل التجاري وبطاقة التعريف." },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (registryFile.size > maxSize || idCardFile.size > maxSize) {
      return NextResponse.json(
        { message: "❌ حجم أي ملف يجب ألا يتجاوز 5 ميغابايت." },
        { status: 400 }
      );
    }

    const registryBuffer = Buffer.from(await registryFile.arrayBuffer());
    const idCardBuffer = Buffer.from(await idCardFile.arrayBuffer());

    // 🛡️ فحص المحتوى الفعلي للملفات (Magic Bytes) — ترويسة MIME قابلة للتزوير
    if (!isValidDocument(registryBuffer) || !isValidDocument(idCardBuffer)) {
      return NextResponse.json(
        { message: "❌ الملفات يجب أن تكون صوراً (JPG/PNG) أو PDF حقيقية." },
        { status: 400 }
      );
    }

    const registryDataUri = `data:${registryFile.type};base64,${registryBuffer.toString("base64")}`;
    const idCardDataUri = `data:${idCardFile.type};base64,${idCardBuffer.toString("base64")}`;

    await query(
      `UPDATE "User" SET "verificationStatus" = 'PENDING', "commercialRegistry" = $1, "idCard" = $2 WHERE "id" = $3`,
      [registryDataUri, idCardDataUri, sessionUser.id],
    );

    return NextResponse.json(
      { message: "🎉 تم رفع وثائقك بنجاح! طلبك قيد المراجعة حالياً من الإدارة." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification Upload Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ غير متوقع أثناء رفع الوثائق" },
      { status: 500 }
    );
  }
}

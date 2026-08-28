import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { withTransaction } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { recordLedger } from "@/lib/ledger";
import { rateLimit } from "@/lib/rate-limit";

type PlaceRow = { id: string; name: string; price: string; userId: string };

export async function POST(req: Request) {
  try {
    // 1. المصادقة عبر جلسة NextAuth الموقّعة فقط
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: "يرجى تسجيل الدخول" }, { status: 401 });
    }

    // 2. تحديد المعدل: 10 حجوزات في الدقيقة كحد أقصى لكل مستخدم
    const rl = rateLimit(`booking:${sessionUser.id}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { message: `محاولات كثيرة جداً. حاول مرة أخرى بعد ${rl.retryAfterSec} ثانية.` },
        { status: 429 }
      );
    }

    // 3. حسابات الشركاء لإدارة المعالم فقط ولا يمكنها الحجز
    if (sessionUser.role === "PARTNER") {
      return NextResponse.json(
        { message: "عذراً، حسابات الشركاء مخصصة لإدارة المعالم فقط ولا يمكنها إجراء حجوزات." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const placeId = body?.placeId;
    if (!placeId || typeof placeId !== "string") {
      return NextResponse.json({ message: "معرف المعلم गير صالح" }, { status: 400 });
    }

    // 4. معاملة ذرّية: كل العمليات تنجح معاً أو تفشل معاً
    await withTransaction(async (tx) => {
      const placeRes = await tx.query<PlaceRow>(`SELECT "id", "name", "price", "userId" FROM "Place" WHERE "id" = $1`, [placeId]);
      const place = placeRes.rows[0];
      if (!place) throw new Error("المعلم गير موجود");

      // منع تكرار حجز نشط لنفس المعلم من نفس المستخدم
      const existingActiveRes = await tx.query(
        `SELECT "id" FROM "Booking" WHERE "userId" = $1 AND "placeId" = $2 AND "status" IN ('PENDING', 'CONFIRMED') LIMIT 1`,
        [sessionUser.id, placeId],
      );
      if (existingActiveRes.rows.length > 0) {
        throw new Error("لديك حجز نشط بالفعل لهذا المعلم. راجع تذاكرك في حسابك.");
      }

      const price = Number(place.price);
      const deposit = Math.round(price * 0.1 * 100) / 100;

      if (deposit > 0) {
        // خصم شرطي ذرّي: ينجح فقط إذا كان الرصيد كافياً لحظة التنفيذ
        const debitedRes = await tx.query(
          `UPDATE "User" SET "balance" = "balance" - $1 WHERE "id" = $2 AND "balance" >= $1`,
          [deposit, sessionUser.id],
        );
        if (debitedRes.rowCount === 0) {
          throw new Error("رصيدك गير كافِ لإتمام هذا الحجز. يرجى شحن محفظتك أولاً.");
        }

        await recordLedger(tx, {
          userId: sessionUser.id,
          type: "BOOKING_DEPOSIT",
          direction: "DEBIT",
          amount: deposit,
          reference: placeId,
          note: `عربون حجز: ${place.name}`,
        });

        await tx.query(`UPDATE "User" SET "balance" = "balance" + $1 WHERE "id" = $2`, [deposit, place.userId]);

        await recordLedger(tx, {
          userId: place.userId,
          type: "PARTNER_EARNING",
          direction: "CREDIT",
          amount: deposit,
          reference: placeId,
          note: `عربون مستلم من حجز: ${place.name}`,
        });
      }

      // إنشاء الحجز برمز QR عشوائي آمن
      const qrToken = randomBytes(24).toString("base64url");
      await tx.query(
        `INSERT INTO "Booking" ("userId", "placeId", "amount", "qrToken", "status") VALUES ($1, $2, $3, $4, 'PENDING')`,
        [sessionUser.id, placeId, deposit, qrToken],
      );

      // إشعار فوري للشريك بوجود طلب جديد
      await tx.query(
        `INSERT INTO "Notification" ("userId", "title", "message", "link") VALUES ($1, $2, $3, $4)`,
        [
          place.userId,
          "🔔 طلب حجز جديد!",
          `دفع السائح "${sessionUser.name || "مستخدم"}" عربوناً لطلب حجز في "${place.name}". اضगط هنا لمراجعة الطلب.`,
          "/partner/bookings",
        ],
      );
    });

    return NextResponse.json({ message: "تم الحجز بالعربون بنجاح! 🎉" }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    const errorMessage = err?.message || "حدث خطأ في الخادم";
    const isClientError =
      errorMessage.includes("गير موجود") ||
      errorMessage.includes("गير كاف") ||
      errorMessage.includes("حجز نشط");
    return NextResponse.json({ message: errorMessage }, { status: isClientError ? 400 : 500 });
  }
}

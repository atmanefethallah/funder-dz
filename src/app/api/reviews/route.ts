import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: "गير مصرح لك" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const placeId = body?.placeId;
    const rating = Number(body?.rating);
    const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 500) : null;

    if (!placeId || typeof placeId !== "string") {
      return NextResponse.json({ message: "معرف المعلم गير صالح" }, { status: 400 });
    }

    // 🛡️ تحقق صارم من التقييم: عدد صحيح بين 1 و 5
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "التقييم يجب أن يكون رقماً صحيحاً من 1 إلى 5" },
        { status: 400 },
      );
    }

    // 1. التقييم مرتبط بزيارة فعلية (تذكرة مستعملة)
    const hasVisited = await queryOne(
      `SELECT "id" FROM "Booking" WHERE "userId" = $1 AND "placeId" = $2 AND "status" = 'USED'`,
      [sessionUser.id, placeId],
    );

    if (!hasVisited) {
      return NextResponse.json(
        { message: "لا يمكنك التقييم إلا بعد زيارة المعلم واستخدام تذكرتك!" },
        { status: 403 },
      );
    }

    // 2. تقييم واحد فقط لكل مستخدم لكل معلم (محمي أيضاً بقيد فريد في القاعدة)
    const existingReview = await queryOne(
      `SELECT "id" FROM "Review" WHERE "userId" = $1 AND "placeId" = $2`,
      [sessionUser.id, placeId],
    );

    if (existingReview) {
      return NextResponse.json(
        { message: "لقد قمت بتقييم هذا المكان مسبقاً، شكراً لك!" },
        { status: 400 },
      );
    }

    try {
      await query(
        `INSERT INTO "Review" ("rating", "comment", "userId", "placeId") VALUES ($1, $2, $3, $4)`,
        [rating, comment, sessionUser.id, placeId],
      );
    } catch (dbError: unknown) {
      const pgErr = dbError as { code?: string };
      if (pgErr?.code === "23505") {
        return NextResponse.json(
          { message: "لقد قمت بتقييم هذا المكان مسبقاً!" },
          { status: 400 },
        );
      }
      throw dbError;
    }

    return NextResponse.json({ message: "تم إضافة تقييمك بنجاح! شكراً لمشاركة تجربتك. 🌟" });
  } catch (error) {
    console.error("Review POST Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

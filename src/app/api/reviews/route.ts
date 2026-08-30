import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const placeId = new URL(request.url).searchParams.get("placeId");
    if (!placeId) return NextResponse.json({ message: "معرف المعلم مطلوب" }, { status: 400 });

    const reviews = await query<{ id: string; rating: number; comment: string | null; createdAt: Date; userName: string }>(
      `SELECT r."id", r."rating", r."comment", r."createdAt", u."name" AS "userName"
       FROM "Review" r JOIN "User" u ON u."id" = r."userId"
       WHERE r."placeId" = $1 ORDER BY r."createdAt" DESC LIMIT 100`,
      [placeId],
    );
    const average = reviews.length
      ? Math.round((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length) * 10) / 10
      : 0;
    return NextResponse.json({ reviews, average, count: reviews.length });
  } catch (error) {
    console.error("Review GET Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ message: "غير مصرح لك" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const placeId = body?.placeId;
    const rating = Number(body?.rating);
    const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 500) || null : null;

    if (!placeId || typeof placeId !== "string") {
      return NextResponse.json({ message: "معرف المعلم غير صالح" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ message: "التقييم يجب أن يكون رقماً صحيحاً من 1 إلى 5" }, { status: 400 });
    }

    const place = await queryOne<{ id: string; price: string }>(
      `SELECT "id", "price" FROM "Place" WHERE "id" = $1`,
      [placeId],
    );
    if (!place) return NextResponse.json({ message: "المعلم غير موجود" }, { status: 404 });

    // المعلم المجاني يسمح بالتقييم مباشرة؛ المدفوع يتطلب تذكرة مستعملة لإثبات الزيارة.
    if (Number(place.price) > 0) {
      const hasVisited = await queryOne(
        `SELECT "id" FROM "Booking" WHERE "userId" = $1 AND "placeId" = $2 AND "status" = 'USED' LIMIT 1`,
        [sessionUser.id, placeId],
      );
      if (!hasVisited) {
        return NextResponse.json({ message: "لا يمكنك التقييم إلا بعد زيارة المعلم واستخدام تذكرتك!" }, { status: 403 });
      }
    }

    const existingReview = await queryOne(
      `SELECT "id" FROM "Review" WHERE "userId" = $1 AND "placeId" = $2`,
      [sessionUser.id, placeId],
    );
    if (existingReview) {
      return NextResponse.json({ message: "لقد قمت بتقييم هذا المكان مسبقاً، شكراً لك!" }, { status: 400 });
    }

    try {
      await query(
        `INSERT INTO "Review" ("rating", "comment", "userId", "placeId") VALUES ($1, $2, $3, $4)`,
        [rating, comment, sessionUser.id, placeId],
      );
    } catch (dbError: unknown) {
      if ((dbError as { code?: string })?.code === "23505") {
        return NextResponse.json({ message: "لقد قمت بتقييم هذا المكان مسبقاً!" }, { status: 400 });
      }
      throw dbError;
    }

    return NextResponse.json({ message: "تم إضافة تقييمك بنجاح! 🌟" }, { status: 201 });
  } catch (error) {
    console.error("Review POST Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

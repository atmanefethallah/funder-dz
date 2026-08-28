import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: "يرجى تسجيل الدخول أولاً" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const placeId = body?.placeId;
    if (!placeId || typeof placeId !== "string") {
      return NextResponse.json({ message: "معرف المعلم غير صالح" }, { status: 400 });
    }

    // تأكد أن المعلم موجود فعلاً
    const place = await queryOne<{ id: string }>(`SELECT "id" FROM "Place" WHERE "id" = $1`, [placeId]);
    if (!place) {
      return NextResponse.json({ message: "المعلم غير موجود" }, { status: 404 });
    }

    const existing = await queryOne<{ id: string }>(
      `SELECT "id" FROM "Wishlist" WHERE "userId" = $1 AND "placeId" = $2`,
      [sessionUser.id, placeId],
    );

    if (existing) {
      await query(`DELETE FROM "Wishlist" WHERE "id" = $1`, [existing.id]);
      return NextResponse.json({ message: "تمت الإزالة من المفضلة", isFavorited: false });
    }

    await query(`INSERT INTO "Wishlist" ("userId", "placeId") VALUES ($1, $2)`, [sessionUser.id, placeId]);
    return NextResponse.json({ message: "تمت الإضافة للمفضلة ❤️", isFavorited: true });
  } catch (error) {
    console.error("Wishlist POST Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

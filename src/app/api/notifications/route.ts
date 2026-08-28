import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json([]);

    const notifications = await query(
      `SELECT * FROM "Notification" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 10`,
      [sessionUser.id],
    );

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Notifications GET Error:", error);
    return NextResponse.json([]);
  }
}

// تعليم إشعار كمقروء — مع فحص الملكية
export async function PUT(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ success: false }, { status: 401 });

    const body = await req.json().catch(() => null);
    const notificationId = body?.notificationId;
    if (!notificationId || typeof notificationId !== "string") {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // القيد بـ userId يضمن أن الإشعار يخص المستخدم الحالي فقط
    await query(
      `UPDATE "Notification" SET "isRead" = true WHERE "id" = $1 AND "userId" = $2`,
      [notificationId, sessionUser.id],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications PUT Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

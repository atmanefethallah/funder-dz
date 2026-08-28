import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// 🔔 الاشتراك في الإشعارات الفورية (Web Push)
export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ message: "يرجى تسجيل الدخول" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const sub = body?.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return NextResponse.json({ message: "بيانات اشتراك غير صالحة" }, { status: 400 });
    }

    // upsert على endpoint الفريد (جهاز واحد = اشتراك واحد)
    await query(
      `INSERT INTO "PushSubscription" ("userId", "endpoint", "p256dh", "auth")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("endpoint") DO UPDATE SET "userId" = $1, "p256dh" = $3, "auth" = $4`,
      [sessionUser.id, sub.endpoint, sub.keys.p256dh, sub.keys.auth],
    );

    return NextResponse.json({ message: "تم تفعيل الإشعارات الفورية 🔔" }, { status: 201 });
  } catch (error) {
    console.error("Push Subscribe Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

// 🔕 إلغاء الاشتراك
export async function DELETE(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ message: "يرجى تسجيل الدخول" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const endpoint = body?.endpoint;
    if (!endpoint) return NextResponse.json({ message: "endpoint مفقود" }, { status: 400 });

    await query(`DELETE FROM "PushSubscription" WHERE "endpoint" = $1 AND "userId" = $2`, [endpoint, sessionUser.id]);

    return NextResponse.json({ message: "تم إيقاف الإشعارات" });
  } catch (error) {
    console.error("Push Unsubscribe Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

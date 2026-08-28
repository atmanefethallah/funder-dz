import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const admin = await requireRole("ADMIN");
    if (!admin) return NextResponse.json({ message: "مرفوض" }, { status: 403 });

    const body = await req.json().catch(() => null);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const link = typeof body?.link === "string" ? body.link.trim() : null;

    if (!title || !message) {
      return NextResponse.json(
        { message: "العنوان والرسالة مطلوبان" },
        { status: 400 },
      );
    }

    if (title.length > 120 || message.length > 1000) {
      return NextResponse.json(
        { message: "العنوان أو الرسالة طويلة جداً" },
        { status: 400 },
      );
    }

    // جلب جميع السياح وبث الإشعار لهم
    const tourists = await query<{ id: string }>(`SELECT "id" FROM "User" WHERE "role" = 'TOURIST'`);

    if (tourists.length > 0) {
      const values: string[] = [];
      const params: unknown[] = [];
      tourists.forEach((t, i) => {
        const base = i * 4;
        values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
        params.push(title, message, link || null, t.id);
      });
      await query(
        `INSERT INTO "Notification" ("title", "message", "link", "userId") VALUES ${values.join(", ")}`,
        params,
      );
    }

    return NextResponse.json({
      message: `تم إرسال الإشعار إلى ${tourists.length} سائحاً بنجاح! 🚀`,
    });
  } catch (error) {
    console.error("Admin Broadcast Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

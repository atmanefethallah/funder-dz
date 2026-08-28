import { NextResponse } from "next/server";
import { query, queryOne, withTransaction } from "@/lib/db";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

type PendingPartnerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  commercialRegistry: string | null;
  idCard: string | null;
  createdAt: Date;
};

// 🔍 جلب الشركاء الذين رفعوا وثائقهم وينتظرون التفعيل (للمدير فقط)
export async function GET() {
  try {
    const admin = await requireRole("ADMIN");
    if (!admin) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });

    const pendingPartners = await query<PendingPartnerRow>(
      `SELECT "id", "name", "email", "phone", "commercialRegistry", "idCard", "createdAt"
       FROM "User" WHERE "verificationStatus" = 'PENDING' ORDER BY "createdAt" DESC LIMIT 100`,
    );

    return NextResponse.json(pendingPartners);
  } catch (error) {
    console.error("GET Partner Requests Error:", error);
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}

// 🔄 الموافقة على الشريك أو رفض وثائقه (للمدير فقط)
export async function PUT(req: Request) {
  try {
    const admin = await requireRole("ADMIN");
    if (!admin) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });

    const body = await req.json().catch(() => null);
    const userId = body?.userId;
    const action = body?.action;

    if (!userId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
    }

    const target = await queryOne<{ id: string; verificationStatus: string }>(
      `SELECT "id", "verificationStatus" FROM "User" WHERE "id" = $1`,
      [userId],
    );
    if (!target) {
      return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });
    }

    if (action === "APPROVE") {
      await withTransaction(async (tx) => {
        await tx.query(
          `UPDATE "User" SET "role" = 'PARTNER', "verificationStatus" = 'VERIFIED', "isVerified" = true WHERE "id" = $1`,
          [userId],
        );
        await tx.query(
          `INSERT INTO "Notification" ("userId", "title", "message", "link") VALUES ($1, $2, $3, $4)`,
          [
            userId,
            "🎉 تم تفعيل حسابك كشريك!",
            "أهلاً بك في عائلة Funder. تمت مراجعة وثائقك واعتمادها. يمكنك الآن إضافة معالمك السياحية واستقبال الحجوزات على الفور.",
            "/partner-dashboard",
          ],
        );
      });

      return NextResponse.json({ message: "✅ تم تفعيل حساب الشريك وإرسال الإشعار بنجاح!" });
    }

    // REJECT — إعادة الحساب للحالة غير الموثقة وتصفير الوثائق لإتاحة الرفع مجدداً
    await withTransaction(async (tx) => {
      await tx.query(
        `UPDATE "User" SET "verificationStatus" = 'UNVERIFIED', "isVerified" = false, "commercialRegistry" = NULL, "idCard" = NULL WHERE "id" = $1`,
        [userId],
      );
      await tx.query(
        `INSERT INTO "Notification" ("userId", "title", "message", "link") VALUES ($1, $2, $3, $4)`,
        [
          userId,
          "⚠️ تنبيه بخصوص توثيق حسابك",
          "عذراً، لم نتمكن من اعتماد وثائقك القانونية. يرجى التأكد من وضوح الصورة وصلاحية السجل التجاري وإعادة رفعها من جديد عبر حسابك.",
          "/profile",
        ],
      );
    });

    return NextResponse.json({ message: "❌ تم رفض المستندات وإرسال إشعار للمستخدم للتوضيح." });
  } catch (error) {
    console.error("PUT Partner Requests Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ في الخادم أثناء معالجة الطلب" },
      { status: 500 },
    );
  }
}

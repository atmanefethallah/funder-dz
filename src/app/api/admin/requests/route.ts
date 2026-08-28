import { NextResponse } from "next/server";
import { query, queryOne, withTransaction } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { recordLedger } from "@/lib/ledger";

export const dynamic = "force-dynamic";

type RechargeRequestRow = {
  id: string;
  amount: string;
  receiptUrl: string;
  transactionId: string | null;
  status: string;
  userId: string;
  createdAt: Date;
  user_name: string;
  user_email: string;
};

// 📥 جلب طلبات الشحن المعلقة (للمدير فقط)
export async function GET() {
  try {
    const admin = await requireRole("ADMIN");
    if (!admin) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });

    const rows = await query<RechargeRequestRow>(
      `SELECT r.*, u."name" AS user_name, u."email" AS user_email
       FROM "RechargeRequest" r
       JOIN "User" u ON u."id" = r."userId"
       WHERE r."status" = 'PENDING'
       ORDER BY r."createdAt" DESC
       LIMIT 200`,
    );

    const requests = rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      receiptUrl: r.receiptUrl,
      transactionId: r.transactionId,
      status: r.status,
      userId: r.userId,
      createdAt: r.createdAt,
      user: { name: r.user_name, email: r.user_email },
    }));

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Admin RechargeRequests GET Error:", error);
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}

// ⚙️ الموافقة أو الرفض على طلب الشحن (للمدير فقط) مع توثيق دفتر الأستاذ
export async function PUT(request: Request) {
  try {
    // 🛡️ كان هذا المسار بلا أي فحص صلاحية سابقاً — أغلق الآن
    const admin = await requireRole("ADMIN");
    if (!admin) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });

    const body = await request.json().catch(() => null);
    const requestId = body?.requestId;
    const action = body?.action;

    if (!requestId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
    }

    const rechargeRequest = await queryOne<{
      id: string;
      amount: string;
      transactionId: string | null;
      status: string;
      userId: string;
    }>(`SELECT * FROM "RechargeRequest" WHERE "id" = $1`, [requestId]);

    if (!rechargeRequest || rechargeRequest.status !== "PENDING") {
      return NextResponse.json(
        { message: "هذا الطلب غير صالح أو تمت معالجته مسبقاً" },
        { status: 400 },
      );
    }

    const amount = Number(rechargeRequest.amount);

    if (action === "APPROVE") {
      await withTransaction(async (tx) => {
        await tx.query(`UPDATE "RechargeRequest" SET "status" = 'APPROVED' WHERE "id" = $1`, [requestId]);

        await tx.query(`UPDATE "User" SET "balance" = "balance" + $1 WHERE "id" = $2`, [amount, rechargeRequest.userId]);

        await recordLedger(tx, {
          userId: rechargeRequest.userId,
          type: "RECHARGE_TOPUP",
          direction: "CREDIT",
          amount,
          reference: requestId,
          note: `شحن عبر وصل تحويل — عملية رقم ${rechargeRequest.transactionId ?? "—"}`,
        });

        await tx.query(
          `INSERT INTO "Notification" ("userId", "title", "message", "link") VALUES ($1, $2, $3, $4)`,
          [
            rechargeRequest.userId,
            "✅ تم شحن محفظتك!",
            `تمت الموافقة على طلب الشحن وإضافة ${amount} د.ج إلى رصيدك.`,
            "/wallet",
          ],
        );
      });

      return NextResponse.json({ message: "تم قبول الطلب وشحن رصيد المستخدم بنجاح!" });
    }

    // REJECT
    await withTransaction(async (tx) => {
      await tx.query(`UPDATE "RechargeRequest" SET "status" = 'REJECTED' WHERE "id" = $1`, [requestId]);

      await tx.query(
        `INSERT INTO "Notification" ("userId", "title", "message", "link") VALUES ($1, $2, $3, $4)`,
        [
          rechargeRequest.userId,
          "❌ تم رفض طلب الشحن",
          "تعذر التحقق من عملية التحويل. يرجى التأكد من رقم العملية ووضوح الوصل وإعادة المحاولة.",
          "/profile",
        ],
      );
    });

    return NextResponse.json({ message: "تم رفض الطلب بنجاح." });
  } catch (error) {
    console.error("Admin RechargeRequests PUT Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ في الخادم أثناء معالجة الطلب" },
      { status: 500 },
    );
  }
}

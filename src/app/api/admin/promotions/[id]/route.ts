import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { recordLedger } from "@/lib/ledger";

const text = (v: unknown, max = 2000) =>
  String(v ?? "")
    .trim()
    .slice(0, max);

// موافقة أو رفض حملة ترويج من لوحة تحكم الإدارة. لا يحذف أي شيء، يحدّث فقط حالة
// الحملة ويفرج المبلغ المحجوز للشريك في حال الرفض.
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const admin = await requireRole("ADMIN");
  if (!admin)
    return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (action !== "approve" && action !== "reject")
    return NextResponse.json({ message: "إجراء غير صالح" }, { status: 400 });
  if (action === "reject" && !text(body?.reason))
    return NextResponse.json(
      { message: "يرجى ذكر سبب الرفض" },
      { status: 400 },
    );

  try {
    await withTransaction(async (tx) => {
      const promoRes = await tx.query<{
        id: string;
        partnerId: string;
        name: string;
        status: string;
        reservedAmount: string;
        startAt: string;
        endAt: string;
      }>(
        `SELECT "id","partnerId","name","status","reservedAmount","startAt","endAt" FROM "Promotion" WHERE "id" = $1 FOR UPDATE`,
        [params.id],
      );
      const promo = promoRes.rows[0];
      if (!promo) throw new Error("الحملة غير موجودة");
      if (promo.status !== "PENDING_REVIEW" && promo.status !== "DRAFT")
        throw new Error("لا يمكن مراجعة حملة تمت مراجعتها بالفعل");

      if (action === "approve") {
        const now = new Date();
        const newStatus =
          now >= new Date(promo.startAt) && now <= new Date(promo.endAt)
            ? "ACTIVE"
            : "PAUSED";
        await tx.query(
          `UPDATE "Promotion" SET "status"=$1,"approvedById"=$2,"approvedAt"=NOW(),"rejectionReason"=NULL,"updatedAt"=NOW() WHERE "id"=$3`,
          [newStatus, admin.id, promo.id],
        );
        await tx.query(
          `INSERT INTO "Notification" ("userId","title","message","link") VALUES ($1,'تمت الموافقة على حملتك! 🎉',$2,'/partner-dashboard/promote')`,
          [
            promo.partnerId,
            `وافقت الإدارة على حملة "${promo.name}" وأصبحت ستعمل.`,
          ],
        );
      } else {
        const reservedAmount = Number(promo.reservedAmount) || 0;
        await tx.query(
          `UPDATE "Promotion" SET "status"='REJECTED',"rejectionReason"=$1,"approvedById"=$2,"approvedAt"=NOW(),"reservedAmount"=0,"updatedAt"=NOW() WHERE "id"=$3`,
          [text(body.reason, 2000), admin.id, promo.id],
        );
        if (reservedAmount > 0) {
          await tx.query(
            `UPDATE "User" SET "balance"="balance"+$1,"reservedBalance"=GREATEST(0,"reservedBalance"-$1) WHERE "id"=$2`,
            [reservedAmount, promo.partnerId],
          );
          await tx.query(
            `INSERT INTO "PromotionTransaction" ("id","promotionId","partnerId","kind","amount","status") VALUES ($1,$2,$3,'RELEASE',$4,'COMPLETED')`,
            [randomUUID(), promo.id, promo.partnerId, reservedAmount],
          );
          await recordLedger(tx, {
            userId: promo.partnerId,
            type: "PROMOTION_RELEASE",
            direction: "CREDIT",
            amount: reservedAmount,
            reference: promo.id,
            note: `إفراج ميزانية حملة مرفوضة: ${promo.name}`,
          });
        }
        await tx.query(
          `INSERT INTO "Notification" ("userId","title","message","link") VALUES ($1,'تم رفض حملتك',$2,'/partner-dashboard/promote')`,
          [
            promo.partnerId,
            `تم رفض حملة "${promo.name}": ${text(body.reason, 300)}. تم إرجاع المبلغ المحجوز إلى محفظتك.`,
          ],
        );
      }
    });
    return NextResponse.json({
      message:
        action === "approve"
          ? "تمت الموافقة على الحملة"
          : "تم رفض الحملة وإرجاع المبلغ",
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "تعذر تنفيذ الإجراء" },
      { status: 400 },
    );
  }
}

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { recordLedger } from "@/lib/ledger";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await requireRole("PARTNER", "ADMIN");
  if (!user) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  const [places, packages, campaigns] = await Promise.all([
    query(
      `SELECT "id","name","category","eventEndsAt" FROM "Place" WHERE "userId"=$1 ORDER BY "createdAt" DESC`,
      [user.id],
    ),
    query(
      `SELECT "key","name","durationDays","reach","priority" FROM "PromotionPackage" WHERE "active"=true ORDER BY "durationDays"`,
    ),
    query(
      `SELECT pr."id",pr."name",pr."status",pr."budget",pr."startAt",pr."endAt",p."name" AS "placeName" FROM "Promotion" pr JOIN "Place" p ON p."id"=pr."placeId" WHERE pr."partnerId"=$1 ORDER BY pr."createdAt" DESC LIMIT 50`,
      [user.id],
    ),
  ]);
  return NextResponse.json({ places, packages, campaigns });
}
export async function POST(req: Request) {
  const user = await requireRole("PARTNER", "ADMIN");
  if (!user) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b?.placeId || !b?.packageKey || !b?.startAt)
    return NextResponse.json(
      { message: "بيانات الحملة ناقصة" },
      { status: 400 },
    );
  try {
    const result = await withTransaction(async (tx) => {
      const owned = await tx.query(
        `SELECT "id","name","eventEndsAt" FROM "Place" WHERE "id"=$1 AND "userId"=$2 FOR SHARE`,
        [b.placeId, user.id],
      );
      if (!owned.rows[0]) throw new Error("لا يمكنك ترويج عنصر لا تملكه");
      const pack = await tx.query(
        `SELECT * FROM "PromotionPackage" WHERE "key"=$1 AND "active"=true`,
        [b.packageKey],
      );
      const p: any = pack.rows[0];
      if (!p) throw new Error("الباقة غير متاحة");
      const settings = await tx.query(
        `SELECT "key","value" FROM "PromotionSetting" WHERE "key" IN ('durationPrices','reachMultipliers','priorityMultipliers')`,
      );
      const map = Object.fromEntries(
        settings.rows.map((x: any) => [x.key, x.value]),
      );
      const base = Number(
        map.durationPrices?.[String(p.durationDays)] ?? p.basePrice,
      );
      const reach = Number(map.reachMultipliers?.[p.reach] ?? 1);
      const priority = Number(map.priorityMultipliers?.[p.priority] ?? 1);
      const budget = Math.round(base * reach * priority * 100) / 100;
      const start = new Date(b.startAt);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + Number(p.durationDays));
      if (Number.isNaN(start.getTime()))
        throw new Error("تاريخ البداية غير صالح");
      if (
        owned.rows[0].eventEndsAt &&
        end > new Date(owned.rows[0].eventEndsAt)
      )
        throw new Error("الحملة لا يمكن أن تتجاوز نهاية الفعالية");
      const debit = await tx.query(
        `UPDATE "User" SET "balance"="balance"-$1,"reservedBalance"="reservedBalance"+$1 WHERE "id"=$2 AND "balance">=$1 RETURNING "balance","reservedBalance"`,
        [budget, user.id],
      );
      if (!debit.rows[0]) throw new Error("رصيد المحفظة غير كافٍ");
      const id = randomUUID();
      await tx.query(
        `INSERT INTO "Promotion" ("id","partnerId","placeId","packageId","name","startAt","endAt","reach","priority","budget","reservedAmount","status") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,'PENDING_REVIEW')`,
        [
          id,
          user.id,
          b.placeId,
          p.id,
          `ترويج ${owned.rows[0].name}`,
          start.toISOString(),
          end.toISOString(),
          p.reach,
          p.priority,
          budget,
        ],
      );
      await tx.query(
        `INSERT INTO "PromotionTransaction" ("id","promotionId","partnerId","kind","amount","status") VALUES ($1,$2,$3,'RESERVE',$4,'COMPLETED')`,
        [randomUUID(), id, user.id, budget],
      );
      await recordLedger(tx, {
        userId: user.id,
        type: "PROMOTION_RESERVE",
        direction: "DEBIT",
        amount: budget,
        reference: id,
        note: `حجز ميزانية حملة ${owned.rows[0].name}`,
      });
      await tx.query(
        `INSERT INTO "Notification" ("userId","title","message","link") VALUES ($1,'تم إنشاء الحملة','الحملة بانتظار مراجعة الإدارة','/partner-dashboard/promote')`,
        [user.id],
      );
      return { id, budget, balance: debit.rows[0].balance };
    });
    return NextResponse.json(
      { message: "تم حجز الميزانية وإرسال الحملة للمراجعة", ...result },
      { status: 201 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || "تعذر إنشاء الحملة" },
      { status: 400 },
    );
  }
}

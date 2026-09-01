import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

// قائمة جميع حملات Funder Promote لمراجعة الإدارة (موافقة/رفض).
export async function GET() {
  const admin = await requireRole("ADMIN");
  if (!admin)
    return NextResponse.json({ message: "غير مصرح" }, { status: 403 });

  const campaigns = await query<Record<string, unknown>>(
    `SELECT pr."id", pr."name", pr."status", pr."budget", pr."reservedAmount", pr."spentAmount",
            pr."startAt", pr."endAt", pr."reach", pr."priority", pr."rejectionReason", pr."createdAt",
            pr."approvedAt",
            p."name" AS "placeName", p."imageUrl" AS "placeImage", p."itemType" AS "placeItemType",
            u."name" AS "partnerName", u."email" AS "partnerEmail",
            COALESCE(imp.cnt, 0) AS impressions,
            COALESCE(clk.cnt, 0) AS clicks,
            COALESCE(cv.cnt, 0) AS conversions
     FROM "Promotion" pr
     JOIN "Place" p ON p."id" = pr."placeId"
     JOIN "User" u ON u."id" = pr."partnerId"
     LEFT JOIN (SELECT "promotionId", COUNT(*)::int AS cnt FROM "PromotionImpression" GROUP BY "promotionId") imp ON imp."promotionId" = pr."id"
     LEFT JOIN (SELECT "promotionId", COUNT(*)::int AS cnt FROM "PromotionClick" GROUP BY "promotionId") clk ON clk."promotionId" = pr."id"
     LEFT JOIN (SELECT "promotionId", COUNT(*)::int AS cnt FROM "PromotionConversion" GROUP BY "promotionId") cv ON cv."promotionId" = pr."id"
     ORDER BY
       CASE pr."status" WHEN 'PENDING_REVIEW' THEN 0 ELSE 1 END,
       pr."createdAt" DESC
     LIMIT 200`,
  );

  return NextResponse.json({ campaigns });
}

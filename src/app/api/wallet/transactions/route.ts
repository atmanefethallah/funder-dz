import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type WalletTransactionRow = {
  id: string;
  userId: string;
  type: string;
  direction: string;
  amount: string;
  reference: string | null;
  note: string | null;
  createdAt: Date;
};

// 📒 سجل عمليات المحفظة — يقرأ من دفتر الأستاذ WalletTransaction
export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json(null, { status: 401 });

    // ترقيم بسيط عبر ?take= و ?skip=
    const { searchParams } = new URL(req.url);
    const take = Math.min(Number(searchParams.get("take")) || 20, 100);
    const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);

    const [transactions, totalRow] = await Promise.all([
      query<WalletTransactionRow>(
        `SELECT * FROM "WalletTransaction" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
        [sessionUser.id, take, skip],
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM "WalletTransaction" WHERE "userId" = $1`,
        [sessionUser.id],
      ),
    ]);

    // تحويل الرقم إلى Number لتسلسل JSON سليم
    const serialized = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));

    const total = totalRow ? parseInt(totalRow.count, 10) : 0;

    return NextResponse.json({ transactions: serialized, total });
  } catch (error) {
    console.error("Wallet Transactions GET Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

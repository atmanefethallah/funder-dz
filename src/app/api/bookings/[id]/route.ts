import { NextResponse } from "next/server";
import { queryOne, withTransaction } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { recordLedger } from "@/lib/ledger";

type BookingRow = { id: string; userId: string; placeId: string; amount: string; status: string };
type PlaceRow = { id: string; name: string; userId: string };

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const booking = await queryOne<BookingRow>(
      `SELECT "id", "userId", "placeId", "amount", "status" FROM "Booking" WHERE "id" = $1`,
      [params.id],
    );

    if (!booking || booking.userId !== sessionUser.id) {
      return NextResponse.json(
        { message: "التذكرة غير موجودة أو لا تملك صلاحية حذفها." },
        { status: 403 }
      );
    }

    if (booking.status === "USED") {
      return NextResponse.json(
        { message: "لا يمكن حذف تذكرة مستخدمة، فهي جزء من سجل زياراتك." },
        { status: 400 }
      );
    }

    const amount = Number(booking.amount);
    const refundable = amount > 0 && (booking.status === "PENDING" || booking.status === "CONFIRMED");

    await withTransaction(async (tx) => {
      if (refundable) {
        const placeRes = await tx.query<PlaceRow>(`SELECT "id", "name", "userId" FROM "Place" WHERE "id" = $1`, [booking.placeId]);
        const place = placeRes.rows[0];

        if (place) {
          await tx.query(`UPDATE "User" SET "balance" = "balance" - $1 WHERE "id" = $2`, [amount, place.userId]);
          await recordLedger(tx, {
            userId: place.userId,
            type: "PARTNER_REFUND_DEDUCTION",
            direction: "DEBIT",
            amount,
            reference: booking.id,
            note: `خصم استرداد عربون: ${place.name}`,
          });
        }

        await tx.query(`UPDATE "User" SET "balance" = "balance" + $1 WHERE "id" = $2`, [amount, sessionUser.id]);
        await recordLedger(tx, {
          userId: sessionUser.id,
          type: "BOOKING_REFUND",
          direction: "CREDIT",
          amount,
          reference: booking.id,
          note: "استرداد عربون بعد حذف التذكرة",
        });
      }

      await tx.query(`DELETE FROM "Booking" WHERE "id" = $1`, [params.id]);
    });

    return NextResponse.json(
      {
        message: refundable
          ? `تم حذف التذكرة واسترداد ${amount} د.ج إلى محفظتك.`
          : "تم حذف التذكرة نهائياً.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json({ message: "حدث خطأ داخلي في الخادم." }, { status: 500 });
  }
}

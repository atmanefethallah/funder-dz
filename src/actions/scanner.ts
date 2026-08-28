// src/actions/scanner.ts — التحقق من التذكرة واستهلاكها (Server Action للماسح)
"use server";

import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/session";

type ScannedBookingRow = {
  id: string;
  status: string;
  amount: string;
  place_userId: string;
  place_name: string;
  place_price: string;
  user_name: string;
};

export async function validateTicket(scannedData: string) {
  try {
    // 🛡️ كان هذا الإجراء بلا مصادقة سابقاً — أगلق الآن: شركاء فقط
    const sessionUser = await requireRole("PARTNER", "ADMIN");
    if (!sessionUser) {
      return { success: false, message: "गير مصرح — الماسح للشركاء فقط." };
    }

    const token = (scannedData || "").trim();
    if (!token) {
      return { success: false, message: "رمز ممسوح فارग." };
    }

    // البحث برمز QR السري (qrToken) وليس بمعرّف الحجز القابل للتخمين
    const booking = await queryOne<ScannedBookingRow>(
      `SELECT b."id", b."status", b."amount",
              p."userId" AS "place_userId", p."name" AS "place_name", p."price" AS "place_price",
              u."name" AS "user_name"
       FROM "Booking" b
       JOIN "Place" p ON p."id" = b."placeId"
       JOIN "User" u ON u."id" = b."userId"
       WHERE b."qrToken" = $1`,
      [token],
    );

    if (!booking) {
      return { success: false, message: "❌ التذكرة गير صالحة أو गير موجودة في النظام." };
    }

    // التذكرة تخص معالم هذا الشريك فقط (المدير مستثنى)
    if (sessionUser.role !== "ADMIN" && booking.place_userId !== sessionUser.id) {
      return { success: false, message: "❌ هذه التذكرة لا تتبع لمعالمك السياحية!" };
    }

    if (booking.status === "PENDING") {
      return { success: false, message: "⚠️ هذه التذكرة لا تزال قيد الانتظار ولم يتم قبولها بعد." };
    }

    if (booking.status === "REJECTED") {
      return { success: false, message: "❌ هذه التذكرة تم رفضها مسبقاً." };
    }

    if (booking.status === "USED") {
      return { success: false, message: "⚠️ التذكرة صحيحة، لكنها استُخدمت ومسحت مسبقاً!" };
    }

    // 🛡️ استهلاك ذرّي — يمنع الاستخدام المزدوج حتى مع مسحين متزامنين
    const consumed = await query(
      `UPDATE "Booking" SET "status" = 'USED' WHERE "id" = $1 AND "status" = 'CONFIRMED' RETURNING "id"`,
      [booking.id],
    );
    if (consumed.length === 0) {
      return { success: false, message: "⚠️ تم مسح هذه التذكرة للتو من جهاز آخر!" };
    }

    // المبلग المتبقي للتحصيل نقداً عند البوابة
    const remainingAmount = Math.max(Number(booking.place_price) - Number(booking.amount), 0);

    return {
      success: true,
      message: "✅ تذكرة صالحة ومؤكدة! تم تسجيل الدخول.",
      touristName: booking.user_name,
      placeName: booking.place_name,
      remainingAmount,
    };
  } catch (error) {
    console.error("validateTicket Error:", error);
    return { success: false, message: "حدث خطأ في الخادم أثناء التحقق." };
  }
}

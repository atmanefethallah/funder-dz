import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

type RoomType = { name: string; price: number };

function parseRoomTypes(raw: FormDataEntryValue | null): RoomType[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({ name: String(item?.name || "").trim().slice(0, 80), price: Number(item?.price) }))
      .filter((item) => item.name && Number.isFinite(item.price) && item.price >= 0)
      .slice(0, 20);
  } catch {
    return [];
  }
}

// ✏️ تعديل معلم — مع فحص الملكية ودعم الفندق والفعالية المؤقتة.
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });

    const existingPlace = await queryOne<{ userId: string }>(
      `SELECT "userId" FROM "Place" WHERE "id" = $1`,
      [params.id],
    );
    if (!existingPlace) return NextResponse.json({ message: "المعلم غير موجود" }, { status: 404 });
    if (existingPlace.userId !== sessionUser.id && sessionUser.role !== "ADMIN") {
      return NextResponse.json({ message: "عملية مرفوضة! لا تملك صلاحية تعديل هذا المعلم ⛔" }, { status: 403 });
    }

    const data = await request.formData();
    const name = String(data.get("name") || "").trim();
    const category = String(data.get("category") || "").trim();
    const description = String(data.get("description") || "").trim().slice(0, 5000);
    const virtualTourUrl = String(data.get("virtualTourUrl") || "").trim();
    const price = Number(data.get("price") || 0);
    const lat = Number(data.get("latitude"));
    const lng = Number(data.get("longitude"));
    const isEvent = data.get("isEvent") === "1" || data.get("isEvent") === "true" || category === "فعالية";
    const eventEndsAtRaw = String(data.get("eventEndsAt") || "").trim();
    const roomTypes = category === "فندق" ? parseRoomTypes(data.get("roomTypes")) : [];

    if (!name || !category || name.length > 120) {
      return NextResponse.json({ message: "يرجى إدخال اسم وتصنيف صالحين" }, { status: 400 });
    }
    if (!Number.isFinite(price) || price < 0 || price > 100_000_000) {
      return NextResponse.json({ message: "السعر غير صالح" }, { status: 400 });
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return NextResponse.json({ message: "إحداثيات غير صالحة" }, { status: 400 });
    }

    let eventEndsAt: string | null = null;
    if (isEvent) {
      const parsedEnd = new Date(eventEndsAtRaw);
      if (!eventEndsAtRaw || Number.isNaN(parsedEnd.getTime())) {
        return NextResponse.json({ message: "يجب تحديد تاريخ انتهاء صالح للفعالية" }, { status: 400 });
      }
      eventEndsAt = parsedEnd.toISOString();
    }
    if (category === "فندق" && roomTypes.length === 0) {
      return NextResponse.json({ message: "أضف نوع غرفة واحداً على الأقل" }, { status: 400 });
    }

    const updatedPlace = await queryOne(
      `UPDATE "Place"
       SET "name" = $1, "category" = $2, "description" = $3, "price" = $4,
           "virtualTourUrl" = $5, "latitude" = $6, "longitude" = $7,
           "isEvent" = $8, "eventEndsAt" = $9, "roomTypes" = $10::jsonb
       WHERE "id" = $11
       RETURNING *`,
      [name, category, description, price, virtualTourUrl || null, lat, lng, isEvent, eventEndsAt, JSON.stringify(roomTypes), params.id],
    );

    return NextResponse.json({ message: "تم التحديث بنجاح!", place: updatedPlace });
  } catch (error) {
    console.error("Update Place Error:", error);
    return NextResponse.json({ message: "حدث خطأ داخلي في الخادم" }, { status: 500 });
  }
}

// 🗑️ حذف معلم — المالك أو المدير فقط.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ message: "يرجى تسجيل الدخول" }, { status: 401 });

    const existingPlace = await queryOne<{ userId: string }>(
      `SELECT "userId" FROM "Place" WHERE "id" = $1`,
      [params.id],
    );
    if (!existingPlace) return NextResponse.json({ message: "المعلم غير موجود" }, { status: 404 });
    if (existingPlace.userId !== sessionUser.id && sessionUser.role !== "ADMIN") {
      return NextResponse.json({ message: "عملية مرفوضة! لا تملك صلاحية حذف هذا المعلم ⛔" }, { status: 403 });
    }

    await queryOne(`DELETE FROM "Place" WHERE "id" = $1 RETURNING "id"`, [params.id]);
    return NextResponse.json({ message: "تم حذف المعلم نهائياً" });
  } catch (error) {
    console.error("Delete Place Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

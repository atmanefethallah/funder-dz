import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// ✏️ تعديل معلم — مع فحص الملكية
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: "गير مصرح" }, { status: 401 });
    }

    const existingPlace = await queryOne<{ userId: string }>(
      `SELECT "userId" FROM "Place" WHERE "id" = $1`,
      [params.id],
    );
    if (!existingPlace) {
      return NextResponse.json({ message: "المعلم गير موجود" }, { status: 404 });
    }

    // 🛡️ فحص الملكية: المالك أو المدير فقط
    if (existingPlace.userId !== sessionUser.id && sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "عملية مرفوضة! لا تملك صلاحية تعديل هذا المعلم ⛔" },
        { status: 403 }
      );
    }

    const data = await request.formData();
    const name = (data.get("name") as string)?.trim();
    const category = (data.get("category") as string)?.trim();
    const description = ((data.get("description") as string) || "").trim();
    const priceStr = data.get("price") as string;
    const virtualTourUrl = (data.get("virtualTourUrl") as string)?.trim();
    const latStr = data.get("latitude") as string;
    const lngStr = data.get("longitude") as string;

    if (!name || !category) {
      return NextResponse.json(
        { message: "يرجى إدخال اسم وتصنيف المعلم" },
        { status: 400 }
      );
    }

    const price = Number(priceStr);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ message: "السعر गير صالح" }, { status: 400 });
    }

    const lat = latStr ? parseFloat(latStr) : null;
    const lng = lngStr ? parseFloat(lngStr) : null;
    if ((latStr && !Number.isFinite(lat)) || (lngStr && !Number.isFinite(lng))) {
      return NextResponse.json({ message: "إحداثيات गير صالحة" }, { status: 400 });
    }

    const updatedPlace = await queryOne(
      `UPDATE "Place"
       SET "name" = $1, "category" = $2, "description" = $3, "price" = $4,
           "virtualTourUrl" = $5, "latitude" = $6, "longitude" = $7
       WHERE "id" = $8
       RETURNING *`,
      [name, category, description, price, virtualTourUrl || null, lat, lng, params.id],
    );

    return NextResponse.json({ message: "تم التحديث بنجاح!", place: updatedPlace });
  } catch (error) {
    console.error("Update Place Error:", error);
    return NextResponse.json({ message: "حدث خطأ داخلي في الخادم" }, { status: 500 });
  }
}

// 🗑️ حذف معلم — المالك أو المدير فقط
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: "يرجى تسجيل الدخول" }, { status: 401 });
    }

    const existingPlace = await queryOne<{ userId: string }>(
      `SELECT "userId" FROM "Place" WHERE "id" = $1`,
      [params.id],
    );
    if (!existingPlace) {
      return NextResponse.json({ message: "المعلم गير موجود" }, { status: 404 });
    }

    if (existingPlace.userId !== sessionUser.id && sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "عملية مرفوضة! لا تملك صلاحية حذف هذا المعلم ⛔" },
        { status: 403 }
      );
    }

    await queryOne(`DELETE FROM "Place" WHERE "id" = $1 RETURNING "id"`, [params.id]);

    return NextResponse.json({ message: "تم حذف المعلم نهائياً" });
  } catch (error) {
    console.error("Delete Place Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

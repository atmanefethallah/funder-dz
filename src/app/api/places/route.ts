import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { isValidImage } from "@/lib/file-checks";
import { canCreatePlace } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

type PlaceListRow = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  imageUrl: string;
  virtualTourUrl: string | null;
  latitude: number;
  longitude: number;
  createdAt: Date;
  reviews: Array<{ rating: number }>;
};

// 📥 جلب المعالم للعرض العام — حقول محدودة، بحد أقصى، وبلا بيانات حساسة
export async function GET() {
  try {
    const rows = await query<PlaceListRow>(
      `SELECT p."id", p."name", p."category", p."description", p."price", p."imageUrl",
              p."virtualTourUrl", p."latitude", p."longitude", p."createdAt",
              COALESCE(
                json_agg(json_build_object('rating', r."rating")) FILTER (WHERE r."id" IS NOT NULL),
                '[]'
              ) AS reviews
       FROM "Place" p
       LEFT JOIN "Review" r ON r."placeId" = p."id"
       GROUP BY p."id"
       ORDER BY p."createdAt" DESC
       LIMIT 200`,
    );

    // تحويل Decimal إلى Number لتسلسل JSON سليم
    const serialized = rows.map((p) => ({ ...p, price: Number(p.price) }));
    return NextResponse.json(serialized);
  } catch (error) {
    console.error("GET Places Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

// إضافة معلم جديد — للشركاء الموثّقين والمدير فقط
export async function POST(request: Request) {
  try {
    const sessionUser = await requireRole("PARTNER", "ADMIN");
    if (!sessionUser) {
      return NextResponse.json(
        { message: "إضافة المعالم متاحة للشركاء فقط" },
        { status: 403 }
      );
    }

    // يجب أن يكون الشريك موثّقاً قبل النشر
    if (sessionUser.role === "PARTNER") {
      const dbUser = await queryOne<{ verificationStatus: string }>(
        `SELECT "verificationStatus" FROM "User" WHERE "id" = $1`,
        [sessionUser.id],
      );
      if (dbUser?.verificationStatus !== "VERIFIED") {
        return NextResponse.json(
          { message: "يجب توثيق حسابك أولاً من الإدارة قبل إضافة المعالم" },
          { status: 403 }
        );
      }
    }

    // 💎 بوابة الباقة: فرض حد عدد المعالم حسب الاشتراك
    const gate = await canCreatePlace(sessionUser.id);
    if (!gate.allowed) {
      return NextResponse.json({ message: gate.reason, upgrade: true }, { status: 402 });
    }

    const data = await request.formData();
    const name = (data.get("name") as string)?.trim();
    const category = (data.get("category") as string)?.trim();
    const description = ((data.get("description") as string) || "").trim();
    const priceStr = data.get("price") as string;
    const virtualTourUrl = (data.get("virtualTourUrl") as string)?.trim();
    const latStr = data.get("latitude") as string;
    const lngStr = data.get("longitude") as string;
    const file = data.get("image");

    if (!name || !category) {
      return NextResponse.json(
        { message: "يرجى إدخال اسم وتصنيف المعلم" },
        { status: 400 }
      );
    }

    if (name.length > 120) {
      return NextResponse.json({ message: "اسم المعلم طويل جداً" }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!latStr || !lngStr || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { message: "يرجى تحديد موقع المعلم على الخريطة أولاً" },
        { status: 400 }
      );
    }

    const price = Number(priceStr) || 0;
    if (price < 0 || price > 100_000_000) {
      return NextResponse.json({ message: "السعر غير صالح" }, { status: 400 });
    }

    let imageUrl = "";

    if (file && file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { message: "حجم الصورة كبير جداً! الحد الأقصى 5 ميغابايت." },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // 🛡️ فحص المحتوى الفعلي — منع رفع ملفات خبيثة متنكرة كصور
      if (!isValidImage(buffer)) {
        return NextResponse.json(
          { message: "الملف المرفق ليس صورة صالحة (JPG/PNG/WEBP)" },
          { status: 400 }
        );
      }

      imageUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    const newPlace = await queryOne(
      `INSERT INTO "Place" ("name", "category", "description", "price", "imageUrl", "virtualTourUrl", "latitude", "longitude", "userId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, category, description, price, imageUrl, virtualTourUrl || null, lat, lng, sessionUser.id],
    );

    return NextResponse.json(
      { message: "تمت إضافة المعلم وتثبيته على الخريطة بنجاح! 🚀🎉", place: newPlace },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add Place Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ داخلي في الخادم أثناء معالجة الحفظ" },
      { status: 500 }
    );
  }
}

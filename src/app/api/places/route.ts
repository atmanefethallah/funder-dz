import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { isValidImage } from "@/lib/file-checks";
import { canCreatePlace } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

type RoomType = { name: string; price: number };

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
  isEvent: boolean;
  eventEndsAt: Date | null;
  roomTypes: RoomType[] | null;
  createdAt: Date;
  reviews: Array<{ rating: number }>;
};

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

// 📥 جلب المعالم النشطة فقط؛ الفعاليات المنتهية تختفي تلقائياً من المنصة.
export async function GET() {
  try {
    const rows = await query<PlaceListRow>(
      `SELECT p."id", p."name", p."category", p."description", p."price", p."imageUrl",
              p."virtualTourUrl", p."latitude", p."longitude", p."isEvent", p."eventEndsAt",
              p."roomTypes", p."createdAt",
              COALESCE(
                json_agg(json_build_object('rating', r."rating")) FILTER (WHERE r."id" IS NOT NULL),
                '[]'
              ) AS reviews
       FROM "Place" p
       LEFT JOIN "Review" r ON r."placeId" = p."id"
       WHERE (p."isEvent" IS NOT TRUE OR p."eventEndsAt" IS NULL OR p."eventEndsAt" > NOW())
       GROUP BY p."id"
       ORDER BY p."createdAt" DESC
       LIMIT 200`,
    );

    return NextResponse.json(rows.map((p) => ({ ...p, price: Number(p.price) })));
  } catch (error) {
    console.error("GET Places Error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

// إضافة معلم/فندق/فعالية جديدة — للشركاء الموثّقين والمدير فقط.
export async function POST(request: Request) {
  try {
    const sessionUser = await requireRole("PARTNER", "ADMIN");
    if (!sessionUser) {
      return NextResponse.json({ message: "إضافة المعالم متاحة للشركاء فقط" }, { status: 403 });
    }

    if (sessionUser.role === "PARTNER") {
      const dbUser = await queryOne<{ verificationStatus: string }>(
        `SELECT "verificationStatus" FROM "User" WHERE "id" = $1`,
        [sessionUser.id],
      );
      if (dbUser?.verificationStatus !== "VERIFIED") {
        return NextResponse.json({ message: "يجب توثيق حسابك أولاً من الإدارة قبل إضافة المعالم" }, { status: 403 });
      }
    }

    const gate = await canCreatePlace(sessionUser.id);
    if (!gate.allowed) {
      return NextResponse.json({ message: gate.reason, upgrade: true }, { status: 402 });
    }

    const data = await request.formData();
    const name = String(data.get("name") || "").trim();
    const category = String(data.get("category") || "").trim();
    const description = String(data.get("description") || "").trim().slice(0, 5000);
    const virtualTourUrl = String(data.get("virtualTourUrl") || "").trim();
    const latStr = String(data.get("latitude") || "");
    const lngStr = String(data.get("longitude") || "");
    const file = data.get("image");
    const isEvent = data.get("isEvent") === "1" || data.get("isEvent") === "true" || category === "فعالية";
    const eventEndsAtRaw = String(data.get("eventEndsAt") || "").trim();
    const roomTypes = category === "فندق" ? parseRoomTypes(data.get("roomTypes")) : [];

    if (!name || !category || name.length > 120) {
      return NextResponse.json({ message: "يرجى إدخال اسم وتصنيف صالحين للمعلم" }, { status: 400 });
    }

    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return NextResponse.json({ message: "يرجى تحديد موقع صحيح على الخريطة" }, { status: 400 });
    }

    const price = Number(data.get("price") || 0);
    if (!Number.isFinite(price) || price < 0 || price > 100_000_000) {
      return NextResponse.json({ message: "السعر غير صالح" }, { status: 400 });
    }

    let eventEndsAt: string | null = null;
    if (isEvent) {
      const parsedEnd = new Date(eventEndsAtRaw);
      if (!eventEndsAtRaw || Number.isNaN(parsedEnd.getTime()) || parsedEnd <= new Date()) {
        return NextResponse.json({ message: "يجب تحديد تاريخ انتهاء مستقبلي للفعالية" }, { status: 400 });
      }
      eventEndsAt = parsedEnd.toISOString();
    }

    if (category === "فندق" && roomTypes.length === 0) {
      return NextResponse.json({ message: "أضف نوع غرفة واحداً على الأقل مع سعره" }, { status: 400 });
    }

    let imageUrl = "";
    if (file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ message: "حجم الصورة كبير جداً! الحد الأقصى 5 ميغابايت." }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      if (!isValidImage(buffer)) {
        return NextResponse.json({ message: "الملف المرفق ليس صورة صالحة (JPG/PNG/WEBP)" }, { status: 400 });
      }
      imageUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    const newPlace = await queryOne(
      `INSERT INTO "Place"
         ("name", "category", "description", "price", "imageUrl", "virtualTourUrl", "latitude", "longitude", "userId", "isEvent", "eventEndsAt", "roomTypes")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
       RETURNING *`,
      [name, category, description, price, imageUrl, virtualTourUrl || null, lat, lng, sessionUser.id, isEvent, eventEndsAt, JSON.stringify(roomTypes)],
    );

    return NextResponse.json({ message: "تم نشر العنصر وتثبيته على الخريطة بنجاح! 🚀🎉", place: newPlace }, { status: 201 });
  } catch (error) {
    console.error("Add Place Error:", error);
    return NextResponse.json({ message: "حدث خطأ داخلي في الخادم أثناء معالجة الحفظ" }, { status: 500 });
  }
}

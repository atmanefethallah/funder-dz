"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

type Plan = {
  name: string;
  price: string;
  mealPlan: string;
  paymentPolicy: string;
  depositPercent: string;
  minimumStay: string;
  freeCancellationHours: string;
  lateFeeType: string;
  noShowFeeType: string;
  nonRefundable: boolean;
};
type Room = {
  name: string;
  description: string;
  totalUnits: string;
  maxAdults: string;
  maxChildren: string;
  maxGuests: string;
  bedType: string;
  sizeSqm: string;
  viewType: string;
  privateBathroom: boolean;
  balcony: boolean;
  smokingAllowed: boolean;
  images: string;
  amenities: string[];
  ratePlans: Plan[];
};
const emptyPlan = (): Plan => ({
  name: "Flexible",
  price: "",
  mealPlan: "NONE",
  paymentPolicy: "DEPOSIT",
  depositPercent: "30",
  minimumStay: "1",
  freeCancellationHours: "48",
  lateFeeType: "ONE_NIGHT",
  noShowFeeType: "ONE_NIGHT",
  nonRefundable: false,
});
const emptyRoom = (): Room => ({
  name: "",
  description: "",
  totalUnits: "1",
  maxAdults: "2",
  maxChildren: "0",
  maxGuests: "2",
  bedType: "DOUBLE",
  sizeSqm: "",
  viewType: "NONE",
  privateBathroom: true,
  balcony: false,
  smokingAllowed: false,
  images: "",
  amenities: ["WIFI"],
  ratePlans: [emptyPlan()],
});
const steps = [
  "المعلومات",
  "الموقع والصور",
  "الغرف والأسعار",
  "السياسات والمعاينة",
];
const input =
  "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
export default function PropertyWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [data, setData] = useState<any>({
    name: "",
    propertyType: "HOTEL",
    officialClassification: "",
    stars: "",
    shortDescription: "",
    description: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    logoUrl: "",
    coverImageUrl: "",
    images: "",
    videoUrl: "",
    virtualTourUrl: "",
    state: "",
    municipality: "",
    address: "",
    latitude: "",
    longitude: "",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    childrenAllowed: true,
    childMaxAge: "12",
    childPrice: "",
    infantsAllowed: true,
    extraBedAllowed: false,
    extraBedPrice: "",
    maxExtraBeds: "0",
    smokingPolicy: "NON_SMOKING",
    petsPolicy: "NOT_ALLOWED",
    childrenPolicy: "",
    extraBedPolicy: "",
    parkingPolicy: "",
    specialConditions: "",
  });
  const [rooms, setRooms] = useState<Room[]>([emptyRoom()]);
  const set = (k: string, v: any) => setData((d: any) => ({ ...d, [k]: v }));
  const updateRoom = (i: number, k: keyof Room, v: any) =>
    setRooms((r) => r.map((x, n) => (n === i ? { ...x, [k]: v } : x)));
  const updatePlan = (ri: number, pi: number, k: keyof Plan, v: any) =>
    setRooms((r) =>
      r.map((x, n) =>
        n === ri
          ? {
              ...x,
              ratePlans: x.ratePlans.map((p, m) =>
                m === pi ? { ...p, [k]: v } : p,
              ),
            }
          : x,
      ),
    );
  const submit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        ...data,
        images: data.images
          .split("\n")
          .map((x: string) => x.trim())
          .filter(Boolean),
        rooms: rooms.map((r) => ({
          ...r,
          images: r.images
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean),
        })),
      };
      const res = await fetch("/api/partner/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.message);
      router.push(`/places/${out.placeId}`);
      router.refresh();
    } catch (e: any) {
      setMessage(e.message || "تعذر الحفظ");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="mx-auto max-w-5xl px-4 py-8" dir="rtl">
      <div className="mb-6 rounded-3xl bg-gradient-to-l from-blue-950 to-blue-700 p-6 text-white">
        <h1 className="text-2xl font-black">إضافة فندق أو إقامة</h1>
        <p className="mt-2 text-sm text-blue-100">
          السعر النهائي يأتي من الغرفة وخطة السعر والتوفر، وليس من سعر المعلم.
        </p>
      </div>
      <div className="mb-6 grid grid-cols-4 gap-2">
        {steps.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(i)}
            className={`rounded-xl p-2 text-xs font-bold ${i === step ? "bg-blue-600 text-white" : "bg-white text-gray-500 border"}`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>
      {message && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-3 font-bold text-red-700"
        >
          {message}
        </p>
      )}
      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="اسم المنشأة">
              <input
                className={input}
                value={data.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="نوع المنشأة">
              <select
                className={input}
                value={data.propertyType}
                onChange={(e) => set("propertyType", e.target.value)}
              >
                <option value="HOTEL">فندق</option>
                <option value="HOTEL_RESIDENCE">إقامة فندقية</option>
                <option value="TOURIST_RESIDENCE">إقامة سياحية</option>
                <option value="APARTMENTS">شقق سياحية</option>
                <option value="GUEST_HOUSE">دار ضيافة</option>
                <option value="HOSTEL">نزل</option>
                <option value="RESORT">منتجع</option>
                <option value="CAMP">مخيم</option>
                <option value="OTHER">أخرى</option>
              </select>
            </Field>
            <Field label="التصنيف الرسمي">
              <input
                className={input}
                value={data.officialClassification}
                onChange={(e) => set("officialClassification", e.target.value)}
              />
            </Field>
            <Field label="عدد النجوم">
              <input
                type="number"
                min="1"
                max="5"
                className={input}
                value={data.stars}
                onChange={(e) => set("stars", e.target.value)}
              />
            </Field>
            <Field label="وصف قصير">
              <input
                className={input}
                value={data.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
              />
            </Field>
            <Field label="الهاتف">
              <input
                className={input}
                value={data.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <Field label="WhatsApp">
              <input
                className={input}
                value={data.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
              />
            </Field>
            <Field label="البريد الإلكتروني">
              <input
                type="email"
                className={input}
                value={data.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="الموقع الإلكتروني">
              <input
                className={input}
                value={data.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </Field>
            <Field label="الوصف الكامل" wide>
              <textarea
                rows={5}
                className={input}
                value={data.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="الولاية">
              <input
                className={input}
                value={data.state}
                onChange={(e) => set("state", e.target.value)}
              />
            </Field>
            <Field label="البلدية">
              <input
                className={input}
                value={data.municipality}
                onChange={(e) => set("municipality", e.target.value)}
              />
            </Field>
            <Field label="العنوان" wide>
              <input
                className={input}
                value={data.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
            <Field label="Latitude">
              <input
                type="number"
                step="any"
                className={input}
                value={data.latitude}
                onChange={(e) => set("latitude", e.target.value)}
                required
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number"
                step="any"
                className={input}
                value={data.longitude}
                onChange={(e) => set("longitude", e.target.value)}
                required
              />
            </Field>
            <Field label="شعار المنشأة URL">
              <input
                className={input}
                value={data.logoUrl}
                onChange={(e) => set("logoUrl", e.target.value)}
              />
            </Field>
            <Field label="صورة الغلاف URL">
              <input
                className={input}
                value={data.coverImageUrl}
                onChange={(e) => set("coverImageUrl", e.target.value)}
              />
            </Field>
            <Field label="صور المنشأة — رابط في كل سطر" wide>
              <textarea
                rows={4}
                className={input}
                value={data.images}
                onChange={(e) => set("images", e.target.value)}
              />
            </Field>
            <Field label="فيديو">
              <input
                className={input}
                value={data.videoUrl}
                onChange={(e) => set("videoUrl", e.target.value)}
              />
            </Field>
            <Field label="رابط 360°">
              <input
                className={input}
                value={data.virtualTourUrl}
                onChange={(e) => set("virtualTourUrl", e.target.value)}
              />
            </Field>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-5">
            {rooms.map((r, ri) => (
              <div
                key={ri}
                className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-black">
                    <BedDouble className="text-blue-600" />
                    نوع الغرفة {ri + 1}
                  </h3>
                  {rooms.length > 1 && (
                    <button
                      onClick={() =>
                        setRooms((x) => x.filter((_, i) => i !== ri))
                      }
                      className="text-red-600"
                    >
                      <Trash2 />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    className={input}
                    placeholder="اسم الغرفة"
                    value={r.name}
                    onChange={(e) => updateRoom(ri, "name", e.target.value)}
                  />
                  <input
                    className={input}
                    type="number"
                    min="1"
                    placeholder="عدد الوحدات"
                    value={r.totalUnits}
                    onChange={(e) =>
                      updateRoom(ri, "totalUnits", e.target.value)
                    }
                  />
                  <select
                    className={input}
                    value={r.bedType}
                    onChange={(e) => updateRoom(ri, "bedType", e.target.value)}
                  >
                    <option value="SINGLE">سرير فردي</option>
                    <option value="DOUBLE">سرير مزدوج</option>
                    <option value="TWIN">سريران منفصلان</option>
                    <option value="TRIPLE">3 أسرّة</option>
                    <option value="QUAD">4 أسرّة</option>
                    <option value="DOUBLE_EXTRA">مزدوج + إضافي</option>
                    <option value="OTHER">أخرى</option>
                  </select>
                  <input
                    className={input}
                    type="number"
                    placeholder="بالغون"
                    value={r.maxAdults}
                    onChange={(e) =>
                      updateRoom(ri, "maxAdults", e.target.value)
                    }
                  />
                  <input
                    className={input}
                    type="number"
                    placeholder="أطفال"
                    value={r.maxChildren}
                    onChange={(e) =>
                      updateRoom(ri, "maxChildren", e.target.value)
                    }
                  />
                  <input
                    className={input}
                    type="number"
                    placeholder="إجمالي الضيوف"
                    value={r.maxGuests}
                    onChange={(e) =>
                      updateRoom(ri, "maxGuests", e.target.value)
                    }
                  />
                  <input
                    className={input}
                    type="number"
                    placeholder="المساحة م²"
                    value={r.sizeSqm}
                    onChange={(e) => updateRoom(ri, "sizeSqm", e.target.value)}
                  />
                  <select
                    className={input}
                    value={r.viewType}
                    onChange={(e) => updateRoom(ri, "viewType", e.target.value)}
                  >
                    <option value="SEA">بحر</option>
                    <option value="CITY">مدينة</option>
                    <option value="GARDEN">حديقة</option>
                    <option value="POOL">مسبح</option>
                    <option value="MOUNTAIN">جبل</option>
                    <option value="NONE">بدون إطلالة</option>
                  </select>
                  <input
                    className={input}
                    placeholder="صور الغرفة — روابط مفصولة بأسطر"
                    value={r.images}
                    onChange={(e) => updateRoom(ri, "images", e.target.value)}
                  />
                </div>
                <div className="mt-4 space-y-3">
                  {r.ratePlans.map((p, pi) => (
                    <div
                      key={pi}
                      className="grid gap-2 rounded-xl bg-white p-3 md:grid-cols-4"
                    >
                      <input
                        className={input}
                        value={p.name}
                        onChange={(e) =>
                          updatePlan(ri, pi, "name", e.target.value)
                        }
                        placeholder="اسم الخطة"
                      />
                      <input
                        className={input}
                        type="number"
                        value={p.price}
                        onChange={(e) =>
                          updatePlan(ri, pi, "price", e.target.value)
                        }
                        placeholder="السعر DZD"
                      />
                      <select
                        className={input}
                        value={p.mealPlan}
                        onChange={(e) =>
                          updatePlan(ri, pi, "mealPlan", e.target.value)
                        }
                      >
                        <option value="NONE">بدون وجبة</option>
                        <option value="BREAKFAST">إفطار</option>
                        <option value="HALF_BOARD">نصف إقامة</option>
                        <option value="FULL_BOARD">إقامة كاملة</option>
                        <option value="ALL_INCLUSIVE">All Inclusive</option>
                      </select>
                      <select
                        className={input}
                        value={p.paymentPolicy}
                        onChange={(e) =>
                          updatePlan(ri, pi, "paymentPolicy", e.target.value)
                        }
                      >
                        <option value="PAY_AT_PROPERTY">دفع في المنشأة</option>
                        <option value="FULL">دفع كامل</option>
                        <option value="DEPOSIT">عربون</option>
                        <option value="PARTIAL">دفع جزئي</option>
                        <option value="PAY_LATER">دفع لاحق</option>
                      </select>
                      <input
                        className={input}
                        type="number"
                        value={p.depositPercent}
                        onChange={(e) =>
                          updatePlan(ri, pi, "depositPercent", e.target.value)
                        }
                        placeholder="نسبة العربون"
                      />
                      <input
                        className={input}
                        type="number"
                        value={p.minimumStay}
                        onChange={(e) =>
                          updatePlan(ri, pi, "minimumStay", e.target.value)
                        }
                        placeholder="أقل ليالٍ"
                      />
                      <input
                        className={input}
                        type="number"
                        value={p.freeCancellationHours}
                        onChange={(e) =>
                          updatePlan(
                            ri,
                            pi,
                            "freeCancellationHours",
                            e.target.value,
                          )
                        }
                        placeholder="إلغاء مجاني بالساعات"
                      />
                      <button
                        onClick={() =>
                          updateRoom(
                            ri,
                            "ratePlans",
                            r.ratePlans.filter((_, i) => i !== pi),
                          )
                        }
                        disabled={r.ratePlans.length === 1}
                        className="text-xs font-bold text-red-600 disabled:opacity-30"
                      >
                        حذف الخطة
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      updateRoom(ri, "ratePlans", [...r.ratePlans, emptyPlan()])
                    }
                    className="text-sm font-bold text-blue-600"
                  >
                    + إضافة خطة سعر
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setRooms((r) => [...r, emptyRoom()])}
              className="flex items-center gap-2 rounded-xl border border-dashed border-blue-300 px-4 py-3 font-bold text-blue-600"
            >
              <Plus />
              إضافة نوع غرفة
            </button>
          </div>
        )}
        {step === 3 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="وقت الدخول">
              <input
                type="time"
                className={input}
                value={data.checkInTime}
                onChange={(e) => set("checkInTime", e.target.value)}
              />
            </Field>
            <Field label="وقت الخروج">
              <input
                type="time"
                className={input}
                value={data.checkOutTime}
                onChange={(e) => set("checkOutTime", e.target.value)}
              />
            </Field>
            <Field label="سياسة التدخين">
              <select
                className={input}
                value={data.smokingPolicy}
                onChange={(e) => set("smokingPolicy", e.target.value)}
              >
                <option value="NON_SMOKING">ممنوع</option>
                <option value="DESIGNATED">مناطق مخصصة</option>
              </select>
            </Field>
            <Field label="الحيوانات">
              <select
                className={input}
                value={data.petsPolicy}
                onChange={(e) => set("petsPolicy", e.target.value)}
              >
                <option value="NOT_ALLOWED">غير مسموح</option>
                <option value="ALLOWED">مسموح</option>
                <option value="ON_REQUEST">حسب الطلب</option>
              </select>
            </Field>
            <Field label="شروط الأطفال" wide>
              <textarea
                className={input}
                value={data.childrenPolicy}
                onChange={(e) => set("childrenPolicy", e.target.value)}
              />
            </Field>
            <Field label="موقف السيارات">
              <input
                className={input}
                value={data.parkingPolicy}
                onChange={(e) => set("parkingPolicy", e.target.value)}
              />
            </Field>
            <Field label="شروط خاصة" wide>
              <textarea
                rows={4}
                className={input}
                value={data.specialConditions}
                onChange={(e) => set("specialConditions", e.target.value)}
              />
            </Field>
            <div className="md:col-span-2 rounded-2xl bg-gray-50 p-4">
              <p className="font-black">المعاينة</p>
              <p className="text-sm text-gray-600">
                {data.name || "اسم المنشأة"} — {rooms.length} أنواع غرف —{" "}
                {rooms.reduce((n, r) => n + r.ratePlans.length, 0)} خطط أسعار
              </p>
            </div>
          </div>
        )}
      </section>
      <div className="mt-5 flex justify-between">
        <button
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="flex items-center gap-2 rounded-xl border px-5 py-3 font-bold disabled:opacity-30"
        >
          <ArrowRight />
          السابق
        </button>
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
          >
            التالي
            <ArrowLeft />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-black text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : "إنشاء المنشأة"}
          </button>
        )}
      </div>
    </main>
  );
}
function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? "md:col-span-2" : ""}>
      <span className="mb-1 block text-sm font-bold text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Plus, Trash2 } from "lucide-react";
const input =
  "w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100";
type TicketType = {
  id?: string;
  name: string;
  description: string;
  price: string;
  quantity: string;
  bookingMode: string;
  refundPolicy: string;
  saleStart: string;
  saleEnd: string;
};
const emptyTicket = (): TicketType => ({
  name: "Standard",
  description: "",
  price: "",
  quantity: "100",
  bookingMode: "PURCHASE",
  refundPolicy: "FREE_48H",
  saleStart: "",
  saleEnd: "",
});
export default function EventWizard({
  editPlaceId,
  initialData,
}: {
  editPlaceId?: string;
  initialData?: { place: Record<string, any>; tickets: TicketType[] };
} = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [data, setData] = useState<any>({
    ...(initialData?.place || {}),
    name: initialData?.place?.name ?? "",
    eventType: initialData?.place?.eventType ?? "CONCERT",
    organizer: "",
    description: "",
    coverImageUrl: "",
    videoUrl: "",
    virtualTourUrl: "",
    address: "",
    state: "",
    municipality: "",
    latitude: "",
    longitude: "",
    startAt: "",
    endAt: "",
    doorsOpenAt: "",
    minimumAge: "",
    targetAudience: "",
    program: "",
    attendanceTerms: "",
    capacity: "",
  });
  const [tickets, setTickets] = useState<TicketType[]>(
    initialData?.tickets && initialData.tickets.length > 0
      ? initialData.tickets
      : [emptyTicket()],
  );
  const set = (k: string, v: any) => setData((d: any) => ({ ...d, [k]: v }));
  const setTicket = (i: number, k: keyof TicketType, v: string) =>
    setTickets((t) => t.map((x, n) => (n === i ? { ...x, [k]: v } : x)));
  const submit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(
        editPlaceId
          ? `/api/partner/events/${editPlaceId}`
          : "/api/partner/events",
        {
          method: editPlaceId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, ticketTypes: tickets }),
        },
      );
      const out = await res.json();
      if (!res.ok) throw new Error(out.message);
      router.push(
        editPlaceId ? "/partner-dashboard" : `/places/${out.placeId}`,
      );
      router.refresh();
    } catch (e: any) {
      setMessage(e.message || "تعذر إنشاء الفعالية");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="mx-auto max-w-5xl px-4 py-8" dir="rtl">
      <div className="mb-6 rounded-3xl bg-gradient-to-l from-fuchsia-950 to-pink-600 p-6 text-white">
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <CalendarDays />
          {editPlaceId ? "تعديل الفعالية" : "إنشاء فعالية مؤقتة"}
        </h1>
        <p className="mt-2 text-sm text-pink-100">
          أضف الموعد والموقع وأنواع التذاكر والمخزون لكل نوع.
        </p>
      </div>
      {message && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-3 font-bold text-red-700"
        >
          {message}
        </p>
      )}
      <div className="space-y-5">
        <Card title="المعلومات الأساسية">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="اسم الفعالية">
              <input
                className={input}
                value={data.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="نوع الفعالية">
              <select
                className={input}
                value={data.eventType}
                onChange={(e) => set("eventType", e.target.value)}
              >
                <option value="CONCERT">حفل</option>
                <option value="FESTIVAL">مهرجان</option>
                <option value="CULTURAL">ثقافية</option>
                <option value="SPORT">رياضية</option>
                <option value="WORKSHOP">ورشة</option>
                <option value="OTHER">أخرى</option>
              </select>
            </Field>
            <Field label="المنظم">
              <input
                className={input}
                value={data.organizer}
                onChange={(e) => set("organizer", e.target.value)}
              />
            </Field>
            <Field label="صورة الغلاف URL">
              <input
                className={input}
                value={data.coverImageUrl}
                onChange={(e) => set("coverImageUrl", e.target.value)}
              />
            </Field>
            <Field label="الوصف" wide>
              <textarea
                rows={4}
                className={input}
                value={data.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <Field label="الفيديو">
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
        </Card>
        <Card title="المكان والموعد">
          <div className="grid gap-3 md:grid-cols-3">
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
            <Field label="العنوان">
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
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number"
                step="any"
                className={input}
                value={data.longitude}
                onChange={(e) => set("longitude", e.target.value)}
              />
            </Field>
            <Field label="فتح الأبواب">
              <input
                type="datetime-local"
                className={input}
                value={data.doorsOpenAt}
                onChange={(e) => set("doorsOpenAt", e.target.value)}
              />
            </Field>
            <Field label="تاريخ ووقت البداية">
              <input
                type="datetime-local"
                className={input}
                value={data.startAt}
                onChange={(e) => set("startAt", e.target.value)}
              />
            </Field>
            <Field label="تاريخ ووقت النهاية">
              <input
                type="datetime-local"
                className={input}
                value={data.endAt}
                onChange={(e) => set("endAt", e.target.value)}
              />
            </Field>
            <Field label="العمر الأدنى">
              <input
                type="number"
                className={input}
                value={data.minimumAge}
                onChange={(e) => set("minimumAge", e.target.value)}
              />
            </Field>
            <Field label="الجمهور المستهدف">
              <input
                className={input}
                value={data.targetAudience}
                onChange={(e) => set("targetAudience", e.target.value)}
              />
            </Field>
            <Field label="البرنامج" wide>
              <textarea
                rows={3}
                className={input}
                value={data.program}
                onChange={(e) => set("program", e.target.value)}
              />
            </Field>
            <Field label="شروط الحضور" wide>
              <textarea
                rows={3}
                className={input}
                value={data.attendanceTerms}
                onChange={(e) => set("attendanceTerms", e.target.value)}
              />
            </Field>
          </div>
        </Card>
        <Card title="أنواع التذاكر">
          <div className="space-y-3">
            {tickets.map((t, i) => (
              <div
                key={i}
                className="grid gap-2 rounded-2xl border bg-gray-50 p-3 md:grid-cols-4"
              >
                <input
                  className={input}
                  value={t.name}
                  onChange={(e) => setTicket(i, "name", e.target.value)}
                  placeholder="VIP / Standard"
                />
                <input
                  type="number"
                  className={input}
                  value={t.price}
                  onChange={(e) => setTicket(i, "price", e.target.value)}
                  placeholder="السعر DZD (0 مجاني)"
                />
                <input
                  type="number"
                  min="0"
                  className={input}
                  value={t.quantity}
                  onChange={(e) => setTicket(i, "quantity", e.target.value)}
                  placeholder="الكمية"
                />
                <select
                  className={input}
                  value={t.bookingMode}
                  onChange={(e) => setTicket(i, "bookingMode", e.target.value)}
                >
                  <option value="PURCHASE">شراء</option>
                  <option value="FREE">حجز مجاني</option>
                  <option value="SEAT">حجز مقعد</option>
                  <option value="PAY_LATER">دفع لاحق</option>
                  <option value="WAITLIST">قائمة انتظار</option>
                </select>
                <select
                  className={input}
                  value={t.refundPolicy}
                  onChange={(e) => setTicket(i, "refundPolicy", e.target.value)}
                >
                  <option value="FREE_24H">إلغاء مجاني 24h</option>
                  <option value="FREE_48H">إلغاء مجاني 48h</option>
                  <option value="FREE_72H">إلغاء مجاني 72h</option>
                  <option value="FREE_7D">إلغاء مجاني 7 أيام</option>
                  <option value="PARTIAL_50">استرداد 50%</option>
                  <option value="NO_CANCELLATION">غير قابل للإلغاء</option>
                  <option value="TRANSFER">نقل التذكرة</option>
                </select>
                <input
                  type="datetime-local"
                  className={input}
                  value={t.saleStart}
                  onChange={(e) => setTicket(i, "saleStart", e.target.value)}
                />
                <input
                  type="datetime-local"
                  className={input}
                  value={t.saleEnd}
                  onChange={(e) => setTicket(i, "saleEnd", e.target.value)}
                />
                <button
                  onClick={() => setTickets((x) => x.filter((_, n) => n !== i))}
                  disabled={tickets.length === 1}
                  className="flex items-center justify-center gap-1 text-sm font-bold text-red-600 disabled:opacity-30"
                >
                  <Trash2 size={16} />
                  حذف
                </button>
              </div>
            ))}
            <button
              onClick={() => setTickets((t) => [...t, emptyTicket()])}
              className="flex items-center gap-2 rounded-xl border border-dashed border-pink-300 px-4 py-3 font-bold text-pink-600"
            >
              <Plus />
              إضافة نوع تذكرة
            </button>
          </div>
        </Card>
      </div>
      <button
        onClick={submit}
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-600 p-4 font-black text-white disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            جاري إنشاء الفعالية...
          </>
        ) : (
          "نشر الفعالية وأنواع التذاكر"
        )}
      </button>
    </main>
  );
}
function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-black text-gray-900">{title}</h2>
      {children}
    </section>
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
    <label className={wide ? "md:col-span-full" : ""}>
      <span className="mb-1 block text-sm font-bold text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}

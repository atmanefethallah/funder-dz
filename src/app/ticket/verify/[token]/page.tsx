import {
  CheckCircle2,
  CircleX,
  Clock3,
  MapPin,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";
import db from "@/lib/db";
import { extractTicketToken } from "@/lib/ticketToken";

export const dynamic = "force-dynamic";

function verificationState(status?: string | null) {
  if (!status)
    return {
      key: "INVALID",
      label: "تذكرة غير صالحة",
      icon: CircleX,
      color: "text-red-600",
      panel: "bg-red-50 border-red-200",
    };
  if (status === "USED" || status === "COMPLETED")
    return {
      key: "USED",
      label: "تم استخدام التذكرة",
      icon: Clock3,
      color: "text-amber-600",
      panel: "bg-amber-50 border-amber-200",
    };
  if (
    [
      "REJECTED",
      "CANCELLED",
      "CANCELLED_BY_GUEST",
      "CANCELLED_BY_PARTNER",
      "REFUNDED",
    ].includes(status)
  )
    return {
      key: "CANCELLED",
      label: "تذكرة ملغاة",
      icon: CircleX,
      color: "text-red-600",
      panel: "bg-red-50 border-red-200",
    };
  if (["CONFIRMED", "PAID", "PARTIALLY_PAID", "VALID"].includes(status))
    return {
      key: "VALID",
      label: "تذكرة صالحة",
      icon: CheckCircle2,
      color: "text-emerald-600",
      panel: "bg-emerald-50 border-emerald-200",
    };
  return {
    key: "PENDING",
    label: "في انتظار التأكيد",
    icon: Clock3,
    color: "text-blue-600",
    panel: "bg-blue-50 border-blue-200",
  };
}

export default async function VerifyTicketPage({
  params,
}: {
  params: { token: string };
}) {
  const token = extractTicketToken(params.token);
  let result:
    | {
        id: string;
        status: string;
        placeName: string;
        location: string;
        eventEndsAt: Date | null;
      }
    | undefined;

  try {
    const modern = await db.query(
      `SELECT t."id", t."status", p."name" AS "placeName", p."location", p."eventEndsAt"
       FROM "Ticket" t
       JOIN "Booking" b ON b."id" = t."bookingId"
       JOIN "Place" p ON p."id" = b."placeId"
       WHERE t."secureToken" = $1 LIMIT 1`,
      [token],
    );
    result = modern.rows[0];
  } catch (error: any) {
    if (error?.code !== "42P01") throw error;
  }

  if (!result) {
    const legacy = await db.query(
      `SELECT b."id", b."status",
              p."name" AS "placeName", p."location", p."eventEndsAt"
       FROM "Booking" b JOIN "Place" p ON p."id" = b."placeId"
       WHERE b."qrToken" = $1 LIMIT 1`,
      [token],
    );
    result = legacy.rows[0];
  }

  const state = verificationState(result?.status);
  const Icon = state.icon;

  return (
    <main className="min-h-[80vh] bg-gray-50 px-4 py-12" dir="rtl">
      <section className="mx-auto max-w-lg overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-xl">
        <div className="bg-gray-950 p-6 text-white">
          <div className="flex items-center gap-3">
            <img
              src="/uploads/1779913239750-logo.png"
              alt="شعار Funder"
              className="h-12 w-12 rounded-2xl object-cover"
            />
            <div>
              <p className="text-xs font-bold text-blue-300">
                Funder Secure Verification
              </p>
              <h1 className="text-xl font-black">التحقق من التذكرة</h1>
            </div>
          </div>
        </div>
        <div className="space-y-5 p-6">
          <div
            className={`flex items-center gap-4 rounded-3xl border p-5 ${state.panel}`}
          >
            <Icon className={state.color} size={44} aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-gray-500">نتيجة التحقق</p>
              <p className={`text-xl font-black ${state.color}`}>
                {state.label}
              </p>
            </div>
          </div>

          {result ? (
            <div className="space-y-3 rounded-3xl border border-gray-100 p-5">
              <p className="flex items-center gap-2 font-black text-gray-900">
                <TicketCheck size={19} className="text-blue-600" />
                {result.placeName}
              </p>
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                <MapPin size={17} />
                {result.location}
              </p>
              {result.eventEndsAt && (
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <Clock3 size={17} />
                  {new Date(result.eventEndsAt).toLocaleString("ar-DZ")}
                </p>
              )}
              <p className="border-t pt-3 font-mono text-xs text-gray-500">
                Ticket ID: {result.id}
              </p>
            </div>
          ) : (
            <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">
              لا توجد تذكرة مرتبطة بهذا الرمز. لا تقبل الدخول باستخدامه.
            </p>
          )}

          <div className="flex items-start gap-2 text-xs font-semibold leading-5 text-gray-500">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-600" />
            <p>
              هذه الصفحة لا تعرض بيانات شخصية. اعتماد الدخول النهائي يتم من ماسح
              الشريك المسجل في Funder.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

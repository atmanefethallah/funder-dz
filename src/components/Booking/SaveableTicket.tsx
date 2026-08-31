"use client";

import { useRef, useState } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  MapPin,
  RotateCcw,
  Share2,
  Ticket,
} from "lucide-react";
import TicketQRCode, { type QRStatus } from "./TicketQRCode";
import { exportTicketToPng } from "@/lib/ticketExport";

export type SaveableTicketData = {
  id: string;
  qrToken: string;
  status: string;
  place: {
    name: string;
    location: string;
    image: string;
    category: string;
    eventEndsAt?: string | null;
  };
  tickets: number;
  amount: number;
  createdAt: string;
  userName: string;
  ticketType?: string | null;
};

export default function SaveableTicket({
  ticket,
}: {
  ticket: SaveableTicketData;
}) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [qrStatus, setQrStatus] = useState<QRStatus>("GENERATING");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const isUsed = ticket.status === "USED";
  const isCancelled = [
    "REJECTED",
    "CANCELLED",
    "CANCELLED_BY_GUEST",
    "CANCELLED_BY_PARTNER",
  ].includes(ticket.status);

  const handleSave = async () => {
    if (!ticketRef.current || isSaving || qrStatus !== "READY") return;
    setIsSaving(true);
    setSaveError("");
    try {
      await exportTicketToPng(
        ticketRef.current,
        `Funder-Ticket-${ticket.id}.png`,
      );
    } catch (error) {
      console.error("Ticket export failed:", error);
      setSaveError("تعذّر حفظ التذكرة. يرجى إعادة المحاولة.");
    } finally {
      setIsSaving(false);
    }
  };

  const eventDate = ticket.place.eventEndsAt
    ? new Date(ticket.place.eventEndsAt).toLocaleString("ar-DZ", {
        dateStyle: "full",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="mx-auto w-full max-w-md" dir="rtl">
      <div
        ref={ticketRef}
        className="overflow-hidden rounded-[32px] bg-gray-950 text-white shadow-2xl"
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={ticket.place.image}
            alt={ticket.place.name}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/25 to-black/20" />
          <div className="absolute left-5 top-5 flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 text-gray-900 shadow-lg">
            <img
              src="/uploads/1779913239750-logo.png"
              alt="شعار Funder"
              className="h-8 w-8 rounded-lg object-cover"
              crossOrigin="anonymous"
            />
            <span className="font-black tracking-tight">Funder</span>
          </div>
          <div className="absolute bottom-5 right-5 left-5">
            <p className="mb-1 text-xs font-bold text-blue-300">
              {ticket.place.category}
            </p>
            <h1 className="text-2xl font-black leading-tight">
              {ticket.place.name}
            </h1>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-3">
            <Info
              icon={<Ticket size={17} />}
              label="نوع التذكرة"
              value={ticket.ticketType || "دخول عام"}
            />
            <Info
              icon={<Ticket size={17} />}
              label="العدد"
              value={`${ticket.tickets} تذكرة`}
            />
            {eventDate && (
              <Info
                icon={<Calendar size={17} />}
                label="التاريخ والوقت"
                value={eventDate}
              />
            )}
            <Info
              icon={<MapPin size={17} />}
              label="المكان"
              value={ticket.place.location}
            />
            <Info
              icon={<Clock size={17} />}
              label="تاريخ الحجز"
              value={new Date(ticket.createdAt).toLocaleDateString("ar-DZ")}
            />
            <Info
              icon={<CheckCircle size={17} />}
              label="الحالة"
              value={isUsed ? "مستعملة" : isCancelled ? "ملغاة" : "صالحة"}
            />
          </div>

          <div className="relative border-t border-dashed border-white/20 pt-6">
            <span className="absolute -right-9 -top-4 h-8 w-8 rounded-full bg-white" />
            <span className="absolute -left-9 -top-4 h-8 w-8 rounded-full bg-white" />
            <div className="flex flex-col items-center rounded-3xl bg-white p-5 text-gray-900">
              <TicketQRCode
                value={ticket.qrToken}
                size={184}
                dimmed={isUsed || isCancelled}
                onStatusChange={setQrStatus}
              />
              <p className="mt-3 text-xs font-extrabold tracking-wider text-gray-500">
                TICKET ID
              </p>
              <p className="mt-1 font-mono text-sm font-black">{ticket.id}</p>
              <p className="mt-3 max-w-[260px] text-center text-xs font-semibold leading-5 text-gray-500">
                قدم هذا الرمز عند الدخول. الرمز مرتبط بخادم Funder ولا يحتوي على
                بياناتك الشخصية.
              </p>
              {isUsed && (
                <span className="mt-3 rounded-full bg-gray-200 px-4 py-2 text-xs font-black text-gray-600">
                  تم استخدام التذكرة
                </span>
              )}
              {isCancelled && (
                <span className="mt-3 rounded-full bg-red-100 px-4 py-2 text-xs font-black text-red-700">
                  تذكرة ملغاة
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-xs text-gray-400">صاحب التذكرة</p>
              <p className="font-bold">{ticket.userName}</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400">المبلغ المدفوع</p>
              <p className="text-xl font-black text-emerald-400">
                {ticket.amount.toLocaleString("fr-DZ")} دج
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving || qrStatus !== "READY"}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 font-black text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {isSaving ? (
          <>
            <RotateCcw size={20} className="animate-spin" /> جاري إنشاء ملف
            PNG...
          </>
        ) : qrStatus === "READY" ? (
          <>
            <Download size={20} /> حفظ التذكرة
          </>
        ) : qrStatus === "ERROR" ? (
          <>
            <RotateCcw size={20} /> تعذّر تجهيز QR
          </>
        ) : (
          <>
            <Share2 size={20} /> جاري تجهيز التذكرة...
          </>
        )}
      </button>
      {saveError && (
        <p
          role="alert"
          className="mt-3 text-center text-sm font-bold text-red-600"
        >
          {saveError}
        </p>
      )}
      <p className="mt-3 text-center text-xs font-semibold text-gray-500">
        على iPhone ستظهر نافذة المشاركة أو يفتح الملف في تبويب آمن للحفظ.
      </p>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <span className="mb-1 flex items-center gap-1 text-[11px] font-bold text-gray-400">
        {icon}
        {label}
      </span>
      <span className="block text-sm font-extrabold leading-5">{value}</span>
    </div>
  );
}

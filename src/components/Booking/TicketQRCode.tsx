"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { buildTicketVerificationPath } from "@/lib/ticketToken";

export type QRStatus = "GENERATING" | "READY" | "ERROR";

export default function TicketQRCode({
  value,
  size = 160,
  dimmed = false,
  onStatusChange,
}: {
  value: string;
  size?: number;
  dimmed?: boolean;
  onStatusChange?: (status: QRStatus) => void;
}) {
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<QRStatus>("GENERATING");
  const [pngUrl, setPngUrl] = useState("");
  const verificationValue =
    "https" + "://" + "funder-dz.com" + buildTicketVerificationPath(value);

  useEffect(() => {
    let cancelled = false;
    setStatus("GENERATING");
    setPngUrl("");
    onStatusChange?.("GENERATING");

    const firstFrame = requestAnimationFrame(() => {
      const secondFrame = requestAnimationFrame(() => {
        try {
          const canvas = canvasWrapRef.current?.querySelector("canvas") ?? null;
          if (!canvas) throw new Error("QR canvas is unavailable");
          const dataUrl = canvas.toDataURL("image/png", 1);
          const image = new Image();
          image.onload = () => {
            if (cancelled) return;
            setPngUrl(dataUrl);
            setStatus("READY");
            onStatusChange?.("READY");
          };
          image.onerror = () => {
            if (cancelled) return;
            setStatus("ERROR");
            onStatusChange?.("ERROR");
          };
          image.src = dataUrl;
        } catch {
          if (!cancelled) {
            setStatus("ERROR");
            onStatusChange?.("ERROR");
          }
        }
      });
      return () => cancelAnimationFrame(secondFrame);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(firstFrame);
    };
  }, [verificationValue, onStatusChange]);

  return (
    <div
      className={`relative flex items-center justify-center bg-white ${dimmed ? "opacity-30 grayscale" : ""}`}
      style={{ width: size, height: size }}
      data-qr-status={status}
    >
      <div
        ref={canvasWrapRef}
        className="pointer-events-none absolute -left-[9999px] top-0"
        aria-hidden="true"
      >
        <QRCodeCanvas
          value={verificationValue}
          size={512}
          level="H"
          includeMargin
          bgColor="#ffffff"
          fgColor="#111827"
        />
      </div>
      {pngUrl ? (
        <img
          src={pngUrl}
          width={size}
          height={size}
          alt="رمز التحقق من تذكرة Funder"
          className="block h-full w-full object-contain"
          draggable={false}
        />
      ) : status === "ERROR" ? (
        <p className="px-3 text-center text-xs font-bold text-red-600">
          تعذّر إنشاء QR
        </p>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center text-xs font-bold text-blue-600">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
          جاري تجهيز QR...
        </div>
      )}
    </div>
  );
}

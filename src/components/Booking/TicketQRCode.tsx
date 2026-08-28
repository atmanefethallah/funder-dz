"use client";

import { QRCodeCanvas } from "qrcode.react";

/**
 * رمز QR للتذكرة — يُولَّد محلياً في المتصفح (لا يُرسل رمز التذكرة السري
 * لأي خدمة خارجية، بعكس الاعتماد السابق على api.qrserver.com)
 */
export default function TicketQRCode({
  value,
  size = 160,
  dimmed = false,
}: {
  value: string;
  size?: number;
  dimmed?: boolean;
}) {
  return (
    <div className={dimmed ? "opacity-30 grayscale" : ""}>
      <QRCodeCanvas value={value} size={size} level="H" includeMargin={true} />
    </div>
  );
}

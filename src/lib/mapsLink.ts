// src/lib/mapsLink.ts
// يستخرج الإحداثيات (خط العرض والطول) من رابط جوجل ماب بمختلف صيغه الشائعة
// حتى يتمكن الشريك من لصق رابط الموقع مباشرة بدل البحث اليدوي على الخريطة.

export type ParsedCoordinates = { lat: number; lng: number };

export function parseGoogleMapsLink(rawUrl: string): ParsedCoordinates | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const url = rawUrl.trim();
  if (!url) return null;

  // 1) صيغة: https://www.google.com/maps/@35.9311,0.0891,15z
  const atMatch = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  // 2) صيغة: ?q=35.9311,0.0891 أو &q=35.9311,0.0891
  const qMatch = url.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  // 3) صيغة: ?query=35.9311,0.0891
  const queryMatch = url.match(/[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (queryMatch) {
    const lat = parseFloat(queryMatch[1]);
    const lng = parseFloat(queryMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  // 4) صيغة رابط المشاركة المختصر التي تحتوي على !3dLAT!4dLNG (بيانات المكان الدقيقة)
  const bangMatch = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (bangMatch) {
    const lat = parseFloat(bangMatch[1]);
    const lng = parseFloat(bangMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  // 5) صيغة عامة: أي رقمين عشريين مفصولين بفاصلة في النص بالكامل (كحل أخير)
  const genericMatch = url.match(/(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/);
  if (genericMatch) {
    const lat = parseFloat(genericMatch[1]);
    const lng = parseFloat(genericMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  return null;
}

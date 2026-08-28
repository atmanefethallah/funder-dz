// src/lib/rate-limit.ts — محدد معدل الطلبات في الذاكرة (نافذة زمنية منزلقة)
// ملاحظة: مناسب لنسخة خادم واحدة. عند التوسع أفقياً استبدله بـ Redis (Upstash).

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// تنظيف دوري للمدخلات المنتهية لمنع تسرب الذاكرة
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/** يستخرج أفضل تقدير لعنوان IP للعميل من ترويسات الطلب */
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

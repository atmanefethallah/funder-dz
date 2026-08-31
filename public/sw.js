// public/sw.js — عامل الخدمة: تخزين مؤقت للاستخدام دون اتصال + استقبال الإشعارات الفورية
/* eslint-disable no-restricted-globals */

const CACHE_NAME = "funder-cache-v2";
const APP_SHELL = ["/", "/explore", "/manifest.json"];

// 📥 عند التثبيت: خزّن هيكل التطبيق
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

// ♻️ عند التفعيل: نظّف الذخائر القديمة
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 🌐 استراتيجية الجلب: الشبكة أولاً للصفحات، والذخيرة أولاً للأصول الثابتة
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // لا نخزّن استدعاءات API — بيانات لحظية
  if (url.pathname.startsWith("/api/")) return;

  // الأصول الثابتة: ذخيرة أولاً
  if (url.pathname.startsWith("/_next/static/") || url.pathname.match(/\.(png|jpg|jpeg|webp|svg|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
      )
    );
    return;
  }

  // التنقلات: الشبكة مباشرة لمنع عرض واجهات قديمة أو تأخير الانتقال بسبب التخزين المؤقت.
  // عند انقطاع الاتصال فقط نرجع إلى النسخة المحفوظة.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match("/"))));
    return;
  }

  event.respondWith(fetch(request));
});

// 🔔 استقبال الإشعارات الفورية (Web Push)
self.addEventListener("push", (event) => {
  let data = { title: "Funder", body: "لديك تحديث جديد", link: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      dir: "rtl",
      lang: "ar",
      data: { link: data.link || "/" },
    })
  );
});

// 👆 فتح الرابط عند النقر على الإشعار
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(link) && "focus" in client) return client.focus();
      }
      return clients.openWindow(link);
    })
  );
});

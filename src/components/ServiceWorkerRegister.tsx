"use client";

import { useEffect } from "react";

/** يسجّل عامل الخدمة (Service Worker) لتفعيل PWA والعمل دون اتصال */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("SW registration failed:", err);
      });
    }
  }, []);

  return null;
}

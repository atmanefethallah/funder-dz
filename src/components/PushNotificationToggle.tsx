"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

// تحويل مفتاح VAPID العام من base64url إلى Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = typeof window !== "undefined" ? window.atob(base64) : "";
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

/** زر تفعيل/إيقاف الإشعارات الفورية (Web Push) */
export default function PushNotificationToggle() {
  const { success, error: toastError, info } = useToast();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);
    if (!ok) return;

    // تحقق من حالة الاشتراك الحالية
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  if (!supported) return null;

  const subscribe = async () => {
    if (!vapidKey) {
      info("الإشعارات غير مهيأة بعد", "على الإدارة ضبط مفاتيح VAPID في الخادم.");
      return;
    }
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toastError("الإذن مرفوض", "فعّل الإشعارات من إعدادات المتصفح لتصلك التنبيهات.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (res.ok) {
        setSubscribed(true);
        success("تم تفعيل الإشعارات 🔔", "ستصلك تنبيهات الحجوزات والعروض فوراً.");
      } else {
        const data = await res.json();
        toastError("تعذر التفعيل", data.message);
      }
    } catch (e) {
      toastError("خطأ", "تعذر تفعيل الإشعارات.");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      success("تم إيقاف الإشعارات", "لن تصلك تنبيهات فورية بعد الآن.");
    } catch (e) {
      toastError("خطأ", "تعذر إيقاف الإشعارات.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 disabled:opacity-60 ${
        subscribed
          ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
      aria-pressed={subscribed}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : subscribed ? (
        <Bell size={16} className="fill-green-600" />
      ) : (
        <BellOff size={16} />
      )}
      {subscribed ? "الإشعارات مفعّلة" : "فعّل الإشعارات"}
    </button>
  );
}

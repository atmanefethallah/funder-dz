"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead?: boolean;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/notifications", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch((error) => {
        if (error?.name !== "AbortError")
          console.error("Notifications fetch failed:", error);
      });
    return () => controller.abort();
  }, []);

  // أي انتقال: Navbar، BottomNav، Link، router.push أو Browser Back يغلق اللوحة.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // قفل تمرير الخلفية أثناء فتح طبقة الهاتف، مع استرجاع الحالة وتنظيفها دائماً.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const closeNotifications = () => setIsOpen(false);

  const handleNotificationClick = async (notification: Notification) => {
    // أغلق الطبقة أولاً حتى لا تنتقل فوق الصفحة الجديدة.
    closeNotifications();

    if (!notification.isRead) {
      setNotifications((items) =>
        items.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      void fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id }),
      }).catch(() => null);
    }

    if (notification.link) router.push(notification.link);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "إغلاق الإشعارات" : "فتح الإشعارات"}
        aria-expanded={isOpen}
        className="relative rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600 touch-manipulation"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="الإشعارات والإعلانات"
          className="fixed inset-0 z-[9999] flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl md:absolute md:inset-auto md:left-0 md:mt-2 md:h-auto md:w-80 md:rounded-2xl md:border md:border-gray-100"
        >
          <div className="flex shrink-0 items-center justify-between border-b bg-gray-50 px-5 py-4 font-bold text-gray-700 md:py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-base">الإشعارات والإعلانات</span>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600">
                {unreadCount} جديد
              </span>
            </div>
            <button
              type="button"
              onClick={closeNotifications}
              aria-label="إغلاق الإشعارات"
              className="rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-red-500 touch-manipulation"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain bg-gray-50/40 p-4 md:max-h-80 md:p-2">
            {notifications.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-16 text-center text-sm text-gray-400">
                <Bell size={40} className="opacity-20" />
                <span className="font-bold">لا توجد إشعارات حالياً</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`mb-3 block w-full cursor-pointer rounded-2xl border bg-white p-4 text-right shadow-sm transition-colors hover:border-blue-300 touch-manipulation ${
                    !notification.isRead
                      ? "border-r-4 border-r-blue-600"
                      : "border-gray-100 opacity-75"
                  }`}
                >
                  <span
                    className={`mb-1 block text-base md:text-sm ${!notification.isRead ? "font-bold text-blue-900" : "font-semibold text-gray-700"}`}
                  >
                    {notification.title}
                  </span>
                  <span className="block text-sm leading-relaxed text-gray-500 md:text-xs">
                    {notification.message}
                  </span>
                  {notification.link && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-extrabold text-blue-600">
                      🔗 الانتقال إلى التفاصيل
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

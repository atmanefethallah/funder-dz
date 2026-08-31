"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead?: boolean;
};

const OPEN_KEY = "funder-notifications-open";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // نحفظ حالة النافذة حتى تبقى ظاهرة عند التنقل بين الواجهات ولا تغلق إلا بزر X.
  useEffect(() => {
    setIsOpen(sessionStorage.getItem(OPEN_KEY) === "1");
    const controller = new AbortController();
    fetch("/api/notifications", { signal: controller.signal, cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch((error) => {
        if (error?.name !== "AbortError") console.error("Notifications fetch failed:", error);
      });
    return () => controller.abort();
  }, []);

  const openNotifications = () => {
    sessionStorage.setItem(OPEN_KEY, "1");
    setIsOpen(true);
  };

  const closeNotifications = () => {
    sessionStorage.removeItem(OPEN_KEY);
    setIsOpen(false);
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id }),
      }).catch(() => null);
    }

    // لا نغلق النافذة هنا؛ تبقى ثابتة أثناء الانتقال حتى يضغط المستخدم زر الخروج X.
    if (notification.link) router.push(notification.link);
  };

  return (
    <div className="relative">
      <button type="button" onClick={openNotifications} aria-label="فتح الإشعارات" className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-50 rounded-full touch-manipulation">
        <Bell size={20} />
        {unreadCount > 0 && <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 md:absolute md:inset-auto md:left-0 md:mt-2 md:w-80 h-[100dvh] md:h-auto w-full bg-white shadow-2xl md:rounded-2xl md:border md:border-gray-100 overflow-hidden z-[9999] flex flex-col">
          <div className="bg-gray-50 px-5 py-4 md:py-3 border-b font-bold text-gray-700 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-base">الإشعارات والإعلانات</span>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">{unreadCount} جديد</span>
            </div>
            <button type="button" onClick={closeNotifications} aria-label="الخروج من الإشعارات" className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-200 bg-gray-100 rounded-full transition-colors touch-manipulation">
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-2 md:max-h-80 bg-gray-50/40">
            {notifications.length === 0 ? (
              <div className="p-16 text-center text-gray-400 text-sm flex flex-col items-center justify-center gap-2 h-full"><Bell size={40} className="opacity-20" /><span className="font-bold">لا توجد إشعارات حالياً</span></div>
            ) : notifications.map((notification) => (
              <button type="button" key={notification.id} onClick={() => handleNotificationClick(notification)} className={`block w-full text-right p-4 mb-3 rounded-2xl border cursor-pointer transition-colors shadow-sm bg-white hover:border-blue-300 touch-manipulation ${!notification.isRead ? "border-r-4 border-r-blue-600" : "border-gray-100 opacity-75"}`}>
                <span className={`block text-base md:text-sm mb-1 ${!notification.isRead ? "font-bold text-blue-900" : "font-semibold text-gray-700"}`}>{notification.title}</span>
                <span className="block text-sm md:text-xs text-gray-500 leading-relaxed">{notification.message}</span>
                {notification.link && <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-extrabold mt-2 bg-blue-50 px-2 py-1 rounded-lg">🔗 الانتقال إلى التفاصيل</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

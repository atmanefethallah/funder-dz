"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react"; 
import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // جلب الإشعارات من الـ API
    fetch("/api/notifications")
      .then(res => res.json())
      .then(data => setNotifications(data || []));
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id })
      });
      setNotifications(notifications.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
    }
    
    setIsOpen(false);
    
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="relative">
      {/* زر جرس الإشعارات المعروض في الـ Navbar */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-gray-600 hover:text-blue-600 transition bg-gray-100 hover:bg-blue-50 rounded-full"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        /* 🌟 جدار الحماية البصري: fixed inset-0 يجعل الإشعارات تفتح كصفحة كاملة في الهاتف */
        <div className="fixed inset-0 md:absolute md:inset-auto md:left-0 md:mt-2 md:w-80 h-screen md:h-auto w-full bg-white shadow-2xl md:rounded-2xl md:border md:border-gray-100 overflow-hidden z-[9999] md:z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200">
          
          {/* الترويسة العلوية لصفحة الإشعارات الكاملة */}
          <div className="bg-gray-50 px-5 py-4 md:py-3 border-b font-bold text-gray-700 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-base">الإشعارات والإعلانات</span>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">{unreadCount} جديد</span>
            </div>
            
            {/* زر إغلاق الصفحة الكاملة للموبايل */}
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-gray-200 bg-gray-100 rounded-full transition"
            >
              <X size={22} />
            </button>
          </div>
          
          {/* قائمة الإشعارات التفاعلية */}
          <div className="flex-1 overflow-y-auto p-4 md:p-2 md:max-h-80 bg-gray-50/40">
            {notifications.length === 0 ? (
              <div className="p-16 text-center text-gray-400 text-sm flex flex-col items-center justify-center gap-2 h-full">
                <Bell size={40} className="opacity-20 animate-pulse" />
                <span className="font-bold">لا توجد إعلانات أو مسابقات حالياً</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 mb-3 rounded-2xl border border-gray-100 cursor-pointer transition shadow-sm bg-white hover:border-blue-300 ${!n.isRead ? 'border-r-4 border-r-blue-600 bg-blue-50/10' : 'opacity-75'}`}
                >
                  <h4 className={`text-base md:text-sm mb-1 ${!n.isRead ? 'font-bold text-blue-900' : 'font-semibold text-gray-700'}`}>{n.title}</h4>
                  <p className="text-sm md:text-xs text-gray-500 leading-relaxed">{n.message}</p>
                  
                  {n.link && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-extrabold mt-2 bg-blue-50 px-2 py-1 rounded-lg">
                      🔗 اضغط للانتقال إلى العرض الآن
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

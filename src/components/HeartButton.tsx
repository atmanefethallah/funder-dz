"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function HeartButton({
  placeId,
  initialFavorited,
  isLoggedIn = true,
}: {
  placeId: string;
  initialFavorited: boolean;
  isLoggedIn?: boolean;
}) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const { success, error: toastError, warning } = useToast();

  const toggleHeart = async () => {
    // 🌟 التحقق من الزائر
    if (!isLoggedIn) {
      warning("تسجيل الدخول مطلوب", "يرجى تسجيل الدخول أولاً لحفظ المعالم في مفضلتك ❤️");
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsFavorited(data.isFavorited);
        if (data.isFavorited) {
          success("أُضيف للمفضلة ❤️", data.message);
        } else {
          success("أُزيل من المفضلة", data.message);
        }
      } else {
        toastError("تعذر الحفظ", data.message);
      }
    } catch (err) {
      console.error(err);
      toastError("خطأ في الاتصال", "تعذر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleHeart}
      disabled={loading}
      aria-label={isFavorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
      className="absolute top-3 left-3 z-10 flex items-center justify-center rounded-full bg-white/80 p-2.5 shadow-sm backdrop-blur-sm transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
    >
      <Heart
        size={20}
        className={`transition-colors duration-300 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-500 hover:text-red-500"}`}
      />
    </button>
  );
}

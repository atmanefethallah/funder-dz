"use client";

import { useEffect } from "react";

/**
 * يثبت واجهة التطبيق على الهاتف: يمنع النسخ وقائمة السياق وتكبير اللمس/لوحة المفاتيح.
 * لا يعطّل النقر أو الكتابة داخل الحقول.
 */
export default function InteractionLock() {
  useEffect(() => {
    const prevent = (event: Event) => event.preventDefault();
    const preventZoomKeys = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ["+", "-", "=", "0"].includes(event.key)) {
        event.preventDefault();
      }
    };
    const preventMultiTouch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };

    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("keydown", preventZoomKeys);
    document.addEventListener("touchmove", preventMultiTouch, { passive: false });
    document.addEventListener("gesturestart", prevent as EventListener);

    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("keydown", preventZoomKeys);
      document.removeEventListener("touchmove", preventMultiTouch);
      document.removeEventListener("gesturestart", prevent as EventListener);
    };
  }, []);

  return null;
}

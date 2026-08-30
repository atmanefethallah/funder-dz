"use client";

// تستخدم صفحة الاستكشاف نفس الخريطة المحسّنة: ملاءمة تلقائية للنقاط، تحديد موقعي، ورموز الفعاليات.
import InteractiveMap, { PlaceMarker } from "@/components/InteractiveMap";

export default function PlacesMap({ places, isLoggedIn }: { places: PlaceMarker[]; isLoggedIn: boolean }) {
  return <InteractiveMap places={places} isLoggedIn={isLoggedIn} fill />;
}

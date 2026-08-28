"use client";

export default function PlaceCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-gray-100 bg-white p-4 shadow-sm" dir="rtl">
      {/* مساحة الصورة المحجوبة */}
      <div className="h-48 w-full rounded-2xl bg-gray-200"></div>
      
      {/* تفاصيل النص المحجوبة */}
      <div className="mt-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-5 w-1/2 rounded bg-gray-200"></div>
          <div className="h-4 w-12 rounded bg-gray-200"></div>
        </div>
        
        <div className="h-3 w-full rounded bg-gray-200"></div>
        <div className="h-3 w-3/4 rounded bg-gray-200"></div>
        
        <div className="pt-2 flex justify-between items-center border-t border-gray-50 mt-4">
          <div className="h-6 w-20 rounded bg-gray-200"></div>
          <div className="h-8 w-24 rounded-xl bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
}

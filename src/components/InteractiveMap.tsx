"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import Link from "next/link";
import { MapPin } from "lucide-react";

// تعريف نوع البيانات الخاصة بالمعلم السياحي
type PlaceMarker = {
  id: string;
  name: string;
  category: string;
  price: number;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
};

export default function InteractiveMap({ places, isLoggedIn }: { places: PlaceMarker[], isLoggedIn: boolean }) {
  // إحداثيات ولاية مستغانم الافتراضية للتركيز عليها عند فتح الخريطة
  const defaultCenter = { lat: 35.9311, lng: 0.0891 };

  return (
    <div className="w-full h-[500px] rounded-3xl overflow-hidden shadow-lg border-4 border-white z-0 relative">
      <MapContainer 
        center={[defaultCenter.lat, defaultCenter.lng]} 
        zoom={12} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%" }}
      >
        {/* استخدام طبقة خريطة دقيقة وعالمية */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> Funder DZ'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {places.filter(p => p.latitude && p.longitude).map((place) => {
          // 🧠 المنطق الذكي: هل المكان مجاني أم مدفوع؟
          const isFree = place.price === 0 || !place.price;

          // 🧠 تحديد نص الزر
          const actionText = isFree ? "بدء المسار 🧭" : "حجز الآن 🎫";
          
          // 🧠 تحديد الرابط (الوجهة) بناءً على حالة تسجيل الدخول والسعر
          const actionHref = !isLoggedIn 
            ? "/register" // إذا لم يسجل دخول -> صفحة التسجيل
            : isFree 
            ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}` // إذا مسجل ومجاني -> خرائط جوجل
            : `/places/${place.id}`; // إذا مسجل ومدفوع -> صفحة الحجز والدفع
          
          // 🧠 إذا كان سيرسله لخرائط جوجل نفتحها في نافذة جديدة أو التطبيق
          const target = (isLoggedIn && isFree) ? "_blank" : "_self";

          return (
            <Marker key={place.id} position={[place.latitude, place.longitude]}>
              <Popup className="rounded-xl overflow-hidden">
                <div className="w-52 text-right p-1" dir="rtl">
                  {place.imageUrl ? (
                    <div className="w-full h-28 mb-2 bg-gray-100 rounded-lg overflow-hidden relative shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                      {/* شارة مجاني فوق الصورة إذا كان مجانياً */}
                      {isFree && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-md">
                          دخول مجاني
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-24 mb-2 bg-blue-50 text-blue-300 flex items-center justify-center rounded-lg relative">
                      <MapPin size={32} />
                      {isFree && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-md">
                          دخول مجاني
                        </div>
                      )}
                    </div>
                  )}
                  
                  <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{place.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{place.category}</p>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    {/* عرض السعر أو كلمة مجاني */}
                    {isFree ? (
                      <span className="font-black text-green-600 text-sm">مجاني</span>
                    ) : (
                      <span className="font-black text-blue-600 text-sm" dir="ltr">{place.price} د.ج</span>
                    )}
                    
                    {/* 🌟 الزر التكيفي (يتغير لونه ووظيفته) */}
                    <Link 
                      href={actionHref} 
                      target={target}
                      rel={target === "_blank" ? "noopener noreferrer" : ""}
                      className={`text-white text-xs px-3 py-2 rounded-lg transition shadow-md block text-center font-bold ${
                        isFree ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                    >
                      {actionText}
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

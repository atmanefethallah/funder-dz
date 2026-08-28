"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";
import L from "leaflet"; // استدعاء مكتبة ليفلت الأساسية لبرمجة الدبابيس المخصصة
import { getCategoryMeta } from "@/lib/placeCategoryIcons";

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
  // 📍 الإحداثيات الجغرافية الدقيقة لمركز ولاية مستغانم (Mostaganem Center GPS)
  const mostaganemCenter = [35.9333, 0.0903] as [number, number];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={mostaganemCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='© Funder Platform'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {places.filter(p => p.latitude && p.longitude).map((place) => {
          const isFree = place.price === 0 || !place.price;
          const actionText = isFree ? "بدء المسار 🧭" : "حجز الآن 🎫";
          
          // 🗺️ التصحيح الجذري لرابط نظام الملاحة الفعلي لخرائط جوجل (Google Maps Navigation URL)
          const actionHref = !isLoggedIn 
            ? "/register" 
            : isFree 
            ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
            : `/places/${place.id}`;
          
          const target = (isLoggedIn && isFree) ? "_blank" : "_self";

          // 🌟 صناعة فقاعة السعر الذكية (Airbnb Style) مع رمز التصنيف لمنع التزحزح وإعطاء مظهر فخم
          const meta = getCategoryMeta(place.category);
          const priceTagIcon = L.divIcon({
            className: "custom-price-tag",
            html: `
              <div class="flex items-center gap-1 justify-center bg-white border-2 ${isFree ? 'border-green-500 text-green-600' : 'border-blue-600 text-blue-600'} font-black text-[11px] px-2 py-1 rounded-full shadow-md transition-all hover:bg-gray-900 hover:text-white duration-200 whitespace-nowrap">
                <span>${meta.emoji}</span>
                <span>${isFree ? 'مجاني' : place.price + ' دج'}</span>
              </div>
            `,
            iconSize: [65, 25],
            iconAnchor: [32, 12] // يضمن تثبيت السهم في النقطة الجغرافية بدقة متناهية
          });

          return (
            <Marker key={place.id} position={[place.latitude, place.longitude]} icon={priceTagIcon}>
              <Popup className="rounded-xl overflow-hidden">
                <div className="w-52 text-right p-1" dir="rtl">
                  {place.imageUrl ? (
                    <div className="w-full h-28 mb-2 bg-gray-100 rounded-lg overflow-hidden relative shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                      {isFree && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm">
                          دخول مجاني
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-24 mb-2 bg-blue-50 text-blue-300 flex items-center justify-center rounded-lg relative">
                      <MapPin size={28} />
                    </div>
                  )}
                  
                  <h3 className="font-bold text-gray-900 text-xs mb-1 line-clamp-1">{place.name}</h3>
                  <span className={`inline-block mb-2 rounded-full ${meta.bgClass} px-2 py-0.5 text-[10px] font-bold ${meta.textClass}`}>
                    {meta.emoji} {meta.label}
                  </span>
                  
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                    <span className={`font-black text-xs ${isFree ? "text-green-600" : "text-blue-600"}`}>
                      {isFree ? "مجاني" : `${place.price} د.ج`}
                    </span>
                    
                    <Link 
                      href={actionHref} 
                      target={target}
                      rel={target === "_blank" ? "noopener noreferrer" : ""}
                      className={`text-white text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition shadow-sm ${
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

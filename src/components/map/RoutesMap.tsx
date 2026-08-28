// src/components/map/RoutesMap.tsx
"use client"; // توجيه Next.js بأن هذا المكون يعمل في المتصفح فقط

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { getCategoryMeta } from '@/lib/placeCategoryIcons';

// 🎯 أيقونة مخصّصة لكل معلم حسب نوعه (رمز + لون مميّز)
function createCategoryIcon(category: string) {
  const meta = getCategoryMeta(category);
  return L.divIcon({
    className: 'custom-category-pin',
    html: `
      <div style="background:${meta.color}" class="flex items-center justify-center w-9 h-9 rounded-full border-2 border-white shadow-lg text-base">
        ${meta.emoji}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -32],
  });
}

// تعريف واجهة البيانات التي سيستقبلها المكون
interface Place {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
}

export default function RoutesMap({ places }: { places: Place[] }) {
  // إحداثيات ولاية مستغانم الافتراضية للتركيز عليها
  const mostaganemCenter: [number, number] = [35.9311, 0.0891];

  return (
    <div className="h-[600px] w-full overflow-hidden rounded-2xl border-2 border-gray-100 shadow-lg">
      <MapContainer 
        center={mostaganemCenter} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        {/* طبقة الخريطة المفتوحة (OpenStreetMap) المجانية */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* رسم المعالم السياحية على الخريطة */}
        {places.map((place) => {
          const meta = getCategoryMeta(place.category);
          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={createCategoryIcon(place.category)}
            >
              <Popup className="font-sans">
                <div className="text-right" dir="rtl">
                  <span className={`mb-1 inline-block rounded-full ${meta.bgClass} px-2 py-0.5 text-[10px] font-bold ${meta.textClass}`}>
                    {meta.emoji} {meta.label}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900">{place.name}</h3>
                  <a
                    href={`/places/${place.id}`}
                    className="mt-2 block text-xs text-blue-600 hover:underline"
                  >
                    التفاصيل والحجز &larr;
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

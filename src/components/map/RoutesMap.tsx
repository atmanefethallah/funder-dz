// src/components/map/RoutesMap.tsx
"use client"; // توجيه Next.js بأن هذا المكون يعمل في المتصفح فقط

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// إصلاح مشكلة الأيقونات الافتراضية في Leaflet مع Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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
        {places.map((place) => (
          <Marker 
            key={place.id} 
            position={[place.latitude, place.longitude]} 
            icon={customIcon}
          >
            <Popup className="font-sans">
              <div className="text-right" dir="rtl">
                <span className="mb-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                  {place.category === 'CULTURAL' ? 'مسلك ثقافي' : 'مسلك ترفيهي'}
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
        ))}
      </MapContainer>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

type PickerProps = {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number | null; // 🌟 استقبال خط العرض الحالي (اختياري)
  initialLng?: number | null; // 🌟 استقبال خط الطول الحالي (اختياري)
};

export default function LocationPickerMap({ onLocationSelect, initialLat, initialLng }: PickerProps) {
  // 📍 مركز الخريطة الافتراضي: إما الموقع الحالي للمعلم أو مركز مستغانم
  const defaultCenter = initialLat && initialLng 
    ? { lat: initialLat, lng: initialLng } 
    : { lat: 35.9311, lng: 0.0891 };
    
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  // 🔄 تحديث الدبوس تلقائياً إذا تم تمرير إحداثيات محفوظة مسبقاً
  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition({ lat: initialLat, lng: initialLng });
    }
  }, [initialLat, initialLng]);

  // مكون فرعي لالتقاط نقرات الشريك على الخريطة
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition({ lat, lng });
        onLocationSelect(lat, lng); // تمرير الإحداثيات الجديدة للنموذج الأب
      },
    });
    return position === null ? null : <Marker position={[position.lat, position.lng]} />;
  };

  return (
    <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-gray-200 shadow-inner z-0 relative">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={initialLat && initialLng ? 15 : 13} // 🔍 زووم أقرب لتسهيل التعديل الدقيق
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> Funder'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents />
      </MapContainer>
    </div>
  );
}

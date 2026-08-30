"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import Link from "next/link";
import { MapPin, LocateFixed } from "lucide-react";
import L from "leaflet";
import { getCategoryMeta } from "@/lib/placeCategoryIcons";

export type PlaceMarker = {
  id: string;
  name: string;
  category: string;
  price: number;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  isEvent?: boolean | null;
  eventEndsAt?: string | null;
};

function createPlaceIcon(place: PlaceMarker) {
  const meta = getCategoryMeta(place.category);
  const isFree = place.price === 0 || !place.price;
  const eventClass = place.isEvent ? "border-pink-500 text-pink-600" : isFree ? "border-green-500 text-green-600" : "border-blue-600 text-blue-600";
  return L.divIcon({
    className: "custom-place-pin",
    html: `<div class="flex items-center gap-1 bg-white border-2 ${eventClass} font-black text-[11px] px-2 py-1 rounded-full shadow-lg whitespace-nowrap"><span>${place.isEvent ? "🎉" : meta.emoji}</span><span>${isFree ? "مجاني" : place.price + " دج"}</span></div>`,
    iconSize: [68, 28], iconAnchor: [34, 14], popupAnchor: [0, -15],
  });
}

function FitBounds({ places }: { places: PlaceMarker[] }) {
  const map = useMap();
  useEffect(() => {
    const points = places.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
    if (points.length === 1) map.setView([points[0].latitude, points[0].longitude], 14);
    if (points.length > 1) map.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude])), { padding: [45, 45], maxZoom: 15 });
  }, [map, places]);
  return null;
}

function LocateControl() {
  const map = useMap();
  const locate = () => map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
  return (
    <button type="button" onClick={locate} title="حدد موقعي" className="absolute bottom-5 left-3 z-[1000] flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-blue-600 shadow-lg hover:bg-blue-50">
      <LocateFixed size={21} />
    </button>
  );
}

export default function InteractiveMap({ places, isLoggedIn, fill = false }: { places: PlaceMarker[]; isLoggedIn: boolean; fill?: boolean }) {
  const validPlaces = places.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
  return (
    <div className={`w-full overflow-hidden z-0 relative ${fill ? "h-full" : "h-[500px] rounded-3xl shadow-lg border-4 border-white"}`}>
      <MapContainer center={[35.9311, 0.0891]} zoom={12} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; OpenStreetMap — Funder DZ' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds places={validPlaces} />
        <LocateControl />
        {validPlaces.map((place) => {
          const isFree = place.price === 0 || !place.price;
          const actionHref = !isLoggedIn ? "/register" : isFree ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}` : `/places/${place.id}`;
          const target = isLoggedIn && isFree ? "_blank" : "_self";
          const meta = getCategoryMeta(place.category);
          return (
            <Marker key={place.id} position={[place.latitude, place.longitude]} icon={createPlaceIcon(place)}>
              <Popup>
                <div className="w-52 text-right p-1" dir="rtl">
                  {place.imageUrl ? <div className="w-full h-28 mb-2 rounded-lg overflow-hidden"><img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" /></div> : <div className="w-full h-24 mb-2 bg-blue-50 text-blue-300 flex items-center justify-center rounded-lg"><MapPin size={30} /></div>}
                  <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{place.name}</h3>
                  <span className={`inline-block mb-2 rounded-full ${place.isEvent ? "bg-pink-50 text-pink-700" : `${meta.bgClass} ${meta.textClass}`} px-2 py-0.5 text-[10px] font-bold`}>{place.isEvent ? "🎉 فعالية مؤقتة" : `${meta.emoji} ${meta.label}`}</span>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                    <span className={`font-black text-xs ${isFree ? "text-green-600" : "text-blue-600"}`}>{isFree ? "مجاني" : `${place.price} د.ج`}</span>
                    <Link href={actionHref} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} className={`text-white text-[11px] px-3 py-2 rounded-lg font-bold ${isFree ? "bg-green-600" : "bg-gray-900"}`}>{isFree ? "بدء المسار 🧭" : "الحجز والتفاصيل 🎫"}</Link>
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

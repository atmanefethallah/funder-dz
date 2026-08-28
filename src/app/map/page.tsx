import { query } from "@/lib/db";
import dynamic from 'next/dynamic';

const RoutesMap = dynamic(() => import('@/components/map/RoutesMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] w-full items-center justify-center rounded-2xl bg-gray-100 animate-pulse">
      <p className="text-lg font-semibold text-gray-500">جاري تحميل مسالك مستغانم...</p>
    </div>
  ),
});

type MapPlaceRow = {
  id: string;
  name: string;
  category: string;
  latitude: number | null;
  longitude: number | null;
};

async function getMapPlaces() {
  const places = await query<MapPlaceRow>(
    `SELECT "id", "name", "category", "latitude", "longitude" FROM "Place"`,
  );
  return places;
}

export default async function MapPage() {
  const places = await getMapPlaces();

  // 🛡️ تصفية المعالم التي تملك إحداّثيات صالحة فقط (تجنب قيم null)
  const validPlaces = places.filter(p => p.latitude !== null && p.longitude !== null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">المسالك السياحية</h1>
          <p className="mt-2 text-gray-600">
            تصفح الخريطة التفاعلية لاكتشاف المعالم والمسالك الخمسة بولاية مستغانم.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white shadow hover:bg-blue-700 transition">
            كل المسالك
          </button>
          <button className="rounded-full bg-white border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
            المسلك الثقافي
          </button>
        </div>
      </div>

      {/* 🚀 تمرير النسخة المصفاة للخريطة مع تأكيد النوع لضمان التوافق */}
      <RoutesMap places={validPlaces as any} />
    </div>
  );
}

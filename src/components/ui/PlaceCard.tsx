// src/components/ui/PlaceCard.tsx
import Link from 'next/link';
import { MapPin } from 'lucide-react';

interface PlaceCardProps {
  id: string;
  name: string;
  category: string;
  imageUrl?: string; // اختياري لاحقاً
}

export const PlaceCard = ({ id, name, category }: PlaceCardProps) => {
  return (
    <div className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md">
      {/* مساحة الصورة الافتراضية */}
      <div className="h-48 w-full bg-gray-200 group-hover:bg-gray-300 transition-colors flex items-center justify-center">
        <span className="text-gray-400">صورة المعلم</span>
      </div>
      
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
            {category}
          </span>
        </div>
        <h3 className="mb-1 text-lg font-bold text-gray-900">{name}</h3>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="flex items-center text-sm text-gray-500">
            <MapPin size={14} className="ml-1" /> مستغانم
          </span>
          <Link 
            href={`/places/${id}`} 
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            عرض المسار &larr;
          </Link>
        </div>
      </div>
    </div>
  );
};

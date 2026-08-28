"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Map } from "lucide-react";

export default function SearchFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // قراءة القيم الحالية من الرابط (إن وجدت)
  const initialQ = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "الكل";

  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory);

  const categories = ["الكل", "تاريخي", "ترفيهي", "طبيعي", "فعالية"];

  // تحديث الرابط برمجياً عند البحث أو تغيير التصنيف
  const updateUrl = (searchQuery: string, selectedCategory: string) => {
    const params = new URLSearchParams();
    if (searchQuery.trim() !== "") params.set("q", searchQuery);
    if (selectedCategory !== "الكل") params.set("category", selectedCategory);
    
    router.push(`/explore?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl(q, category);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    updateUrl(q, cat);
  };

  return (
    <div className="mb-8 rounded-2xl bg-white p-4 shadow-md border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
      
      {/* 🔍 حقل البحث النصي */}
      <form onSubmit={handleSearchSubmit} className="relative w-full md:w-1/2">
        <input 
          type="text" 
          placeholder="ابحث عن معلم، غابة، متحف..." 
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pr-12 pl-4 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 font-medium"
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition">
          <Search size={24} />
        </button>
      </form>

      {/* 🏷️ أزرار التصفية (التصنيفات) */}
      <div className="flex w-full md:w-auto overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold transition-all duration-300 ${
              category === cat 
                ? "bg-blue-600 text-white shadow-md scale-105" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat === "الكل" ? <span className="flex items-center gap-1"><Map size={16}/> الكل</span> : cat}
          </button>
        ))}
      </div>

    </div>
  );
}

// 🗺️ دالة حساب المسافة الجغرافية الدقيقة بين نقطتين على كوكب الأرض (بالكيلومتر)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// حساب متوسط التقييمات لكل معلم
function getAverageRating(reviews: any[]): number {
  if (!reviews || reviews.length === 0) return 4.0; // تقييم افتراضي للمعالم الجديدة
  return reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
}

export function generateSmartItinerary(allPlaces: any[], budgetTier: 'LOW' | 'MEDIUM' | 'HIGH') {
  // 1️⃣ تصنيف المعالم بناءً على الميزانية (Low: مجاني ومثالي، Medium: متوسط، High: فاخر)
  const budgetFiltered = allPlaces.filter((place) => {
    if (budgetTier === 'LOW') return place.price <= 300; // مجاني أو رمزي
    if (budgetTier === 'MEDIUM') return place.price > 300 && place.price <= 2500;
    return place.price > 2500; // ميزانية مفتوحة وفاخرة
  });

  // إذا كانت الميزانية المختارة فارغة، نستخدم كافة المعالم كدعم احترافي (Fallback)
  const workingPool = budgetFiltered.length > 0 ? budgetFiltered : allPlaces;

  // 2️⃣ فصل الأماكن حسب التصنيف والنوع الجغرافي
  const activities = workingPool.filter(p => !['مطعم', 'مقهى', 'أكل'].includes(p.category));
  const eateries = allPlaces.filter(p => ['مطعم', 'مقهى', 'أكل', 'فنادق وإقامة'].includes(p.category));

  // ترتيب الأنشطة حسب أعلى تقييم أولاً لضمان جودة الرحلة
  const sortedActivities = [...activities].sort((a, b) => getAverageRating(b.reviews) - getAverageRating(a.reviews));

  // اختصار أنشطة اليوم (نشاط صباحي ونشاط مسائي)
  const morningActivity = sortedActivities[0] || allPlaces[0];
  const afternoonActivity = sortedActivities[1] || allPlaces[1] || morningActivity;

  // 3️⃣ خوارزمية البحث الجغرافي عن الأقرب (Proximity Matching Engine) 🎯
  const findClosestEatery = (referencePlace: any, subCategoryTag: string) => {
    if (!referencePlace || !referencePlace.latitude) return eateries[0];

    return eateries
      .filter(e => e.id !== referencePlace.id) // تجنب اختيار نفس المكان
      .map(eatery => ({
        ...eatery,
        distance: calculateDistance(
          referencePlace.latitude,
          referencePlace.longitude,
          eatery.latitude,
          eatery.longitude
        )
      }))
      // الترتيب حسب الأقرب مسافة أولاً، ثم الأعلى تقييماً
      .sort((a, b) => a.distance - b.distance || getAverageRating(b.reviews) - getAverageRating(a.reviews))[0];
  };

  // توليد جدول اليوم الذكي المتناسق جغرافياً
  return {
    breakfast: findClosestEatery(morningActivity, 'فطور'),
    morningActivity: morningActivity,
    lunch: findClosestEatery(morningActivity, 'غداء'), // الغداء قريب من نشاط الصباح
    afternoonActivity: afternoonActivity,
    coffeeTime: findClosestEatery(afternoonActivity, 'مقهى'), // القهوة قريبة من نشاط المساء
    dinner: findClosestEatery(afternoonActivity, 'عشاء')
  };
}

// src/lib/recommendations.ts — محرك التوصيات المخصّصة
import { query } from "@/lib/db";

export type RecommendedPlace = {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
};

type PlaceWithReviewsRow = {
  id: string;
  name: string;
  category: string;
  price: string;
  imageUrl: string | null;
  reviews: Array<{ rating: number }>;
};

function serialize(p: PlaceWithReviewsRow): RecommendedPlace {
  const reviews = p.reviews || [];
  const avg = reviews.length
    ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10
    : null;
  return { id: p.id, name: p.name, category: p.category, price: Number(p.price), imageUrl: p.imageUrl, avgRating: avg, reviewCount: reviews.length };
}

async function fetchPlacesWithReviews(whereSql: string, params: unknown[], limit: number): Promise<PlaceWithReviewsRow[]> {
  return query<PlaceWithReviewsRow>(
    `SELECT p."id", p."name", p."category", p."price", p."imageUrl",
            COALESCE(json_agg(json_build_object('rating', r."rating")) FILTER (WHERE r."id" IS NOT NULL), '[]') AS reviews
     FROM "Place" p
     LEFT JOIN "Review" r ON r."placeId" = p."id"
     ${whereSql}
     GROUP BY p."id"
     ORDER BY p."createdAt" DESC
     LIMIT ${limit}`,
    params,
  );
}

export async function getRecommendations(userId: string | null, limit = 6): Promise<RecommendedPlace[]> {
  if (!userId) {
    const places = await fetchPlacesWithReviews("", [], limit * 2);
    return places.map(serialize).sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0)).slice(0, limit);
  }

  const wishlistRows = await query<{ place_id: string; place_category: string }>(
    `SELECT p."id" AS place_id, p."category" AS place_category FROM "Wishlist" w JOIN "Place" p ON p."id" = w."placeId" WHERE w."userId" = $1`,
    [userId],
  );
  const bookingRows = await query<{ place_id: string; place_category: string }>(
    `SELECT p."id" AS place_id, p."category" AS place_category FROM "Booking" b JOIN "Place" p ON p."id" = b."placeId" WHERE b."userId" = $1`,
    [userId],
  );

  const seenIds = new Set<string>([...wishlistRows.map((w) => w.place_id), ...bookingRows.map((b) => b.place_id)]);
  const categoryScore = new Map<string, number>();
  for (const c of [...wishlistRows.map((w) => w.place_category), ...bookingRows.map((b) => b.place_category)]) {
    categoryScore.set(c, (categoryScore.get(c) || 0) + 1);
  }
  const topCategories = [...categoryScore.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);

  let recommended: RecommendedPlace[] = [];
  if (topCategories.length > 0) {
    const excludeArr = [...seenIds];
    const places = await query<PlaceWithReviewsRow>(
      `SELECT p."id", p."name", p."category", p."price", p."imageUrl",
              COALESCE(json_agg(json_build_object('rating', r."rating")) FILTER (WHERE r."id" IS NOT NULL), '[]') AS reviews
       FROM "Place" p
       LEFT JOIN "Review" r ON r."placeId" = p."id"
       WHERE p."category" = ANY($1::text[]) AND NOT (p."id" = ANY($2::text[]))
       GROUP BY p."id"
       ORDER BY p."createdAt" DESC
       LIMIT $3`,
      [topCategories, excludeArr.length ? excludeArr : [""], limit * 2],
    );
    recommended = places.map(serialize).sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  }

  if (recommended.length < limit) {
    const exclude = [...seenIds, ...recommended.map((r) => r.id)];
    const more = await query<PlaceWithReviewsRow>(
      `SELECT p."id", p."name", p."category", p."price", p."imageUrl",
              COALESCE(json_agg(json_build_object('rating', r."rating")) FILTER (WHERE r."id" IS NOT NULL), '[]') AS reviews
       FROM "Place" p
       LEFT JOIN "Review" r ON r."placeId" = p."id"
       WHERE NOT (p."id" = ANY($1::text[]))
       GROUP BY p."id"
       ORDER BY p."createdAt" DESC
       LIMIT $2`,
      [exclude.length ? exclude : [""], limit * 2],
    );
    const moreSerialized = more
      .map(serialize)
      .filter((m) => !recommended.some((r) => r.id === m.id))
      .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
    recommended = [...recommended, ...moreSerialized];
  }

  return recommended.slice(0, limit);
}

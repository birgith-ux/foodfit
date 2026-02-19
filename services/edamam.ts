import { NutritionData } from './openFoodFacts';

export async function searchEdamam(
  query: string,
  appId: string,
  appKey: string
): Promise<NutritionData[]> {
  if (!appId || !appKey) return [];
  try {
    const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(query)}&nutrition-type=logging`;
    const res = await fetch(url);
    const data = await res.json();

    const results: NutritionData[] = [];
    for (const hint of data.hints || []) {
      const f = hint.food;
      const n = f.nutrients;
      if (!n || !n.ENERC_KCAL) continue;
      results.push({
        name: f.label,
        kcal_100g: Math.round(n.ENERC_KCAL * 10) / 10,
        protein_100g: Math.round((n.PROCNT || 0) * 10) / 10,
        carbs_100g: Math.round((n.CHOCDF || 0) * 10) / 10,
        fat_100g: Math.round((n.FAT || 0) * 10) / 10,
        brand: f.brand,
        imageUrl: f.image,
      });
    }
    return results.slice(0, 10);
  } catch (e) {
    console.error('Edamam search error:', e);
    return [];
  }
}

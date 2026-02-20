const BASE_URL = 'https://world.openfoodfacts.org';

export interface NutritionData {
  name: string;
  barcode?: string;
  kcal_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  brand?: string;
  imageUrl?: string;
}

function parseProduct(product: any): NutritionData | null {
  const n = product.nutriments;
  if (!n) return null;

  const kcal = n['energy-kcal_100g'] || n['energy_100g'] / 4.184 || 0;
  if (!kcal) return null;

  return {
    name: product.product_name_nl || product.product_name || 'Onbekend product',
    barcode: product.code,
    kcal_100g: Math.round(kcal * 10) / 10,
    protein_100g: Math.round((n.proteins_100g || 0) * 10) / 10,
    carbs_100g: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
    fat_100g: Math.round((n.fat_100g || 0) * 10) / 10,
    brand: product.brands,
    imageUrl: product.image_small_url,
  };
}

export async function searchByBarcode(barcode: string): Promise<NutritionData | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    return parseProduct(data.product);
  } catch (e) {
    console.error('Barcode lookup error:', e);
    return null;
  }
}

export async function searchByName(query: string): Promise<NutritionData[]> {
  try {
    const url = `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=30&action=process&lc=nl&cc=nl&sort_by=unique_scans_n`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.products) return [];

    const results: NutritionData[] = [];
    for (const product of data.products) {
      const parsed = parseProduct(product);
      if (parsed && parsed.name && parsed.name !== 'Onbekend product') results.push(parsed);
    }

    // Sorteer: producten waarvan de naam begint met de zoekterm komen bovenaan
    const q = query.toLowerCase().trim();
    results.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts;
    });

    return results.slice(0, 15);
  } catch (e) {
    console.error('Search error:', e);
    return [];
  }
}

export function calculateMacrosFromGrams(
  protein_g: number,
  carbs_g: number,
  fat_g: number
): { protein_kcal: number; carbs_kcal: number; fat_kcal: number; total_kcal: number } {
  const protein_kcal = protein_g * 4;
  const carbs_kcal = carbs_g * 4;
  const fat_kcal = fat_g * 9;
  return {
    protein_kcal,
    carbs_kcal,
    fat_kcal,
    total_kcal: protein_kcal + carbs_kcal + fat_kcal,
  };
}

export function scaleNutrition(
  per100g: { kcal: number; protein: number; carbs: number; fat: number },
  amount_g: number
): { kcal: number; protein_g: number; carbs_g: number; fat_g: number } {
  const factor = amount_g / 100;
  return {
    kcal: per100g.kcal * factor,
    protein_g: per100g.protein * factor,
    carbs_g: per100g.carbs * factor,
    fat_g: per100g.fat * factor,
  };
}

export function getProgressColor(percentage: number): string {
  if (percentage > 105) return '#E74C3C';
  if (percentage > 90) return '#F39C12';
  return '#2ECC71';
}

export function sumMacros(items: Array<{
  kcal?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
}>): { kcal: number; protein_g: number; carbs_g: number; fat_g: number } {
  let kcal = 0;
  let protein_g = 0;
  let carbs_g = 0;
  let fat_g = 0;
  for (const item of items) {
    kcal += item.kcal ?? 0;
    protein_g += item.protein_g ?? 0;
    carbs_g += item.carbs_g ?? 0;
    fat_g += item.fat_g ?? 0;
  }
  return { kcal, protein_g, carbs_g, fat_g };
}

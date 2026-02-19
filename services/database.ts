import { supabase } from './supabase';

// ─── Days ────────────────────────────────────────────────────────────────────

export interface DayRow {
  id: string;
  day_type: string;
  water_ml: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function getOrCreateDay(dateStr: string, defaultType = 'rest'): Promise<DayRow> {
  const { data: existing } = await supabase
    .from('days')
    .select('*')
    .eq('id', dateStr)
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('days')
    .insert({ id: dateStr, day_type: defaultType, water_ml: 0 })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDayType(dateStr: string, dayType: string): Promise<void> {
  const { error } = await supabase
    .from('days')
    .update({ day_type: dayType, updated_at: new Date().toISOString() })
    .eq('id', dateStr);
  if (error) throw error;
}

export async function updateWater(dateStr: string, water_ml: number): Promise<void> {
  const { error } = await supabase
    .from('days')
    .update({ water_ml, updated_at: new Date().toISOString() })
    .eq('id', dateStr);
  if (error) throw error;
}

export async function getDaysInRange(from: string, to: string): Promise<DayRow[]> {
  const { data, error } = await supabase
    .from('days')
    .select('*')
    .gte('id', from)
    .lte('id', to)
    .order('id');
  if (error) throw error;
  return data ?? [];
}

// ─── Meal Slots ───────────────────────────────────────────────────────────────

export interface MealSlotRow {
  id: string;
  day_id: string;
  slot_name: string;
  slot_order: number;
  target_kcal: number | null;
}

export async function getMealSlots(dayId: string): Promise<MealSlotRow[]> {
  const { data, error } = await supabase
    .from('meal_slots')
    .select('*')
    .eq('day_id', dayId)
    .order('slot_order');
  if (error) throw error;
  return data ?? [];
}

export async function upsertMealSlots(dayId: string, slots: Omit<MealSlotRow, 'day_id'>[]): Promise<void> {
  const rows = slots.map((s) => ({ ...s, day_id: dayId }));
  const { error } = await supabase.from('meal_slots').upsert(rows);
  if (error) throw error;
}

export async function addMealSlot(slot: MealSlotRow): Promise<void> {
  const { error } = await supabase.from('meal_slots').upsert(slot);
  if (error) throw error;
}

// ─── Food Logs ────────────────────────────────────────────────────────────────

export interface FoodLogRow {
  id: string;
  day_id: string;
  meal_slot_id: string | null;
  product_name: string;
  barcode?: string | null;
  amount_g: number;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  source: string | null;
  logged_at: string;
}

export async function getFoodLogs(dayId: string): Promise<FoodLogRow[]> {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('day_id', dayId)
    .order('logged_at');
  if (error) throw error;
  return data ?? [];
}

export async function getFoodLogsForSlot(slotId: string): Promise<FoodLogRow[]> {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('meal_slot_id', slotId)
    .order('logged_at');
  if (error) throw error;
  return data ?? [];
}

export async function addFoodLog(log: FoodLogRow): Promise<void> {
  const { error } = await supabase.from('food_logs').insert(log);
  if (error) throw error;
}

export async function deleteFoodLog(id: string): Promise<void> {
  const { error } = await supabase.from('food_logs').delete().eq('id', id);
  if (error) throw error;
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export interface FavoriteRow {
  id: string;
  name: string;
  type: string;
  created_at: string;
}

export interface FavoriteItemRow {
  id: string;
  favorite_id: string;
  product_name: string;
  amount_g: number;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

export async function getFavorites(): Promise<FavoriteRow[]> {
  const { data, error } = await supabase.from('favorites').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getFavoriteItems(favoriteId: string): Promise<FavoriteItemRow[]> {
  const { data, error } = await supabase
    .from('favorite_items')
    .select('*')
    .eq('favorite_id', favoriteId);
  if (error) throw error;
  return data ?? [];
}

export async function addFavorite(fav: FavoriteRow): Promise<void> {
  const { error } = await supabase.from('favorites').insert(fav);
  if (error) throw error;
}

export async function addFavoriteItem(item: FavoriteItemRow): Promise<void> {
  const { error } = await supabase.from('favorite_items').insert(item);
  if (error) throw error;
}

export async function deleteFavorite(id: string): Promise<void> {
  const { error } = await supabase.from('favorites').delete().eq('id', id);
  if (error) throw error;
}

export async function renameFavorite(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('favorites').update({ name }).eq('id', id);
  if (error) throw error;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getSetting(key: string): Promise<string | null> {
  return await AsyncStorage.getItem(`setting_${key}`);
}

export async function setSetting(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(`setting_${key}`, value);
}

// ─── Plan Slots & Items ───────────────────────────────────────────────────────

export interface PlanSlotRow {
  id: string;
  plan_date: string;
  slot_name: string;
  slot_order: number;
  target_kcal: number | null;
}

export interface PlanItemRow {
  id: string;
  plan_slot_id: string;
  product_name: string;
  amount_g: number;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

export async function getPlanSlots(date: string): Promise<PlanSlotRow[]> {
  const { data, error } = await supabase
    .from('plan_slots')
    .select('*')
    .eq('plan_date', date)
    .order('slot_order');
  if (error) throw error;
  return data ?? [];
}

export async function addPlanSlot(slot: PlanSlotRow): Promise<void> {
  const { error } = await supabase.from('plan_slots').upsert(slot);
  if (error) throw error;
}

export async function getPlanItems(slotId: string): Promise<PlanItemRow[]> {
  const { data, error } = await supabase
    .from('plan_items')
    .select('*')
    .eq('plan_slot_id', slotId);
  if (error) throw error;
  return data ?? [];
}

export async function addPlanItem(item: PlanItemRow): Promise<void> {
  const { error } = await supabase.from('plan_items').insert(item);
  if (error) throw error;
}

export async function deletePlanItem(id: string): Promise<void> {
  const { error } = await supabase.from('plan_items').delete().eq('id', id);
  if (error) throw error;
}

export async function getAllPlanItemsForWeek(
  dates: string[]
): Promise<Array<PlanItemRow & { plan_date: string }>> {
  const { data, error } = await supabase
    .from('plan_items')
    .select('*, plan_slots!inner(plan_date)')
    .in('plan_slots.plan_date', dates);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    ...row,
    plan_date: row.plan_slots.plan_date,
    plan_slots: undefined,
  }));
}

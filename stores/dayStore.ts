import { create } from 'zustand';
import { generateId as uuidv4 } from '../utils/uuid';
import {
  getOrCreateDay, updateDayType, updateWater, DayRow,
  getMealSlots, upsertMealSlots, addMealSlot, MealSlotRow,
  getFoodLogs, addFoodLog, deleteFoodLog, FoodLogRow,
} from '../services/database';
import { MEAL_TEMPLATES } from '../constants/mealTemplates';
import { DayType } from '../constants/macroGoals';
import { todayString } from '../utils/dateHelpers';

interface DayState {
  currentDate: string;
  day: DayRow | null;
  mealSlots: MealSlotRow[];
  foodLogs: FoodLogRow[];
  loading: boolean;
  loadDay: (dateStr?: string) => Promise<void>;
  setDayType: (type: DayType) => Promise<void>;
  setWater: (ml: number) => Promise<void>;
  addFoodEntry: (entry: Omit<FoodLogRow, 'id' | 'logged_at'> & { barcode?: string | null }) => Promise<void>;
  removeFoodEntry: (id: string) => Promise<void>;
  ensureMealSlots: (dayType: DayType) => Promise<void>;
  addCustomMealSlot: (slotName: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useDayStore = create<DayState>((set, get) => ({
  currentDate: todayString(),
  day: null,
  mealSlots: [],
  foodLogs: [],
  loading: false,

  loadDay: async (dateStr?: string) => {
    const date = dateStr || todayString();
    set({ loading: true, currentDate: date });
    try {
      const day = await getOrCreateDay(date);
      const slots = await getMealSlots(date);
      const logs = await getFoodLogs(date);

      // If no slots exist, create them from template
      if (slots.length === 0) {
        await get().ensureMealSlots(day.day_type as DayType);
        const newSlots = await getMealSlots(date);
        set({ day, mealSlots: newSlots, foodLogs: logs, loading: false });
      } else {
        set({ day, mealSlots: slots, foodLogs: logs, loading: false });
      }
    } catch (e) {
      console.error('loadDay error:', e);
      set({ loading: false });
    }
  },

  setDayType: async (type: DayType) => {
    const { currentDate } = get();
    await updateDayType(currentDate, type);
    // Recreate meal slots for new day type
    const templates = MEAL_TEMPLATES[type];
    const slots: Omit<MealSlotRow, 'day_id'>[] = templates.map((t) => ({
      id: `${currentDate}-${t.slot_order}`,
      slot_name: t.slot_name,
      slot_order: t.slot_order,
      target_kcal: t.target_kcal,
    }));
    await upsertMealSlots(currentDate, slots);
    const day = await getOrCreateDay(currentDate);
    const mealSlots = await getMealSlots(currentDate);
    set({ day, mealSlots });
  },

  setWater: async (ml: number) => {
    const { currentDate, day } = get();
    await updateWater(currentDate, ml);
    if (day) set({ day: { ...day, water_ml: ml } });
  },

  addFoodEntry: async (entry) => {
    const id = uuidv4();
    const log: FoodLogRow = {
      ...entry,
      id,
      barcode: entry.barcode ?? null,
      logged_at: new Date().toISOString(),
    };
    await addFoodLog(log);
    set((state) => ({ foodLogs: [...state.foodLogs, log] }));
  },

  removeFoodEntry: async (id: string) => {
    await deleteFoodLog(id);
    set((state) => ({ foodLogs: state.foodLogs.filter((f) => f.id !== id) }));
  },

  ensureMealSlots: async (dayType: DayType) => {
    const { currentDate } = get();
    const templates = MEAL_TEMPLATES[dayType];
    const slots: Omit<MealSlotRow, 'day_id'>[] = templates.map((t) => ({
      id: `${currentDate}-${t.slot_order}`,
      slot_name: t.slot_name,
      slot_order: t.slot_order,
      target_kcal: t.target_kcal,
    }));
    await upsertMealSlots(currentDate, slots);
  },

  addCustomMealSlot: async (slotName: string) => {
    const { currentDate, mealSlots } = get();
    const maxOrder = mealSlots.reduce((m, s) => Math.max(m, s.slot_order), 0);
    const slot: MealSlotRow = {
      id: uuidv4(),
      day_id: currentDate,
      slot_name: slotName,
      slot_order: maxOrder + 1,
      target_kcal: null,
    };
    await addMealSlot(slot);
    set((state) => ({ mealSlots: [...state.mealSlots, slot] }));
  },

  refresh: async () => {
    const { currentDate } = get();
    await get().loadDay(currentDate);
  },
}));

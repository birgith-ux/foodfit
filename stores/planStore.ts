import { create } from 'zustand';
import { generateId as uuidv4 } from '../utils/uuid';
import {
  getPlanSlots, addPlanSlot, getPlanItems, addPlanItem, deletePlanItem,
  PlanSlotRow, PlanItemRow,
  getOrCreateDay, updateDayType, getDaysInRange, DayRow,
  upsertMealSlots,
} from '../services/database';
import { MEAL_TEMPLATES } from '../constants/mealTemplates';
import { DayType } from '../constants/macroGoals';

interface PlanState {
  planSlots: Record<string, PlanSlotRow[]>; // date -> slots
  planItems: Record<string, PlanItemRow[]>; // slotId -> items
  dayTypes: Record<string, string>; // date -> dayType
  loadWeek: (dates: string[]) => Promise<void>;
  setDayTypeForDate: (date: string, type: DayType) => Promise<void>;
  addPlanEntry: (slotId: string, item: Omit<PlanItemRow, 'id' | 'plan_slot_id'>) => Promise<void>;
  removePlanEntry: (itemId: string, slotId: string) => Promise<void>;
  ensurePlanSlots: (date: string, dayType: DayType) => Promise<PlanSlotRow[]>;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  planSlots: {},
  planItems: {},
  dayTypes: {},

  loadWeek: async (dates: string[]) => {
    const planSlots: Record<string, PlanSlotRow[]> = {};
    const planItems: Record<string, PlanItemRow[]> = {};
    const dayTypes: Record<string, string> = {};

    for (const date of dates) {
      const slots = await getPlanSlots(date);
      planSlots[date] = slots;
      for (const slot of slots) {
        const items = await getPlanItems(slot.id);
        planItems[slot.id] = items;
      }
      const day = await getOrCreateDay(date);
      dayTypes[date] = day.day_type;
    }

    set({ planSlots, planItems, dayTypes });
  },

  setDayTypeForDate: async (date: string, type: DayType) => {
    await updateDayType(date, type);
    const slots = await get().ensurePlanSlots(date, type);
    set((state) => ({
      dayTypes: { ...state.dayTypes, [date]: type },
      planSlots: { ...state.planSlots, [date]: slots },
    }));
  },

  ensurePlanSlots: async (date: string, dayType: DayType) => {
    const existing = await getPlanSlots(date);
    if (existing.length > 0) return existing;

    const templates = MEAL_TEMPLATES[dayType];
    const slots: PlanSlotRow[] = templates.map((t) => ({
      id: `plan-${date}-${t.slot_order}`,
      plan_date: date,
      slot_name: t.slot_name,
      slot_order: t.slot_order,
      target_kcal: t.target_kcal,
    }));
    for (const slot of slots) {
      await addPlanSlot(slot);
    }
    return slots;
  },

  addPlanEntry: async (slotId: string, itemData) => {
    const item: PlanItemRow = { ...itemData, id: uuidv4(), plan_slot_id: slotId };
    await addPlanItem(item);
    set((state) => ({
      planItems: {
        ...state.planItems,
        [slotId]: [...(state.planItems[slotId] || []), item],
      },
    }));
  },

  removePlanEntry: async (itemId: string, slotId: string) => {
    await deletePlanItem(itemId);
    set((state) => ({
      planItems: {
        ...state.planItems,
        [slotId]: (state.planItems[slotId] || []).filter((i) => i.id !== itemId),
      },
    }));
  },
}));

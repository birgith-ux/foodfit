import { DayType } from './macroGoals';

export interface MealSlotTemplate {
  slot_name: string;
  slot_order: number;
  target_kcal: number | null;
  time_hint?: string;
}

export const MEAL_TEMPLATES: Record<DayType, MealSlotTemplate[]> = {
  training: [
    { slot_name: 'Pre-workout', slot_order: 1, target_kcal: null, time_hint: 'Voor training' },
    { slot_name: 'Post-workout / Ontbijt', slot_order: 2, target_kcal: 450, time_hint: 'Na training' },
    { slot_name: 'Tussendoor', slot_order: 3, target_kcal: null, time_hint: '11:00' },
    { slot_name: 'Lunch', slot_order: 4, target_kcal: 450, time_hint: '12:30' },
    { slot_name: 'Tussendoor', slot_order: 5, target_kcal: 500, time_hint: '15:30' },
    { slot_name: 'Avondeten', slot_order: 6, target_kcal: 650, time_hint: '18:30' },
    { slot_name: 'Avondsnack', slot_order: 7, target_kcal: 200, time_hint: '20:00' },
  ],
  longrun: [
    { slot_name: 'Pre-workout', slot_order: 1, target_kcal: 500, time_hint: 'Voor training' },
    { slot_name: 'Intra-workout', slot_order: 2, target_kcal: 400, time_hint: '10:00–12:00' },
    { slot_name: 'Post-workout', slot_order: 3, target_kcal: 600, time_hint: '13:00' },
    { slot_name: 'Tussendoor', slot_order: 4, target_kcal: 500, time_hint: '15:30' },
    { slot_name: 'Avondeten', slot_order: 5, target_kcal: 650, time_hint: '18:30' },
    { slot_name: 'Avondsnack', slot_order: 6, target_kcal: 200, time_hint: '20:00' },
  ],
  rest: [
    { slot_name: 'Ontbijt', slot_order: 1, target_kcal: null, time_hint: 'Ochtend' },
    { slot_name: 'Tussendoor', slot_order: 2, target_kcal: null, time_hint: 'Ochtend' },
    { slot_name: 'Lunch', slot_order: 3, target_kcal: null, time_hint: '12:30' },
    { slot_name: 'Tussendoor', slot_order: 4, target_kcal: null, time_hint: '15:30' },
    { slot_name: 'Avondeten', slot_order: 5, target_kcal: null, time_hint: '18:30' },
    { slot_name: 'Avondsnack', slot_order: 6, target_kcal: null, time_hint: '20:00' },
  ],
};

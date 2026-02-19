export type DayType = 'rest' | 'training' | 'longrun';

export interface MacroGoals {
  kcal: number;
  carbs_g: number;
  carbs_kcal: number;
  protein_g: number;
  protein_kcal: number;
  fat_g: number;
  fat_kcal: number;
}

export const MACRO_GOALS: Record<DayType, MacroGoals> = {
  rest: {
    kcal: 2000,
    carbs_g: 225,
    carbs_kcal: 900,
    protein_g: 150,
    protein_kcal: 600,
    fat_g: 56,
    fat_kcal: 500,
  },
  training: {
    kcal: 2400,
    carbs_g: 300,
    carbs_kcal: 1200,
    protein_g: 115,
    protein_kcal: 460,
    fat_g: 80,
    fat_kcal: 720,
  },
  longrun: {
    kcal: 2800,
    carbs_g: 400,
    carbs_kcal: 1600,
    protein_g: 115,
    protein_kcal: 460,
    fat_g: 80,
    fat_kcal: 720,
  },
};

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  rest: 'Rustdag',
  training: 'Trainingsdag',
  longrun: 'Long Run dag',
};

export const DAY_TYPE_ICONS: Record<DayType, string> = {
  rest: '🛌',
  training: '🏃',
  longrun: '🏅',
};

export const COLORS = {
  // Backgrounds
  background: '#0F0A1E',
  backgroundSecondary: '#1A1035',
  card: '#1E1545',
  cardLight: '#FFFFFF',

  // Primary purple
  primary: '#6C3FE8',
  primaryLight: '#8B6BF0',
  primaryGlow: 'rgba(108, 63, 232, 0.3)',

  // Macros
  kcal: '#F87171',
  carbs: '#FB923C',
  protein: '#60A5FA',
  fat: '#A78BFA',
  water: '#34D399',

  // Text
  text: '#F8F7FF',
  textMuted: '#9B8EC4',
  textOnLight: '#1A1035',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(108, 63, 232, 0.3)',

  // Status
  success: '#34D399',
  warning: '#FB923C',
  danger: '#F87171',

  // Gradients (used as array for LinearGradient)
  gradientPrimary: ['#6C3FE8', '#A78BFA'] as string[],
  gradientBg: ['#1A1035', '#0F0A1E'] as string[],
};

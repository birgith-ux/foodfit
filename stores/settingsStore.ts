import { create } from 'zustand';
import { getSetting, setSetting } from '../services/database';

interface SettingsState {
  startDayOfWeek: number; // 0=Mon, 1=Tue, ..., 6=Sun
  defaultDayType: string;
  waterGoalMl: number;
  claudeApiKey: string;
  edamamAppId: string;
  edamamAppKey: string;
  supabaseEnabled: boolean;
  initialized: boolean;
  loadSettings: () => Promise<void>;
  setStartDayOfWeek: (day: number) => Promise<void>;
  setDefaultDayType: (type: string) => Promise<void>;
  setWaterGoalMl: (ml: number) => Promise<void>;
  setClaudeApiKey: (key: string) => Promise<void>;
  setEdamamAppId: (id: string) => Promise<void>;
  setEdamamAppKey: (key: string) => Promise<void>;
  setSupabaseEnabled: (enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  startDayOfWeek: 0,
  defaultDayType: 'rest',
  waterGoalMl: 2000,
  claudeApiKey: '',
  edamamAppId: '',
  edamamAppKey: '',
  supabaseEnabled: false,
  initialized: false,

  loadSettings: async () => {
    const startDay = await getSetting('startDayOfWeek');
    const defaultType = await getSetting('defaultDayType');
    const waterGoal = await getSetting('waterGoalMl');
    const claudeKey = await getSetting('claudeApiKey');
    const edamamId = await getSetting('edamamAppId');
    const edamamKey = await getSetting('edamamAppKey');
    const supabase = await getSetting('supabaseEnabled');
    set({
      startDayOfWeek: startDay ? parseInt(startDay) : 0,
      defaultDayType: defaultType || 'rest',
      waterGoalMl: waterGoal ? parseInt(waterGoal) : 2000,
      claudeApiKey: claudeKey || '',
      edamamAppId: edamamId || '',
      edamamAppKey: edamamKey || '',
      supabaseEnabled: supabase === 'true',
      initialized: true,
    });
  },

  setStartDayOfWeek: async (day: number) => {
    await setSetting('startDayOfWeek', String(day));
    set({ startDayOfWeek: day });
  },

  setDefaultDayType: async (type: string) => {
    await setSetting('defaultDayType', type);
    set({ defaultDayType: type });
  },

  setWaterGoalMl: async (ml: number) => {
    await setSetting('waterGoalMl', String(ml));
    set({ waterGoalMl: ml });
  },

  setClaudeApiKey: async (key: string) => {
    await setSetting('claudeApiKey', key);
    set({ claudeApiKey: key });
  },

  setEdamamAppId: async (id: string) => {
    await setSetting('edamamAppId', id);
    set({ edamamAppId: id });
  },

  setEdamamAppKey: async (key: string) => {
    await setSetting('edamamAppKey', key);
    set({ edamamAppKey: key });
  },

  setSupabaseEnabled: async (enabled: boolean) => {
    await setSetting('supabaseEnabled', String(enabled));
    set({ supabaseEnabled: enabled });
  },
}));

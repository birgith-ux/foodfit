import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useDayStore } from '../../stores/dayStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { COLORS, DAY_TYPE_LABELS, DAY_TYPE_ICONS, MACRO_GOALS, DayType } from '../../constants/macroGoals';
import { MEAL_TEMPLATES } from '../../constants/mealTemplates';
import { sumMacros } from '../../utils/macroCalculations';
import { formatDayOfWeek, formatDateDutch, todayString } from '../../utils/dateHelpers';
import MacroBar from '../../components/MacroBar';
import WaterTracker from '../../components/WaterTracker';
import MealSlot from '../../components/MealSlot';
import AddFoodModal from '../../components/AddFoodModal';
import AIAdviceCard from '../../components/AIAdviceCard';
import { getDayAdvice } from '../../services/claudeAPI';
import { MealSlotRow } from '../../services/database';
import { addFavorite, addFavoriteItem, FavoriteRow } from '../../services/database';
import { generateId as uuidv4 } from '../../utils/uuid';

const DAY_TYPES: DayType[] = ['rest', 'training', 'longrun'];

export default function TodayScreen() {
  const {
    currentDate, day, mealSlots, foodLogs, loading,
    loadDay, setDayType, setWater, addFoodEntry, removeFoodEntry, addCustomMealSlot,
  } = useDayStore();

  const { waterGoalMl, claudeApiKey, initialized, loadSettings } = useSettingsStore();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<MealSlotRow | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSlot, setSavingSlot] = useState<MealSlotRow | null>(null);
  const [favName, setFavName] = useState('');

  useEffect(() => {
    (async () => {
      if (!initialized) await loadSettings();
      await loadDay(todayString());
    })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDay(todayString());
    setRefreshing(false);
  }, []);

  const totals = sumMacros(foodLogs);
  const goals = MACRO_GOALS[(day?.day_type as DayType) || 'rest'];

  const handleDayTypeChange = async (type: DayType) => {
    Haptics.selectionAsync();
    await setDayType(type);
  };

  const handleAddToSlot = (slot: MealSlotRow) => {
    setActiveSlot(slot);
    setAddModalVisible(true);
  };

  const handleAddCustomSlot = () => {
    Alert.prompt(
      'Nieuw maaltijdmoment',
      'Naam van het maaltijdmoment:',
      async (name) => {
        if (name?.trim()) await addCustomMealSlot(name.trim());
      }
    );
  };

  const getAIAdvice = async () => {
    if (!claudeApiKey) {
      setAiError('Stel je Claude API key in via Instellingen.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const advice = await getDayAdvice(claudeApiKey, {
        dayType: (day?.day_type as DayType) || 'rest',
        eaten: {
          kcal: totals.kcal,
          protein_g: totals.protein_g,
          carbs_g: totals.carbs_g,
          fat_g: totals.fat_g,
        },
        timeOfDay: timeStr,
      });
      setAiAdvice(advice);
    } catch (e: any) {
      setAiError(e.message || 'Fout bij laden van advies.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAsFavorite = async (slotItems: typeof foodLogs, favName: string) => {
    const favId = uuidv4();
    const fav: FavoriteRow = { id: favId, name: favName, type: 'meal', created_at: new Date().toISOString() };
    await addFavorite(fav);
    for (const item of slotItems) {
      await addFavoriteItem({
        id: uuidv4(),
        favorite_id: favId,
        product_name: item.product_name,
        amount_g: item.amount_g,
        kcal: item.kcal,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
      });
    }
    Alert.alert('Opgeslagen', `"${favName}" opgeslagen als favoriet.`);
  };

  const getSlotItems = (slotId: string) => foodLogs.filter((f) => f.meal_slot_id === slotId);
  const getSlotTimeHint = (slotName: string) => {
    const templates = MEAL_TEMPLATES[(day?.day_type as DayType) || 'rest'];
    return templates.find((t) => t.slot_name === slotName)?.time_hint;
  };

  const today = new Date();
  const kcalPct = goals.kcal > 0 ? Math.min((totals.kcal / goals.kcal) * 100, 100) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryLight} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dayOfWeek}>{formatDayOfWeek(today)}</Text>
            <Text style={styles.dateText}>{formatDateDutch(today)}</Text>
          </View>
          <View style={styles.waterBadge}>
            <Text style={styles.waterBadgeText}>💧 {day?.water_ml || 0} ml</Text>
          </View>
        </View>

        {/* Hero Macro Card */}
        <LinearGradient
          colors={['#1E1545', '#2a1a60']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Kcal display */}
          <View style={styles.kcalRow}>
            <View style={styles.kcalMain}>
              <Text style={styles.kcalNumber}>{Math.round(totals.kcal)}</Text>
              <Text style={styles.kcalUnit}>/ {goals.kcal} kcal</Text>
            </View>
            <View style={styles.kcalRemaining}>
              <Text style={styles.remainingLabel}>Resterend</Text>
              <Text style={styles.remainingValue}>{Math.max(0, Math.round(goals.kcal - totals.kcal))}</Text>
            </View>
          </View>

          {/* Kcal progress bar */}
          <View style={styles.kcalTrack}>
            <LinearGradient
              colors={kcalPct > 100 ? ['#F87171', '#ef4444'] : ['#6C3FE8', '#A78BFA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.kcalFill, { width: `${kcalPct}%` as any }]}
            />
          </View>

          {/* Macro bars */}
          <View style={styles.macroBars}>
            <MacroBar
              label="Eiwitten"
              eaten={totals.protein_g}
              goal={goals.protein_g}
              unit="g"
              color={COLORS.protein}
              kcalEaten={totals.protein_g * 4}
              kcalGoal={goals.protein_kcal}
            />
            <MacroBar
              label="Koolhydraten"
              eaten={totals.carbs_g}
              goal={goals.carbs_g}
              unit="g"
              color={COLORS.carbs}
              kcalEaten={totals.carbs_g * 4}
              kcalGoal={goals.carbs_kcal}
            />
            <MacroBar
              label="Vetten"
              eaten={totals.fat_g}
              goal={goals.fat_g}
              unit="g"
              color={COLORS.fat}
              kcalEaten={totals.fat_g * 9}
              kcalGoal={goals.fat_kcal}
            />
          </View>
        </LinearGradient>

        {/* Day Type Selector */}
        <View style={styles.dayTypeRow}>
          {DAY_TYPES.map((type) => {
            const isActive = day?.day_type === type;
            return (
              <TouchableOpacity
                key={type}
                style={styles.dayTypeBtn}
                onPress={() => handleDayTypeChange(type)}
                activeOpacity={0.75}
              >
                {isActive ? (
                  <LinearGradient
                    colors={['#6C3FE8', '#8B6BF0']}
                    style={styles.dayTypeBtnInner}
                  >
                    <Text style={styles.dayTypeIcon}>{DAY_TYPE_ICONS[type]}</Text>
                    <Text style={[styles.dayTypeText, styles.activeDayTypeText]}>
                      {DAY_TYPE_LABELS[type]}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.dayTypeBtnInner}>
                    <Text style={styles.dayTypeIcon}>{DAY_TYPE_ICONS[type]}</Text>
                    <Text style={styles.dayTypeText}>{DAY_TYPE_LABELS[type]}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Water Tracker */}
        <WaterTracker
          currentMl={day?.water_ml || 0}
          goalMl={waterGoalMl}
          onAdd={(ml) => {
            const current = day?.water_ml || 0;
            setWater(current + ml);
          }}
          onReset={() => setWater(0)}
        />

        {/* AI Advice */}
        <AIAdviceCard
          title="Dagadvies"
          advice={aiAdvice}
          loading={aiLoading}
          onRefresh={getAIAdvice}
          error={aiError}
        />

        {/* Opslaan als favoriet — inline naam-invoer */}
        {savingSlot && (
          <View style={styles.savePanel}>
            <Text style={styles.savePanelTitle}>⭐ Opslaan als favoriet</Text>
            <Text style={styles.savePanelSub}>Geef een naam aan "{savingSlot.slot_name}"</Text>
            <TextInput
              style={styles.savePanelInput}
              value={favName}
              onChangeText={setFavName}
              placeholder="Naam favoriet..."
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />
            <View style={styles.savePanelBtns}>
              <TouchableOpacity
                style={styles.savePanelCancel}
                onPress={() => { setSavingSlot(null); setFavName(''); }}
              >
                <Text style={styles.savePanelCancelText}>Annuleren</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.savePanelConfirm, !favName.trim() && { opacity: 0.4 }]}
                onPress={async () => {
                  if (!favName.trim()) return;
                  await handleSaveAsFavorite(getSlotItems(savingSlot.id), favName.trim());
                  setSavingSlot(null);
                  setFavName('');
                }}
                disabled={!favName.trim()}
              >
                <Text style={styles.savePanelConfirmText}>Opslaan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Meal Slots */}
        <View style={styles.slotsHeader}>
          <Text style={styles.sectionTitle}>Maaltijden</Text>
          <TouchableOpacity onPress={handleAddCustomSlot} style={styles.addSlotBtn} activeOpacity={0.7}>
            <Text style={styles.addSlotText}>+ Moment</Text>
          </TouchableOpacity>
        </View>

        {mealSlots.map((slot) => (
          <MealSlot
            key={slot.id}
            slot={slot}
            items={getSlotItems(slot.id)}
            onAdd={handleAddToSlot}
            onDelete={removeFoodEntry}
            onSave={(s, items) => { setSavingSlot(s); setFavName(s.slot_name); }}
            timeHint={getSlotTimeHint(slot.slot_name)}
          />
        ))}

        {mealSlots.length === 0 && !loading && (
          <View style={styles.emptySlots}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>Selecteer een dagtype om maaltijden te zien.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Food Modal */}
      {activeSlot && (
        <AddFoodModal
          visible={addModalVisible}
          slotId={activeSlot.id}
          slotName={activeSlot.slot_name}
          dayId={currentDate}
          onAdd={async (entry) => {
            await addFoodEntry(entry);
            setAddModalVisible(false);
            setActiveSlot(null);
          }}
          onClose={() => {
            setAddModalVisible(false);
            setActiveSlot(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dayOfWeek: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  waterBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
  },
  waterBadgeText: {
    fontSize: 13,
    color: COLORS.water,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(108,63,232,0.3)',
    shadowColor: '#6C3FE8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  kcalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  kcalMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  kcalNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.kcal,
    letterSpacing: -2,
    lineHeight: 52,
  },
  kcalUnit: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 6,
  },
  kcalRemaining: {
    alignItems: 'flex-end',
  },
  remainingLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  remainingValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  kcalTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  kcalFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroBars: {
    gap: 2,
  },
  dayTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dayTypeBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  dayTypeBtnInner: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  dayTypeIcon: {
    fontSize: 18,
    marginBottom: 3,
  },
  dayTypeText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeDayTypeText: {
    color: '#fff',
  },
  slotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  addSlotBtn: {
    backgroundColor: 'rgba(108,63,232,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(108,63,232,0.3)',
  },
  addSlotText: {
    fontSize: 13,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  emptySlots: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  savePanel: {
    backgroundColor: 'rgba(255,200,50,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,50,0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  savePanelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  savePanelSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  savePanelInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,50,0.25)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
  },
  savePanelBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  savePanelCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  savePanelCancelText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  savePanelConfirm: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,200,50,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,50,0.4)',
  },
  savePanelConfirmText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '700',
  },
});

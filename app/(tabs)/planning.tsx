import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, DayType, DAY_TYPE_LABELS, DAY_TYPE_ICONS, MACRO_GOALS } from '../../constants/macroGoals';
import { getWeekDays, toDateString, formatDateDutch } from '../../utils/dateHelpers';
import { usePlanStore } from '../../stores/planStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getAllPlanItemsForWeek, PlanSlotRow } from '../../services/database';
import { sumMacros } from '../../utils/macroCalculations';
import AddFoodModal from '../../components/AddFoodModal';
import MacroBar from '../../components/MacroBar';

const DAY_TYPES: DayType[] = ['rest', 'training', 'longrun'];

export default function PlanningScreen() {
  const { startDayOfWeek, initialized, loadSettings } = useSettingsStore();
  const { planSlots, planItems, dayTypes, loadWeek, setDayTypeForDate, ensurePlanSlots, addPlanEntry, removePlanEntry } = usePlanStore();

  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<PlanSlotRow | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingList, setGeneratingList] = useState(false);

  useEffect(() => {
    (async () => {
      if (!initialized) await loadSettings();
      const days = getWeekDays(new Date(), startDayOfWeek);
      setWeekDays(days);
      setSelectedDay(new Date());
      await loadWeek(days.map(toDateString));
    })();
  }, [initialized, startDayOfWeek]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWeek(weekDays.map(toDateString));
    setRefreshing(false);
  }, [weekDays]);

  const selectedDateStr = toDateString(selectedDay);
  const selectedDayType: DayType = (dayTypes[selectedDateStr] as DayType) || 'rest';
  const selectedSlots = planSlots[selectedDateStr] || [];

  const handleSetDayType = async (type: DayType) => {
    await setDayTypeForDate(selectedDateStr, type);
  };

  const handleAddToSlot = (slot: PlanSlotRow) => {
    setActiveSlot(slot);
    setAddModalVisible(true);
  };

  const handleEnsureSlots = async () => {
    await ensurePlanSlots(selectedDateStr, selectedDayType);
    await loadWeek(weekDays.map(toDateString));
  };

  const getSlotItems = (slotId: string) => planItems[slotId] || [];
  const getSlotTotals = (slotId: string) => sumMacros(getSlotItems(slotId));

  const getDayTotals = (dateStr: string) => {
    const slots = planSlots[dateStr] || [];
    const allItems = slots.flatMap((s) => planItems[s.id] || []);
    return sumMacros(allItems);
  };

  const generateShoppingList = async () => {
    setGeneratingList(true);
    const dates = weekDays.map(toDateString);
    const allItems = await getAllPlanItemsForWeek(dates);

    const productMap: Record<string, { name: string; totalG: number }> = {};
    for (const item of allItems) {
      const key = item.product_name.toLowerCase();
      if (productMap[key]) {
        productMap[key].totalG += item.amount_g;
      } else {
        productMap[key] = { name: item.product_name, totalG: item.amount_g };
      }
    }

    const lines = Object.values(productMap)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => `□ ${p.name} – ${Math.round(p.totalG)}g`);

    const weekStr = `${formatDateDutch(weekDays[0])} – ${formatDateDutch(weekDays[6])}`;
    const listText = `🛒 Boodschappenlijst FuelTrack\n${weekStr}\n\n${lines.join('\n')}`;

    setGeneratingList(false);

    if (lines.length === 0) {
      Alert.alert('Geen items', 'Voeg eerst maaltijden toe aan de weekplanning.');
      return;
    }

    Alert.alert(
      'Boodschappenlijst',
      `${lines.length} producten gevonden.`,
      [
        { text: 'Kopiëren', onPress: () => Share.share({ message: listText }) },
        { text: 'Delen', onPress: () => Share.share({ message: listText, title: 'Boodschappenlijst FuelTrack' }) },
        { text: 'Sluiten', style: 'cancel' },
      ]
    );
  };

  const DUTCH_DAYS_SHORT = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryLight} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Weekplanning</Text>
            <Text style={styles.subtitle}>Plan je maaltijden vooruit</Text>
          </View>
          <TouchableOpacity
            onPress={generateShoppingList}
            disabled={generatingList}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6C3FE8', '#8B6BF0']}
              style={styles.shoppingBtn}
            >
              {generatingList ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.shoppingBtnText}>🛒 Boodschappen</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Week day selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScroll}>
          <View style={styles.weekRow}>
            {weekDays.map((day, i) => {
              const dateStr = toDateString(day);
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === toDateString(new Date());
              const dayType: DayType = (dayTypes[dateStr] as DayType) || 'rest';
              const totals = getDayTotals(dateStr);
              const goals = MACRO_GOALS[dayType];
              const pct = goals.kcal > 0 ? totals.kcal / goals.kcal : 0;
              const dotColor = totals.kcal === 0
                ? 'rgba(255,255,255,0.15)'
                : pct >= 0.9 && pct <= 1.1 ? COLORS.success
                : pct < 0.9 ? COLORS.warning : COLORS.danger;

              return (
                <TouchableOpacity
                  key={i}
                  style={styles.dayBtnWrapper}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.75}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={['#6C3FE8', '#8B6BF0']}
                      style={[styles.dayBtn, isToday && styles.todayDayBtn]}
                    >
                      <Text style={[styles.dayBtnDay, { color: 'rgba(255,255,255,0.8)' }]}>
                        {DUTCH_DAYS_SHORT[day.getDay()]}
                      </Text>
                      <Text style={[styles.dayBtnNum, { color: '#fff' }]}>{day.getDate()}</Text>
                      <Text style={styles.dayBtnIcon}>{DAY_TYPE_ICONS[dayType]}</Text>
                      <View style={[styles.dayBtnDot, { backgroundColor: dotColor }]} />
                    </LinearGradient>
                  ) : (
                    <View style={[styles.dayBtn, { backgroundColor: COLORS.card, borderColor: isToday ? COLORS.primaryLight : COLORS.border }]}>
                      <Text style={styles.dayBtnDay}>{DUTCH_DAYS_SHORT[day.getDay()]}</Text>
                      <Text style={styles.dayBtnNum}>{day.getDate()}</Text>
                      <Text style={styles.dayBtnIcon}>{DAY_TYPE_ICONS[dayType]}</Text>
                      <View style={[styles.dayBtnDot, { backgroundColor: dotColor }]} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Selected day details */}
        <View style={styles.card}>
          <Text style={styles.selectedDayTitle}>{formatDateDutch(selectedDay)}</Text>

          {/* Day type selector */}
          <View style={styles.dayTypeRow}>
            {DAY_TYPES.map((type) => {
              const isActive = selectedDayType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={styles.typeBtnWrapper}
                  onPress={() => handleSetDayType(type)}
                  activeOpacity={0.75}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={['rgba(108,63,232,0.35)', 'rgba(139,107,240,0.25)']}
                      style={[styles.typeBtn, styles.activeTypeBtn]}
                    >
                      <Text style={styles.typeBtnIcon}>{DAY_TYPE_ICONS[type]}</Text>
                      <Text style={[styles.typeBtnText, styles.activeTypeBtnText]}>
                        {DAY_TYPE_LABELS[type]}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.typeBtn}>
                      <Text style={styles.typeBtnIcon}>{DAY_TYPE_ICONS[type]}</Text>
                      <Text style={styles.typeBtnText}>{DAY_TYPE_LABELS[type]}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Day macro summary */}
          {(() => {
            const totals = getDayTotals(selectedDateStr);
            const goals = MACRO_GOALS[selectedDayType];
            if (totals.kcal === 0) return null;
            return (
              <View style={styles.macroSection}>
                <MacroBar label="Calorieën" eaten={totals.kcal} goal={goals.kcal} unit=" kcal" color={COLORS.kcal} />
                <MacroBar label="Eiwitten" eaten={totals.protein_g} goal={goals.protein_g} unit="g" color={COLORS.protein} />
              </View>
            );
          })()}
        </View>

        {/* Meal slots */}
        <View style={styles.slotsSection}>
          {selectedSlots.length === 0 ? (
            <TouchableOpacity style={styles.generateSlotsBtn} onPress={handleEnsureSlots} activeOpacity={0.8}>
              <Text style={styles.generateSlotsText}>
                📋 Maaltijdstructuur laden voor {DAY_TYPE_LABELS[selectedDayType]}
              </Text>
            </TouchableOpacity>
          ) : (
            selectedSlots.map((slot) => {
              const slotItems = getSlotItems(slot.id);
              const slotTotals = getSlotTotals(slot.id);

              return (
                <View key={slot.id} style={styles.slotCard}>
                  <View style={styles.slotHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.slotName}>{slot.slot_name}</Text>
                      {slot.target_kcal ? (
                        <Text style={styles.slotTarget}>Doel: {slot.target_kcal} kcal</Text>
                      ) : null}
                    </View>
                    <View style={styles.slotTotals}>
                      {slotItems.length > 0 && (
                        <Text style={[styles.slotKcal, { color: COLORS.kcal }]}>
                          {Math.round(slotTotals.kcal)} kcal
                        </Text>
                      )}
                      <TouchableOpacity style={styles.addToSlotBtn} onPress={() => handleAddToSlot(slot)} activeOpacity={0.8}>
                        <Text style={styles.addToSlotText}>+ Voeg toe</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {slotItems.map((item) => (
                    <View key={item.id} style={styles.planItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.planItemName}>{item.product_name}</Text>
                        <Text style={styles.planItemAmount}>{item.amount_g}g</Text>
                      </View>
                      <View style={styles.planItemMacros}>
                        <Text style={[styles.planMacro, { color: COLORS.kcal }]}>{Math.round(item.kcal || 0)} kcal</Text>
                        <Text style={[styles.planMacro, { color: COLORS.protein }]}>E{Math.round(item.protein_g || 0)}</Text>
                        <Text style={[styles.planMacro, { color: COLORS.carbs }]}>K{Math.round(item.carbs_g || 0)}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removePlanEntry(item.id, slot.id)}
                        style={styles.deleteBtn}
                      >
                        <Text style={styles.deleteText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {activeSlot && (
        <AddFoodModal
          visible={addModalVisible}
          slotId={activeSlot.id}
          slotName={activeSlot.slot_name}
          dayId={selectedDateStr}
          onAdd={async (entry) => {
            await addPlanEntry(activeSlot.id, {
              product_name: entry.product_name,
              amount_g: entry.amount_g,
              kcal: entry.kcal,
              protein_g: entry.protein_g,
              carbs_g: entry.carbs_g,
              fat_g: entry.fat_g,
            });
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
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  shoppingBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    minWidth: 44,
    alignItems: 'center',
  },
  shoppingBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  weekScroll: {
    marginBottom: 12,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 2,
  },
  dayBtnWrapper: {
    width: 54,
  },
  dayBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  todayDayBtn: {
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  dayBtnDay: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayBtnNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  dayBtnIcon: { fontSize: 13, marginBottom: 4 },
  dayBtnDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedDayTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 14,
  },
  dayTypeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  typeBtnWrapper: { flex: 1 },
  typeBtn: {
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTypeBtn: {
    borderColor: COLORS.primaryLight,
  },
  typeBtnIcon: { fontSize: 16, marginBottom: 3 },
  typeBtnText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTypeBtnText: {
    color: COLORS.primaryLight,
  },
  macroSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  slotsSection: {
    gap: 10,
  },
  generateSlotsBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(108,63,232,0.5)',
    borderStyle: 'dashed',
  },
  generateSlotsText: {
    fontSize: 14,
    color: COLORS.primaryLight,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  slotCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  slotName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  slotTarget: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  slotTotals: {
    alignItems: 'flex-end',
    gap: 6,
  },
  slotKcal: {
    fontSize: 13,
    fontWeight: '700',
  },
  addToSlotBtn: {
    backgroundColor: 'rgba(108,63,232,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(108,63,232,0.35)',
  },
  addToSlotText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  planItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  planItemAmount: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  planItemMacros: {
    flexDirection: 'row',
    gap: 6,
    marginRight: 8,
  },
  planMacro: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteBtn: { padding: 6 },
  deleteText: { fontSize: 14, color: COLORS.danger },
});

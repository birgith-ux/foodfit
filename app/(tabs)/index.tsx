import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, DayType, DAY_TYPE_LABELS, DAY_TYPE_ICONS, MACRO_GOALS } from '../../constants/macroGoals';
import { getWeekDays, toDateString } from '../../utils/dateHelpers';
import { getDaysInRange, getFoodLogs, DayRow } from '../../services/database';
import { sumMacros } from '../../utils/macroCalculations';
import { useSettingsStore } from '../../stores/settingsStore';
import MacroBar from '../../components/MacroBar';
import AIAdviceCard from '../../components/AIAdviceCard';
import { getWeekAdvice } from '../../services/claudeAPI';

interface DayStats {
  date: Date;
  dateStr: string;
  dayType: DayType;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
  goalKcal: number;
}

export default function DashboardScreen() {
  const { startDayOfWeek, claudeApiKey, initialized, loadSettings, waterGoalMl } = useSettingsStore();

  const [weekStats, setWeekStats] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const loadWeekData = useCallback(async () => {
    const weekDays = getWeekDays(new Date(), startDayOfWeek);
    const fromStr = toDateString(weekDays[0]);
    const toStr = toDateString(weekDays[6]);

    const dayRows = await getDaysInRange(fromStr, toStr);
    const dayMap: Record<string, DayRow> = {};
    dayRows.forEach((d) => (dayMap[d.id] = d));

    const stats: DayStats[] = [];
    for (const date of weekDays) {
      const dateStr = toDateString(date);
      const dayRow = dayMap[dateStr];
      const dayType: DayType = (dayRow?.day_type as DayType) || 'rest';
      const goals = MACRO_GOALS[dayType];

      let totals = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
      if (dayRow) {
        const logs = await getFoodLogs(dateStr);
        totals = sumMacros(logs);
      }

      stats.push({
        date,
        dateStr,
        dayType,
        kcal: totals.kcal,
        protein_g: totals.protein_g,
        carbs_g: totals.carbs_g,
        fat_g: totals.fat_g,
        water_ml: dayRow?.water_ml || 0,
        goalKcal: goals.kcal,
      });
    }
    setWeekStats(stats);
  }, [startDayOfWeek]);

  useEffect(() => {
    (async () => {
      if (!initialized) await loadSettings();
      setLoading(true);
      await loadWeekData();
      setLoading(false);
    })();
  }, [initialized]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWeekData();
    setRefreshing(false);
  }, [loadWeekData]);

  const getWeekAI = async () => {
    if (!claudeApiKey) {
      setAiError('Stel je Claude API key in via Instellingen.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const advice = await getWeekAdvice(claudeApiKey, {
        weekData: weekStats.map((d) => ({
          date: d.dateStr,
          dayType: d.dayType,
          eaten: { kcal: d.kcal, protein_g: d.protein_g, carbs_g: d.carbs_g, fat_g: d.fat_g },
          goalMet: d.goalKcal > 0 && d.kcal >= d.goalKcal * 0.9 && d.kcal <= d.goalKcal * 1.1,
        })),
      });
      setAiAdvice(advice);
    } catch (e: any) {
      setAiError(e.message || 'Fout bij laden van advies.');
    } finally {
      setAiLoading(false);
    }
  };

  // Averages
  const daysWithData = weekStats.filter((d) => d.kcal > 0);
  const avgKcal = daysWithData.length > 0 ? daysWithData.reduce((s, d) => s + d.kcal, 0) / daysWithData.length : 0;
  const avgProtein = daysWithData.length > 0 ? daysWithData.reduce((s, d) => s + d.protein_g, 0) / daysWithData.length : 0;
  const avgCarbs = daysWithData.length > 0 ? daysWithData.reduce((s, d) => s + d.carbs_g, 0) / daysWithData.length : 0;
  const avgFat = daysWithData.length > 0 ? daysWithData.reduce((s, d) => s + d.fat_g, 0) / daysWithData.length : 0;
  const avgWater = daysWithData.length > 0 ? daysWithData.reduce((s, d) => s + d.water_ml, 0) / daysWithData.length : 0;

  function getDayStatusColor(stat: DayStats): string {
    if (stat.kcal === 0) return 'rgba(255,255,255,0.06)';
    const pct = stat.kcal / stat.goalKcal;
    if (pct >= 0.9 && pct <= 1.1) return 'rgba(52,211,153,0.18)';
    if (pct < 0.9) return 'rgba(251,146,60,0.18)';
    return 'rgba(248,113,113,0.18)';
  }

  function getDayDotColor(stat: DayStats): string {
    if (stat.kcal === 0) return 'rgba(255,255,255,0.15)';
    const pct = stat.kcal / stat.goalKcal;
    if (pct >= 0.9 && pct <= 1.1) return COLORS.success;
    if (pct < 0.9) return COLORS.warning;
    return COLORS.danger;
  }

  const DUTCH_DAYS_SHORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
  const DUTCH_DAYS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

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
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Weekoverzicht</Text>
          </View>
        </View>

        {/* Week Calendar Strip */}
        <View style={styles.weekCard}>
          <View style={styles.weekGrid}>
            {weekStats.map((stat, i) => {
              const isToday = toDateString(stat.date) === toDateString(new Date());
              return (
                <View
                  key={i}
                  style={[
                    styles.dayCell,
                    { backgroundColor: getDayStatusColor(stat) },
                    isToday && styles.todayCell,
                  ]}
                >
                  <Text style={[styles.dayCellDay, isToday && styles.todayCellDay]}>
                    {DUTCH_DAYS_SHORT[stat.date.getDay()]}
                  </Text>
                  <Text style={[styles.dayCellNum, isToday && styles.todayCellNum]}>
                    {stat.date.getDate()}
                  </Text>
                  <Text style={styles.dayCellIcon}>{DAY_TYPE_ICONS[stat.dayType]}</Text>
                  <View style={[styles.dayCellDot, { backgroundColor: getDayDotColor(stat) }]} />
                  {stat.kcal > 0 && (
                    <Text style={[styles.dayCellKcal, { color: getDayDotColor(stat) }]}>
                      {Math.round(stat.kcal)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.legendText}>Op doel</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.legendText}>Onder doel</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
              <Text style={styles.legendText}>Boven doel</Text>
            </View>
          </View>
        </View>

        {/* Week Averages */}
        <LinearGradient
          colors={['#1E1545', '#2a1a60']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avgCard}
        >
          <Text style={styles.cardTitle}>Weekgemiddelden  ·  {daysWithData.length} dagen</Text>

          <View style={styles.avgGrid}>
            <View style={styles.avgItem}>
              <Text style={[styles.avgValue, { color: COLORS.kcal }]}>{Math.round(avgKcal)}</Text>
              <Text style={styles.avgLabel}>kcal/dag</Text>
            </View>
            <View style={styles.avgDivider} />
            <View style={styles.avgItem}>
              <Text style={[styles.avgValue, { color: COLORS.protein }]}>{Math.round(avgProtein)}g</Text>
              <Text style={styles.avgLabel}>Eiwitten</Text>
            </View>
            <View style={styles.avgDivider} />
            <View style={styles.avgItem}>
              <Text style={[styles.avgValue, { color: COLORS.carbs }]}>{Math.round(avgCarbs)}g</Text>
              <Text style={styles.avgLabel}>Koolhydr.</Text>
            </View>
            <View style={styles.avgDivider} />
            <View style={styles.avgItem}>
              <Text style={[styles.avgValue, { color: COLORS.fat }]}>{Math.round(avgFat)}g</Text>
              <Text style={styles.avgLabel}>Vetten</Text>
            </View>
          </View>

          <View style={styles.waterAvgRow}>
            <Text style={styles.waterAvgLabel}>💧 Gem. waterinname</Text>
            <View style={styles.waterAvgRight}>
              <Text style={[styles.waterAvgValue, { color: avgWater >= waterGoalMl ? COLORS.success : COLORS.warning }]}>
                {Math.round(avgWater)} ml
              </Text>
              <Text style={styles.waterAvgGoal}>/ {waterGoalMl} ml</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Per-day detail */}
        <Text style={styles.sectionTitle}>Dagdetails</Text>
        {weekStats.map((stat, i) => {
          const goals = MACRO_GOALS[stat.dayType];
          const isToday = toDateString(stat.date) === toDateString(new Date());

          if (stat.kcal === 0) return null;

          return (
            <View key={i} style={[styles.dayDetailCard, isToday && styles.todayDetailCard]}>
              <View style={styles.dayDetailHeader}>
                <Text style={styles.dayDetailDay}>
                  {isToday ? '📍 Vandaag' : DUTCH_DAYS[stat.date.getDay()]}
                </Text>
                <Text style={styles.dayDetailDate}>{stat.date.getDate()} {MONTHS[stat.date.getMonth()]}</Text>
                <Text style={styles.dayDetailType}>{DAY_TYPE_ICONS[stat.dayType]} {DAY_TYPE_LABELS[stat.dayType]}</Text>
              </View>
              <MacroBar label="Calorieën" eaten={stat.kcal} goal={goals.kcal} unit=" kcal" color={COLORS.kcal} />
              <MacroBar label="Eiwitten" eaten={stat.protein_g} goal={goals.protein_g} unit="g" color={COLORS.protein} />
            </View>
          );
        })}

        {daysWithData.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>Begin met loggen in het Vandaag-tabblad om hier je statistieken te zien.</Text>
          </View>
        )}

        {/* AI Week Advice */}
        <AIAdviceCard
          title="Weekadvies"
          advice={aiAdvice}
          loading={aiLoading}
          onRefresh={getWeekAI}
          error={aiError}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: { flex: 1 },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  header: {
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
  weekCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  dayCellDay: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  todayCellDay: {
    color: COLORS.primaryLight,
  },
  dayCellNum: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  todayCellNum: {
    color: COLORS.primaryLight,
  },
  dayCellIcon: {
    fontSize: 12,
    marginBottom: 4,
  },
  dayCellDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginBottom: 3,
  },
  dayCellKcal: {
    fontSize: 9,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  avgCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(108,63,232,0.25)',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  avgGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  avgItem: {
    alignItems: 'center',
  },
  avgDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  avgValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  avgLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  waterAvgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  waterAvgLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  waterAvgRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  waterAvgValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  waterAvgGoal: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  dayDetailCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  todayDetailCard: {
    borderColor: COLORS.primaryLight,
    borderWidth: 1.5,
  },
  dayDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  dayDetailDay: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  dayDetailDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  dayDetailType: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 8,
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
});

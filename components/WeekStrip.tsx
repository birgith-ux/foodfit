import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, DAY_TYPE_ICONS, DayType, MACRO_GOALS } from '../constants/macroGoals';
import { formatShortDay, isSameDay, toDateString } from '../utils/dateHelpers';

interface DayData {
  date: Date;
  dayType: DayType;
  eatenKcal: number;
  goalKcal: number;
}

interface WeekStripProps {
  days: DayData[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

function getDayColor(eaten: number, goal: number): string {
  if (goal === 0) return COLORS.border;
  if (eaten === 0) return COLORS.border;
  const pct = eaten / goal;
  if (pct >= 0.9 && pct <= 1.1) return COLORS.success;
  if (pct < 0.9) return COLORS.warning;
  return COLORS.danger;
}

export default function WeekStrip({ days, selectedDate, onSelectDate }: WeekStripProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <View style={styles.container}>
        {days.map((d, i) => {
          const isSelected = isSameDay(d.date, selectedDate);
          const isToday = isSameDay(d.date, new Date());
          const dotColor = getDayColor(d.eatenKcal, d.goalKcal);

          return (
            <TouchableOpacity
              key={i}
              style={[styles.dayCard, isSelected && styles.selectedCard]}
              onPress={() => onSelectDate(d.date)}
            >
              <Text style={[styles.dayLabel, isSelected && styles.selectedText]}>
                {formatShortDay(d.date)}
              </Text>
              <Text style={styles.dayNum}>{d.date.getDate()}</Text>
              <Text style={styles.typeIcon}>{DAY_TYPE_ICONS[d.dayType]}</Text>
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
              {isToday && <View style={styles.todayDot} />}
              {d.eatenKcal > 0 && (
                <Text style={[styles.kcalText, { color: dotColor }]}>
                  {Math.round(d.eatenKcal)}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: 4,
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    gap: 6,
  },
  dayCard: {
    width: 52,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedText: {
    color: '#fff',
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  typeIcon: {
    fontSize: 14,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  todayDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryLight,
  },
  kcalText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});

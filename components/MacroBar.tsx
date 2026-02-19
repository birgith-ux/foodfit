import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/macroGoals';

interface MacroBarProps {
  label: string;
  eaten: number;
  goal: number;
  unit: string;
  color: string;
  kcalEaten?: number;
  kcalGoal?: number;
}

const LIGHTEN: Record<string, string> = {
  '#F87171': '#FCA5A5',
  '#FB923C': '#FCD34D',
  '#60A5FA': '#93C5FD',
  '#A78BFA': '#C4B5FD',
  '#34D399': '#6EE7B7',
  '#6C3FE8': '#A78BFA',
};

export default function MacroBar({
  label, eaten, goal, unit, color, kcalEaten, kcalGoal,
}: MacroBarProps) {
  const pct = goal > 0 ? Math.min((eaten / goal) * 100, 120) : 0;
  const cappedPct = Math.min(pct, 100);
  const activeColor = pct > 105 ? COLORS.danger : pct > 90 ? COLORS.warning : color;
  const gradEnd = pct > 105 ? '#FCA5A5' : pct > 90 ? '#FCD34D' : (LIGHTEN[color] ?? color);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.eaten, { color: activeColor }]}>
            {Math.round(eaten)}{unit}
          </Text>
          <Text style={styles.separator}> / </Text>
          <Text style={styles.goal}>{goal}{unit}</Text>
        </View>
      </View>
      {kcalEaten !== undefined && kcalGoal !== undefined && (
        <Text style={styles.kcalText}>
          {Math.round(kcalEaten)} kcal / {kcalGoal} kcal
        </Text>
      )}
      <View style={styles.track}>
        {cappedPct > 0 && (
          <LinearGradient
            colors={[activeColor, gradEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { width: `${cappedPct}%` as any }]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 13,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eaten: {
    fontSize: 13,
    fontWeight: '700',
  },
  separator: {
    fontSize: 13,
    color: COLORS.textMuted,
    opacity: 0.5,
  },
  goal: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  kcalText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
    opacity: 0.6,
  },
  track: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});

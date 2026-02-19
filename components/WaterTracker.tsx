import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/macroGoals';

interface WaterTrackerProps {
  currentMl: number;
  goalMl: number;
  onAdd: (ml: number) => void;
  onReset: () => void;
}

const GLASS_ML = 250;

export default function WaterTracker({ currentMl, goalMl, onAdd, onReset }: WaterTrackerProps) {
  const totalGlasses = Math.ceil(goalMl / GLASS_ML);
  const filledGlasses = Math.min(Math.floor(currentMl / GLASS_ML), totalGlasses);
  const pct = Math.min((currentMl / goalMl) * 100, 100);

  const handleGlassPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd(GLASS_ML);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>💧</Text>
          <Text style={styles.title}>Water</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.current}>{currentMl}</Text>
          <Text style={styles.goal}> / {goalMl} ml</Text>
        </View>
        <TouchableOpacity onPress={onReset} style={styles.resetBtn}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.glasses}>
        {Array.from({ length: totalGlasses }).map((_, i) => {
          const filled = i < filledGlasses;
          return (
            <TouchableOpacity key={i} onPress={handleGlassPress} activeOpacity={0.7}>
              {filled ? (
                <LinearGradient
                  colors={['#34D399', '#6EE7B7']}
                  style={styles.glass}
                >
                  <Text style={styles.glassEmoji}>💧</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.glass, styles.glassEmpty]}>
                  <Text style={styles.glassEmojiEmpty}>○</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.track}>
        <LinearGradient
          colors={['#34D399', '#6EE7B7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${pct}%` as any }]}
        />
      </View>
      <Text style={styles.pctText}>{Math.round(pct)}% van dagdoel</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  icon: { fontSize: 18 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 12,
  },
  current: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.water,
  },
  goal: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  resetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resetText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  glasses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  glass: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassEmpty: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glassEmoji: { fontSize: 18 },
  glassEmojiEmpty: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.2)',
  },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  pctText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
});

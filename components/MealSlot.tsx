import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/macroGoals';
import { MealSlotRow, FoodLogRow } from '../services/database';
import FoodLogItem from './FoodLogItem';
import { sumMacros } from '../utils/macroCalculations';

interface MealSlotProps {
  slot: MealSlotRow;
  items: FoodLogRow[];
  onAdd: (slot: MealSlotRow) => void;
  onDelete: (id: string) => void;
  timeHint?: string;
}

export default function MealSlot({ slot, items, onAdd, onDelete, timeHint }: MealSlotProps) {
  const [expanded, setExpanded] = useState(true);
  const totals = sumMacros(items);
  const hasTarget = !!slot.target_kcal;
  const targetPct = hasTarget ? Math.min((totals.kcal / slot.target_kcal!) * 100, 110) : 0;
  const targetColor = targetPct > 105 ? COLORS.danger : targetPct > 90 ? COLORS.warning : COLORS.primary;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <Text style={styles.slotName}>{slot.slot_name}</Text>
          {timeHint && <Text style={styles.timeHint}>{timeHint}</Text>}
        </View>
        <View style={styles.headerRight}>
          {items.length > 0 && (
            <View style={styles.kcalBadge}>
              <Text style={[styles.kcalBadgeText, { color: COLORS.kcal }]}>
                {Math.round(totals.kcal)}
              </Text>
              {hasTarget && (
                <Text style={styles.targetText}> / {slot.target_kcal} kcal</Text>
              )}
            </View>
          )}
          {hasTarget && items.length === 0 && (
            <Text style={styles.targetHint}>doel {slot.target_kcal} kcal</Text>
          )}
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {/* Macro summary row */}
          {items.length > 0 && (
            <View style={styles.macroRow}>
              <Text style={[styles.macroItem, { color: COLORS.protein }]}>E {Math.round(totals.protein_g)}g</Text>
              <Text style={[styles.macroItem, { color: COLORS.carbs }]}>K {Math.round(totals.carbs_g)}g</Text>
              <Text style={[styles.macroItem, { color: COLORS.fat }]}>V {Math.round(totals.fat_g)}g</Text>
              {hasTarget && (
                <View style={styles.targetBar}>
                  <View style={[styles.targetFill, { width: `${Math.min(targetPct, 100)}%` as any, backgroundColor: targetColor }]} />
                </View>
              )}
            </View>
          )}

          {items.map((item) => (
            <FoodLogItem key={item.id} item={item} onDelete={onDelete} />
          ))}

          {/* Add button */}
          <TouchableOpacity style={styles.addBtn} onPress={() => onAdd(slot)} activeOpacity={0.7}>
            <LinearGradient
              colors={['rgba(108,63,232,0.15)', 'rgba(108,63,232,0.08)']}
              style={styles.addBtnGrad}
            >
              <Text style={styles.addText}>＋  Voeg toe</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 14,
  },
  headerLeft: { flex: 1 },
  slotName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  timeHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kcalBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  kcalBadgeText: {
    fontSize: 15,
    fontWeight: '800',
  },
  targetText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  targetHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  chevron: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  macroItem: {
    fontSize: 12,
    fontWeight: '600',
  },
  targetBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  targetFill: {
    height: '100%',
    borderRadius: 2,
  },
  addBtn: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(108,63,232,0.3)',
    borderStyle: 'dashed',
  },
  addBtnGrad: {
    paddingVertical: 11,
    alignItems: 'center',
  },
  addText: {
    fontSize: 14,
    color: COLORS.primaryLight,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

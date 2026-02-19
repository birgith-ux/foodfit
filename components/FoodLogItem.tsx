import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../constants/macroGoals';
import { FoodLogRow } from '../services/database';

interface FoodLogItemProps {
  item: FoodLogRow;
  onDelete: (id: string) => void;
}

export default function FoodLogItem({ item, onDelete }: FoodLogItemProps) {
  const handleDelete = () => {
    Alert.alert(
      'Verwijderen',
      `"${item.product_name}" verwijderen?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        { text: 'Verwijder', style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.product_name}</Text>
        <Text style={styles.amount}>{item.amount_g}g</Text>
      </View>
      <View style={styles.macros}>
        <MacroChip value={Math.round(item.kcal || 0)} label="kcal" color={COLORS.kcal} />
        <MacroChip value={Math.round(item.protein_g || 0)} label="E" color={COLORS.protein} />
        <MacroChip value={Math.round(item.carbs_g || 0)} label="K" color={COLORS.carbs} />
        <MacroChip value={Math.round(item.fat_g || 0)} label="V" color={COLORS.fat} />
      </View>
      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function MacroChip({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={[styles.chip, { borderColor: color + '33' }]}>
      <Text style={[styles.chipText, { color }]}>{label} {value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  amount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  macros: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 6,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 13,
    color: COLORS.danger,
    opacity: 0.7,
  },
});

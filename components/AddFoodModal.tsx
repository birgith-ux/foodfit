import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/macroGoals';
import { NutritionData, searchByName } from '../services/openFoodFacts';
import { scaleNutrition } from '../utils/macroCalculations';
import BarcodeScanner from './BarcodeScanner';
import { getFavorites, getFavoriteItems, FavoriteRow } from '../services/database';

interface AddFoodModalProps {
  visible: boolean;
  slotId: string | null;
  slotName: string;
  dayId: string;
  onAdd: (entry: {
    day_id: string;
    meal_slot_id: string | null;
    product_name: string;
    barcode?: string | null;
    amount_g: number;
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    source: string;
  }) => void;
  onClose: () => void;
}

type Tab = 'search' | 'barcode' | 'manual' | 'favorites';

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'search', icon: '🔍', label: 'Zoeken' },
  { key: 'barcode', icon: '📷', label: 'Barcode' },
  { key: 'manual', icon: '✏️', label: 'Handmatig' },
  { key: 'favorites', icon: '⭐', label: 'Favorieten' },
];

export default function AddFoodModal({
  visible, slotId, slotName, dayId, onAdd, onClose,
}: AddFoodModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NutritionData[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<NutritionData | null>(null);
  const [amount, setAmount] = useState('100');

  const [manualName, setManualName] = useState('');
  const [manualKcal, setManualKcal] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualAmount, setManualAmount] = useState('100');

  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  const loadFavorites = useCallback(async () => {
    setLoadingFavs(true);
    setFavorites(await getFavorites());
    setLoadingFavs(false);
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'favorites') loadFavorites();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults(await searchByName(searchQuery.trim()));
    setSearching(false);
  };

  const handleAddFromSearch = () => {
    if (!selected) return;
    const amtG = parseFloat(amount);
    if (isNaN(amtG) || amtG <= 0) {
      Alert.alert('Ongeldige hoeveelheid', 'Voer een geldig aantal grammen in.');
      return;
    }
    const scaled = scaleNutrition(
      { kcal: selected.kcal_100g, protein: selected.protein_100g, carbs: selected.carbs_100g, fat: selected.fat_100g },
      amtG
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({
      day_id: dayId, meal_slot_id: slotId, product_name: selected.name,
      barcode: selected.barcode, amount_g: amtG,
      kcal: scaled.kcal, protein_g: scaled.protein_g, carbs_g: scaled.carbs_g, fat_g: scaled.fat_g,
      source: 'openfoodfacts',
    });
    resetAndClose();
  };

  const handleAddManual = () => {
    const amtG = parseFloat(manualAmount);
    const kcal = parseFloat(manualKcal);
    if (!manualName.trim() || isNaN(amtG) || isNaN(kcal)) {
      Alert.alert('Onvolledige invoer', 'Vul minimaal naam, grammen en calorieën in.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({
      day_id: dayId, meal_slot_id: slotId, product_name: manualName.trim(),
      amount_g: amtG, kcal, protein_g: parseFloat(manualProtein) || 0,
      carbs_g: parseFloat(manualCarbs) || 0, fat_g: parseFloat(manualFat) || 0,
      source: 'manual',
    });
    resetAndClose();
  };

  const handleAddFavorite = async (fav: FavoriteRow) => {
    const items = await getFavoriteItems(fav.id);
    for (const item of items) {
      onAdd({
        day_id: dayId, meal_slot_id: slotId, product_name: item.product_name,
        amount_g: item.amount_g, kcal: item.kcal || 0,
        protein_g: item.protein_g || 0, carbs_g: item.carbs_g || 0, fat_g: item.fat_g || 0,
        source: 'favorite',
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetAndClose();
  };

  const resetAndClose = () => {
    setSearchQuery(''); setSearchResults([]); setSelected(null); setAmount('100');
    setManualName(''); setManualKcal(''); setManualProtein('');
    setManualCarbs(''); setManualFat(''); setManualAmount('100');
    setActiveTab('search');
    onClose();
  };

  if (activeTab === 'barcode' && visible) {
    return (
      <Modal visible={visible} animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, width: '100%', height: '100%' }}>
          <BarcodeScanner
            onFound={(data) => { setSelected(data); setActiveTab('search'); }}
            onCancel={() => setActiveTab('search')}
          />
        </View>
      </Modal>
    );
  }

  const amtG = parseFloat(amount);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handleBar} />
          <Text style={styles.title}>Toevoegen aan</Text>
          <Text style={styles.slotLabel}>{slotName}</Text>
          <TouchableOpacity onPress={resetAndClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => handleTabChange(tab.key)}
              activeOpacity={0.8}
            >
              {activeTab === tab.key ? (
                <LinearGradient colors={['#6C3FE8', '#8B6BF0']} style={styles.activeTab}>
                  <Text style={styles.tabIcon}>{tab.icon}</Text>
                  <Text style={styles.activeTabLabel}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.inactiveTab}>
                  <Text style={styles.tabIcon}>{tab.icon}</Text>
                  <Text style={styles.inactiveTabLabel}>{tab.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

          {/* ── SEARCH TAB ─────────────────────────── */}
          {activeTab === 'search' && (
            <View>
              {selected ? (
                <View style={styles.selectedCard}>
                  <Text style={styles.selectedName}>{selected.name}</Text>
                  {selected.brand && <Text style={styles.selectedBrand}>{selected.brand}</Text>}
                  <View style={styles.macroChips}>
                    <MacroChip label="🔥" value={selected.kcal_100g} unit="kcal/100g" color={COLORS.kcal} />
                    <MacroChip label="E" value={selected.protein_100g} unit="g" color={COLORS.protein} />
                    <MacroChip label="K" value={selected.carbs_100g} unit="g" color={COLORS.carbs} />
                    <MacroChip label="V" value={selected.fat_100g} unit="g" color={COLORS.fat} />
                  </View>

                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Hoeveelheid (g)</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                  </View>

                  {!isNaN(amtG) && amtG > 0 && (
                    <View style={styles.calcRow}>
                      <CalcChip label="🔥" value={Math.round(selected.kcal_100g * amtG / 100)} unit="kcal" color={COLORS.kcal} />
                      <CalcChip label="E" value={Math.round(selected.protein_100g * amtG / 100)} unit="g" color={COLORS.protein} />
                      <CalcChip label="K" value={Math.round(selected.carbs_100g * amtG / 100)} unit="g" color={COLORS.carbs} />
                      <CalcChip label="V" value={Math.round(selected.fat_100g * amtG / 100)} unit="g" color={COLORS.fat} />
                    </View>
                  )}

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)}>
                      <Text style={styles.backText}>← Terug</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddFromSearch} activeOpacity={0.85}>
                      <LinearGradient colors={['#6C3FE8', '#8B6BF0']} style={styles.addBtnGrad}>
                        <Text style={styles.addText}>＋  Toevoegen</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.searchRow}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Zoek product..."
                      placeholderTextColor={COLORS.textMuted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      onSubmitEditing={handleSearch}
                      returnKeyType="search"
                    />
                    <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.85}>
                      <LinearGradient colors={['#6C3FE8', '#8B6BF0']} style={styles.searchBtnGrad}>
                        {searching
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={styles.searchBtnText}>Zoek</Text>}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {searchResults.map((r, i) => (
                    <TouchableOpacity key={i} style={styles.resultItem} onPress={() => setSelected(r)} activeOpacity={0.8}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultName} numberOfLines={1}>{r.name}</Text>
                        {r.brand && <Text style={styles.resultBrand}>{r.brand}</Text>}
                      </View>
                      <Text style={[styles.resultKcal, { color: COLORS.kcal }]}>{r.kcal_100g} kcal</Text>
                    </TouchableOpacity>
                  ))}

                  {searching && (
                    <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.primary} />
                  )}
                </View>
              )}
            </View>
          )}

          {/* ── MANUAL TAB ─────────────────────────── */}
          {activeTab === 'manual' && (
            <View style={styles.manualForm}>
              <FieldInput label="Productnaam *" value={manualName} onChange={setManualName} placeholder="bijv. Rijst gekookt" />
              <FieldInput label="Hoeveelheid (g) *" value={manualAmount} onChange={setManualAmount} numeric />
              <FieldInput label="Calorieën (kcal) *" value={manualKcal} onChange={setManualKcal} numeric />
              <FieldInput label="Eiwitten (g)" value={manualProtein} onChange={setManualProtein} numeric />
              <FieldInput label="Koolhydraten (g)" value={manualCarbs} onChange={setManualCarbs} numeric />
              <FieldInput label="Vetten (g)" value={manualFat} onChange={setManualFat} numeric />

              <TouchableOpacity style={styles.addBtn} onPress={handleAddManual} activeOpacity={0.85}>
                <LinearGradient colors={['#6C3FE8', '#8B6BF0']} style={[styles.addBtnGrad, { paddingVertical: 14 }]}>
                  <Text style={styles.addText}>＋  Toevoegen</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── FAVORITES TAB ──────────────────────── */}
          {activeTab === 'favorites' && (
            <View>
              {loadingFavs ? (
                <ActivityIndicator style={{ marginTop: 32 }} color={COLORS.primary} />
              ) : favorites.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>⭐</Text>
                  <Text style={styles.emptyText}>Nog geen favorieten opgeslagen.</Text>
                  <Text style={styles.emptyHint}>Sla maaltijden op vanuit je daglog.</Text>
                </View>
              ) : (
                favorites.map((fav) => (
                  <TouchableOpacity key={fav.id} style={styles.favItem} onPress={() => handleAddFavorite(fav)} activeOpacity={0.8}>
                    <Text style={styles.favIcon}>{fav.type === 'meal' ? '🍽️' : '🥗'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.favName}>{fav.name}</Text>
                      <Text style={styles.favType}>{fav.type === 'meal' ? 'Maaltijd' : 'Product'}</Text>
                    </View>
                    <LinearGradient colors={['#6C3FE8', '#8B6BF0']} style={styles.favAddBtn}>
                      <Text style={styles.favAddText}>＋</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MacroChip({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={[mStyles.chip, { borderColor: color + '40' }]}>
      <Text style={[mStyles.chipLabel, { color }]}>{label}</Text>
      <Text style={mStyles.chipValue}>{value}{unit}</Text>
    </View>
  );
}

function CalcChip({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={[mStyles.calcChip, { backgroundColor: color + '18', borderColor: color + '30' }]}>
      <Text style={[mStyles.calcLabel, { color }]}>{label} {value}{unit}</Text>
    </View>
  );
}

function FieldInput({ label, value, onChange, placeholder, numeric }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean;
}) {
  return (
    <View style={mStyles.field}>
      <Text style={mStyles.fieldLabel}>{label}</Text>
      <TextInput
        style={mStyles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={numeric ? 'numeric' : 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginBottom: 14,
  },
  title: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  slotLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 24,
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  tabs: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.card,
    gap: 6,
  },
  tab: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeTab: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  inactiveTab: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  tabIcon: { fontSize: 16, marginBottom: 2 },
  activeTabLabel: { fontSize: 10, color: '#fff', fontWeight: '700' },
  inactiveTabLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  content: {
    flex: 1,
    padding: 16,
  },
  selectedCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  selectedBrand: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  macroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    flex: 1,
  },
  amountInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    textAlign: 'center',
    fontWeight: '800',
    color: COLORS.text,
    width: 100,
  },
  calcRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  addBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  addBtnGrad: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  addText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  searchBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  searchBtnGrad: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    maxWidth: 220,
  },
  resultBrand: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  resultKcal: {
    fontSize: 13,
    fontWeight: '700',
  },
  manualForm: {
    gap: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  favItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  favIcon: { fontSize: 24 },
  favName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  favType: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  favAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favAddText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

const mStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipLabel: { fontSize: 11, fontWeight: '700' },
  chipValue: { fontSize: 11, color: COLORS.textMuted },
  calcChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  calcLabel: { fontSize: 13, fontWeight: '700' },
  field: { marginBottom: 6 },
  fieldLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 5,
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  fieldInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
});

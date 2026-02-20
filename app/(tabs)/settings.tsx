import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Switch, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, DAY_TYPE_LABELS, DayType } from '../../constants/macroGoals';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  getFavorites, deleteFavorite, renameFavorite, FavoriteRow,
  addFavorite, addFavoriteItem,
  getDaysInRange, getFoodLogs,
} from '../../services/database';
import { generateId as uuidv4 } from '../../utils/uuid';

const DEFAULT_FAVORITES = [
  {
    name: 'Halve banaan',
    type: 'product',
    items: [{ product_name: 'Halve banaan', amount_g: 60, kcal: 106, protein_g: 1.4, carbs_g: 27.4, fat_g: 0.4 }],
  },
  {
    name: 'Banaan',
    type: 'product',
    items: [{ product_name: 'Banaan', amount_g: 120, kcal: 53, protein_g: 0.7, carbs_g: 13.7, fat_g: 0.2 }],
  },
  {
    name: 'Organe Fit Choco Protein (26g)',
    type: 'product',
    items: [{ product_name: 'Organe Fit Choco Protein Powder', amount_g: 26, kcal: 100, protein_g: 20.2, carbs_g: 0.7, fat_g: 2.0 }],
  },
  {
    name: 'Organe Fit Vanille Protein (26g)',
    type: 'product',
    items: [{ product_name: 'Organe Fit Vanille Protein Powder', amount_g: 26, kcal: 99, protein_g: 21.0, carbs_g: 1.1, fat_g: 1.8 }],
  },
  {
    name: 'Organe Fit Coffee Protein (26g)',
    type: 'product',
    items: [{ product_name: 'Organe Fit Coffee Protein Powder', amount_g: 26, kcal: 101, protein_g: 20.0, carbs_g: 1.7, fat_g: 1.8 }],
  },
  {
    name: 'GVrije havermout, zaden, sprout melk, kaneel & appel',
    type: 'meal',
    items: [{ product_name: 'Glutenvrije havermout met zaden, sprout melk, kaneel & appel', amount_g: 1, kcal: 331, protein_g: 11.4, carbs_g: 38.9, fat_g: 12.8 }],
  },
  {
    name: 'GVrije havermout, zaden, sprout melk & blauwe bessen',
    type: 'meal',
    items: [{ product_name: 'Glutenvrije havermout met zaden, sprout melk & blauwe bessen', amount_g: 1, kcal: 335, protein_g: 12.1, carbs_g: 39.3, fat_g: 12.7 }],
  },
  {
    name: 'Bananenbrood (1 plak)',
    type: 'product',
    items: [{ product_name: 'Bananenbrood', amount_g: 1, kcal: 160, protein_g: 5.6, carbs_g: 29.9, fat_g: 4.0 }],
  },
  {
    name: 'Sprout melk (240ml)',
    type: 'product',
    items: [{ product_name: 'Sprout melk', amount_g: 240, kcal: 151, protein_g: 7.4, carbs_g: 15.6, fat_g: 8.2 }],
  },
  {
    name: 'Avocado (klein)',
    type: 'product',
    items: [{ product_name: 'Avocado klein', amount_g: 1, kcal: 241, protein_g: 1.9, carbs_g: 1.1, fat_g: 13.6 }],
  },
  {
    name: 'Avocado (groot)',
    type: 'product',
    items: [{ product_name: 'Avocado groot', amount_g: 1, kcal: 282, protein_g: 3.9, carbs_g: 2.3, fat_g: 27.2 }],
  },
  {
    name: 'Dadel',
    type: 'product',
    items: [{ product_name: 'Dadel', amount_g: 1, kcal: 42, protein_g: 0.3, carbs_g: 9.7, fat_g: 0.0 }],
  },
  // Basisproducten
  {
    name: 'Ei (groot)',
    type: 'product',
    items: [{ product_name: 'Ei groot', amount_g: 60, kcal: 86, protein_g: 7.5, carbs_g: 0.4, fat_g: 6.0 }],
  },
  {
    name: 'Kipfilet (100g)',
    type: 'product',
    items: [{ product_name: 'Kipfilet', amount_g: 100, kcal: 110, protein_g: 23.0, carbs_g: 0.0, fat_g: 1.8 }],
  },
  {
    name: 'Lactosevrije melk (200ml)',
    type: 'product',
    items: [{ product_name: 'Lactosevrije melk', amount_g: 200, kcal: 130, protein_g: 6.6, carbs_g: 9.6, fat_g: 7.0 }],
  },
  {
    name: 'Lactosevrije Griekse yoghurt (150g)',
    type: 'product',
    items: [{ product_name: 'Lactosevrije Griekse yoghurt', amount_g: 150, kcal: 133, protein_g: 13.5, carbs_g: 5.1, fat_g: 6.0 }],
  },
  {
    name: 'Lactosevrije kwark mager (150g)',
    type: 'product',
    items: [{ product_name: 'Lactosevrije kwark mager', amount_g: 150, kcal: 83, protein_g: 15.0, carbs_g: 6.5, fat_g: 0.3 }],
  },
  {
    name: 'Kokosyoghurt (150g)',
    type: 'product',
    items: [{ product_name: 'Kokosyoghurt', amount_g: 150, kcal: 158, protein_g: 1.4, carbs_g: 7.5, fat_g: 13.5 }],
  },
  {
    name: 'Zalm (100g)',
    type: 'product',
    items: [{ product_name: 'Zalm', amount_g: 100, kcal: 208, protein_g: 20.0, carbs_g: 0.0, fat_g: 13.6 }],
  },
  {
    name: 'Rijst gekookt (100g)',
    type: 'product',
    items: [{ product_name: 'Rijst gekookt', amount_g: 100, kcal: 130, protein_g: 2.7, carbs_g: 28.0, fat_g: 0.3 }],
  },
  {
    name: 'Zoete aardappel (100g)',
    type: 'product',
    items: [{ product_name: 'Zoete aardappel', amount_g: 100, kcal: 86, protein_g: 1.6, carbs_g: 20.0, fat_g: 0.1 }],
  },
  {
    name: 'Broccoli (100g)',
    type: 'product',
    items: [{ product_name: 'Broccoli', amount_g: 100, kcal: 34, protein_g: 2.8, carbs_g: 6.6, fat_g: 0.4 }],
  },
  {
    name: 'Spinazie (100g)',
    type: 'product',
    items: [{ product_name: 'Spinazie', amount_g: 100, kcal: 23, protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4 }],
  },
  {
    name: 'Pompoenpitten (30g)',
    type: 'product',
    items: [{ product_name: 'Pompoenpitten', amount_g: 30, kcal: 162, protein_g: 8.5, carbs_g: 2.5, fat_g: 13.0 }],
  },
  {
    name: 'Zonnebloempitten (30g)',
    type: 'product',
    items: [{ product_name: 'Zonnebloempitten', amount_g: 30, kcal: 174, protein_g: 5.8, carbs_g: 4.0, fat_g: 15.0 }],
  },
  {
    name: 'Olijfolie (10ml)',
    type: 'product',
    items: [{ product_name: 'Olijfolie', amount_g: 10, kcal: 88, protein_g: 0.0, carbs_g: 0.0, fat_g: 10.0 }],
  },
  {
    name: 'Glutenvrij brood (1 snee)',
    type: 'product',
    items: [{ product_name: 'Glutenvrij brood', amount_g: 35, kcal: 79, protein_g: 2.1, carbs_g: 15.0, fat_g: 1.2 }],
  },
];
import { toDateString } from '../../utils/dateHelpers';

const DAY_LABELS = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
const DAY_TYPES: DayType[] = ['rest', 'training', 'longrun'];
const WATER_OPTIONS = [1500, 2000, 2500, 3000];

export default function SettingsScreen() {
  const {
    startDayOfWeek, defaultDayType, waterGoalMl, claudeApiKey, edamamAppId, edamamAppKey,
    supabaseEnabled, initialized, loadSettings,
    setStartDayOfWeek, setDefaultDayType, setWaterGoalMl, setClaudeApiKey,
    setEdamamAppId, setEdamamAppKey, setSupabaseEnabled,
  } = useSettingsStore();

  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [claudeKeyDraft, setClaudeKeyDraft] = useState('');
  const [edamamIdDraft, setEdamamIdDraft] = useState('');
  const [edamamKeyDraft, setEdamamKeyDraft] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    (async () => {
      if (!initialized) await loadSettings();
      setClaudeKeyDraft(claudeApiKey);
      setEdamamIdDraft(edamamAppId);
      setEdamamKeyDraft(edamamAppKey);
      loadFavorites();
    })();
  }, [initialized]);

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavorites(favs);
  };

  const handleSaveClaudeKey = async () => {
    await setClaudeApiKey(claudeKeyDraft.trim());
    Alert.alert('Opgeslagen', 'Claude API key opgeslagen.');
  };

  const handleSaveEdamam = async () => {
    await setEdamamAppId(edamamIdDraft.trim());
    await setEdamamAppKey(edamamKeyDraft.trim());
    Alert.alert('Opgeslagen', 'Edamam credentials opgeslagen.');
  };

  const handleDeleteFavorite = (fav: FavoriteRow) => {
    Alert.alert(
      'Favoriet verwijderen',
      `"${fav.name}" verwijderen?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijder',
          style: 'destructive',
          onPress: async () => {
            await deleteFavorite(fav.id);
            setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
          },
        },
      ]
    );
  };

  const handleRenameFavorite = (fav: FavoriteRow) => {
    Alert.prompt(
      'Hernoemen',
      'Nieuwe naam:',
      async (newName) => {
        if (newName?.trim()) {
          await renameFavorite(fav.id, newName.trim());
          setFavorites((prev) => prev.map((f) => f.id === fav.id ? { ...f, name: newName.trim() } : f));
        }
      },
      'plain-text',
      fav.name
    );
  };

  const handleSeedFavorites = async () => {
    try {
      for (const fav of DEFAULT_FAVORITES) {
        const favId = uuidv4();
        await addFavorite({ id: favId, name: fav.name, type: fav.type, created_at: new Date().toISOString() });
        for (const item of fav.items) {
          await addFavoriteItem({ id: uuidv4(), favorite_id: favId, ...item });
        }
      }
      await loadFavorites();
      Alert.alert('Klaar!', `${DEFAULT_FAVORITES.length} standaard favorieten zijn toegevoegd.`);
    } catch (e: any) {
      Alert.alert('Fout', e.message);
    }
  };

  const handleExportData = async () => {
    try {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const days = await getDaysInRange(toDateString(from), toDateString(to));
      const exportData: any[] = [];
      for (const day of days) {
        const logs = await getFoodLogs(day.id);
        exportData.push({ day, foodLogs: logs });
      }
      const json = JSON.stringify(exportData, null, 2);
      await Share.share({ message: json, title: 'FuelTrack Export' });
    } catch (e: any) {
      Alert.alert('Fout', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Instellingen</Text>

        {/* Week start day */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Startdag van de week</Text>
          <View style={styles.optionRow}>
            {DAY_LABELS.map((label, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.optionBtn, startDayOfWeek === i && styles.activeOptionBtn]}
                onPress={() => setStartDayOfWeek(i)}
                activeOpacity={0.75}
              >
                <Text style={[styles.optionText, startDayOfWeek === i && styles.activeOptionText]}>
                  {label.substring(0, 2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Default day type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Standaard dagtype</Text>
          <View style={styles.optionRow}>
            {DAY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.optionBtnWide, defaultDayType === type && styles.activeOptionBtn]}
                onPress={() => setDefaultDayType(type)}
                activeOpacity={0.75}
              >
                <Text style={[styles.optionText, defaultDayType === type && styles.activeOptionText]}>
                  {DAY_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Water goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Waterdoel per dag</Text>
          <View style={styles.optionRow}>
            {WATER_OPTIONS.map((ml) => (
              <TouchableOpacity
                key={ml}
                style={[styles.optionBtn, waterGoalMl === ml && styles.activeOptionBtn]}
                onPress={() => setWaterGoalMl(ml)}
                activeOpacity={0.75}
              >
                <Text style={[styles.optionText, waterGoalMl === ml && styles.activeOptionText]}>
                  {ml} ml
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Allergie info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergie & Intoleranties</Text>
          <View style={styles.allergyCard}>
            <Text style={styles.allergyItem}>🚫 Allergie: Noten & pinda's</Text>
            <Text style={styles.allergyItem}>⚠️ Intolerantie: Lactose</Text>
            <Text style={styles.allergyItem}>⚠️ Intolerantie: Gluten</Text>
            <Text style={styles.allergyNote}>
              Deze beperkingen worden altijd meegegeven aan AI-adviezen.
            </Text>
          </View>
        </View>

        {/* Claude API Key */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claude API Key</Text>
          <Text style={styles.fieldHint}>Vereist voor AI-adviezen. Haal op via Anthropic Console.</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={claudeKeyDraft}
              onChangeText={setClaudeKeyDraft}
              placeholder="sk-ant-..."
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)} style={styles.showBtn}>
              <Text style={styles.showBtnText}>{showApiKey ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSaveClaudeKey} activeOpacity={0.8}>
            <LinearGradient colors={['#6C3FE8', '#8B6BF0']} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Opslaan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Edamam */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edamam API (optioneel)</Text>
          <Text style={styles.fieldHint}>Fallback zoekdienst als Open Food Facts geen resultaten geeft.</Text>
          <TextInput
            style={styles.input}
            value={edamamIdDraft}
            onChangeText={setEdamamIdDraft}
            placeholder="App ID"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            value={edamamKeyDraft}
            onChangeText={setEdamamKeyDraft}
            placeholder="App Key"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={handleSaveEdamam} activeOpacity={0.8}>
            <LinearGradient colors={['#6C3FE8', '#8B6BF0']} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Opslaan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Supabase sync */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Cloud Sync (Supabase)</Text>
              <Text style={styles.fieldHint}>Synchroniseer data naar de cloud.</Text>
            </View>
            <Switch
              value={supabaseEnabled}
              onValueChange={setSupabaseEnabled}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Favorites management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorieten ({favorites.length})</Text>
          <TouchableOpacity style={styles.seedBtn} onPress={handleSeedFavorites} activeOpacity={0.8}>
            <Text style={styles.seedBtnText}>⭐ Standaard favorieten laden</Text>
          </TouchableOpacity>
          {favorites.length === 0 ? (
            <Text style={styles.emptyText}>Geen favorieten opgeslagen.</Text>
          ) : (
            favorites.map((fav) => (
              <View key={fav.id} style={styles.favRow}>
                <Text style={styles.favIcon}>{fav.type === 'meal' ? '🍽️' : '🥗'}</Text>
                <Text style={styles.favName}>{fav.name}</Text>
                <TouchableOpacity onPress={() => handleRenameFavorite(fav)} style={styles.favAction}>
                  <Text style={styles.favActionText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteFavorite(fav)} style={styles.favAction}>
                  <Text style={styles.favActionText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Data export */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportData} activeOpacity={0.8}>
            <Text style={styles.exportBtnText}>📤 Exporteer data (JSON)</Text>
          </TouchableOpacity>
        </View>

        {/* App info */}
        <View style={[styles.section, styles.infoSection]}>
          <Text style={styles.appName}>FuelTrack</Text>
          <Text style={styles.appVersion}>v1.0.0</Text>
          <View style={styles.infoItems}>
            <Text style={styles.infoText}>AI: claude-sonnet-4-6</Text>
            <Text style={styles.infoText}>Database: Open Food Facts</Text>
          </View>
          <Text style={styles.infoNote}>Gebouwd voor Birgit's marathon food tracking 🏃</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  fieldHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
    marginTop: -8,
    lineHeight: 16,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionBtn: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionBtnWide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeOptionBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  activeOptionText: {
    color: '#fff',
  },
  allergyCard: {
    backgroundColor: 'rgba(251,146,60,0.1)',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.2)',
  },
  allergyItem: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 5,
    fontWeight: '600',
  },
  allergyNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    color: COLORS.text,
  },
  showBtn: {
    padding: 10,
  },
  showBtnText: {
    fontSize: 20,
  },
  saveBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  favIcon: { fontSize: 20 },
  favName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  favAction: { padding: 6 },
  favActionText: { fontSize: 18 },
  seedBtn: {
    backgroundColor: 'rgba(255,200,50,0.08)',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,200,50,0.3)',
    marginBottom: 12,
  },
  seedBtnText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  exportBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exportBtnText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderColor: 'rgba(108,63,232,0.2)',
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primaryLight,
    letterSpacing: -0.5,
  },
  appVersion: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  infoItems: {
    gap: 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  infoNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});

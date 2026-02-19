import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/macroGoals';

interface AIAdviceCardProps {
  title: string;
  advice: string | null;
  loading: boolean;
  onRefresh: () => void;
  error?: string | null;
}

export default function AIAdviceCard({ title, advice, loading, onRefresh, error }: AIAdviceCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <LinearGradient
            colors={['#6C3FE8', '#A78BFA']}
            style={styles.iconBadge}
          >
            <Text style={styles.iconText}>✦</Text>
          </LinearGradient>
          <Text style={styles.title}>{title}</Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          style={styles.refreshBtn}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? ['#3a2068', '#3a2068'] : ['#6C3FE8', '#8B6BF0']}
            style={styles.refreshGrad}
          >
            <Text style={styles.refreshText}>{loading ? '...' : '↻ Vernieuw'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Advies genereren...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : advice ? (
        <Text style={styles.adviceText}>{advice}</Text>
      ) : (
        <Text style={styles.emptyText}>
          Tik op "Vernieuw" voor persoonlijk sportvoedingsadvies op maat.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1545',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 63, 232, 0.35)',
    shadowColor: '#6C3FE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  refreshBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  refreshGrad: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  refreshText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  adviceText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    opacity: 0.92,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.danger,
    lineHeight: 19,
  },
});

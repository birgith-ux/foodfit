import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../constants/macroGoals';
import { NutritionData, searchByBarcode } from '../services/openFoodFacts';

interface BarcodeScannerProps {
  onFound: (data: NutritionData) => void;
  onCancel: () => void;
}

export default function BarcodeScanner({ onFound, onCancel }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!permission) return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permTitle}>Camera toegang vereist</Text>
        <Text style={styles.permSub}>FuelTrack heeft de camera nodig voor het scannen van barcodes.</Text>
        <TouchableOpacity onPress={requestPermission} activeOpacity={0.85}>
          <LinearGradient colors={['#6C3FE8', '#8B6BF0']} style={styles.permBtn}>
            <Text style={styles.permBtnText}>Toegang verlenen</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtnPlain} onPress={onCancel}>
          <Text style={styles.cancelTextPlain}>Annuleren</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcode = async ({ data }: { data: string }) => {
    if (!scanning || loading) return;
    setScanning(false);
    setLoading(true);
    setError(null);
    const result = await searchByBarcode(data);
    setLoading(false);
    if (result) {
      onFound(result);
    } else {
      setError(`Niet gevonden: ${data}`);
      setTimeout(() => { setScanning(true); setError(null); }, 2500);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanning ? handleBarcode : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'upc_a', 'upc_e'] }}
      />
      {/* Dimmed overlay around frame */}
      <View style={styles.overlay}>
        <View style={styles.dimTop} />
        <View style={styles.middleRow}>
          <View style={styles.dimSide} />
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.dimSide} />
        </View>
        <View style={styles.dimBottom}>
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primaryLight} />
              <Text style={styles.loadingText}>Product opzoeken...</Text>
            </View>
          )}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {!loading && !error && (
            <Text style={styles.hint}>Richt de camera op de barcode</Text>
          )}
          <TouchableOpacity onPress={onCancel} activeOpacity={0.8}>
            <LinearGradient
              colors={['rgba(30,21,69,0.9)', 'rgba(15,10,30,0.9)']}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>Annuleren</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const FRAME_SIZE = 260;
const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  permTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  permSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtnPlain: { paddingVertical: 12, paddingHorizontal: 24 },
  cancelTextPlain: { fontSize: 15, color: COLORS.textMuted, fontWeight: '600' },
  overlay: { ...StyleSheet.absoluteFillObject },
  dimTop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    flex: 1,
    minHeight: 120,
  },
  middleRow: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  dimSide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: COLORS.primaryLight,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: 4 },
  dimBottom: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 28,
    paddingHorizontal: 24,
  },
  loadingBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.15)',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 20,
  },
  errorText: { color: COLORS.danger, fontSize: 13, textAlign: 'center' },
  hint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 28,
    textAlign: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(108,63,232,0.4)',
  },
  cancelText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

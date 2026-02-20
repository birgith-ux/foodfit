import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/macroGoals';
import { NutritionData, searchByBarcode } from '../services/openFoodFacts';

interface BarcodeScannerProps {
  onFound: (data: NutritionData) => void;
  onCancel: () => void;
}

type CamState = 'loading' | 'denied' | 'nodevice' | 'scanning';

export default function BarcodeScanner({ onFound, onCancel }: BarcodeScannerProps) {
  const [camState, setCamState] = useState<CamState>('loading');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<any>(null);
  const scanningRef = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        if (cancelled || !videoRef.current) return;

        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;
        setCamState('scanning');

        reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result: any) => {
            if (result && scanningRef.current && !loadingRef.current) {
              handleBarcode(result.getText());
            }
          }
        );
      } catch (e: any) {
        if (cancelled) return;
        if (e?.name === 'NotAllowedError') setCamState('denied');
        else setCamState('nodevice');
      }
    }

    // Kleine delay zodat de Modal DOM klaar is vóór we de video starten
    timer = setTimeout(() => start(), 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      readerRef.current?.reset();
    };
  }, []);

  const handleBarcode = async (data: string) => {
    scanningRef.current = false;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    const result = await searchByBarcode(data);
    setLoading(false);
    loadingRef.current = false;

    if (result) {
      onFound(result);
    } else {
      setError(`Niet gevonden: ${data}`);
      setTimeout(() => {
        setError(null);
        scanningRef.current = true;
      }, 2500);
    }
  };

  // Camera toestemming geweigerd
  if (camState === 'denied') {
    return (
      <View style={styles.center}>
        <Text style={styles.permTitle}>Camera toegang geweigerd</Text>
        <Text style={styles.permSub}>
          Sta cameratoegang toe in je browserinstellingen om barcodes te scannen.
        </Text>
        <TouchableOpacity style={styles.cancelBtnPlain} onPress={onCancel}>
          <Text style={styles.cancelTextPlain}>Annuleren</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Geen camera gevonden
  if (camState === 'nodevice') {
    return (
      <View style={styles.center}>
        <Text style={styles.permTitle}>Geen camera gevonden</Text>
        <Text style={styles.permSub}>
          Er is geen camera beschikbaar op dit apparaat of deze browser.
        </Text>
        <TouchableOpacity style={styles.cancelBtnPlain} onPress={onCancel}>
          <Text style={styles.cancelTextPlain}>Annuleren</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Webcam video element */}
      <video
        ref={videoRef as any}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        } as any}
        muted
        playsInline
      />

      {/* Loading overlay totdat camera actief is */}
      {camState === 'loading' && (
        <View style={styles.centerOverlay}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Camera starten...</Text>
        </View>
      )}

      {/* Dimmed overlay met scanframe */}
      {camState === 'scanning' && (
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
      )}
    </View>
  );
}

const FRAME_SIZE = 260;
const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: Dimensions.get('window').height,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
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

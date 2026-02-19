import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { COLORS } from '../constants/macroGoals';

interface MacroRingProps {
  eaten: number;
  goal: number;
  color: string;
  label: string;
  unit: string;
  size?: number;
}

const LIGHTEN: Record<string, string> = {
  '#F87171': '#FCA5A5',
  '#FB923C': '#FCD34D',
  '#60A5FA': '#93C5FD',
  '#A78BFA': '#C4B5FD',
  '#34D399': '#6EE7B7',
};

export default function MacroRing({ eaten, goal, color, label, unit, size = 80 }: MacroRingProps) {
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = goal > 0 ? Math.min(eaten / goal, 1.05) : 0;
  const strokeDashoffset = circumference * (1 - Math.min(pct, 1));
  const activeColor = pct > 1.05 ? COLORS.danger : pct > 0.9 ? COLORS.warning : color;
  const gradEnd = LIGHTEN[activeColor] ?? activeColor;
  const gradId = `grad-${label.replace(/\s/g, '')}`;

  return (
    <View style={[styles.container, { width: size, height: size + 20 }]}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={activeColor} />
            <Stop offset="1" stopColor={gradEnd} />
          </SvgGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {pct > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.value, { color: activeColor }]}>{Math.round(eaten)}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
  },
  unit: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});

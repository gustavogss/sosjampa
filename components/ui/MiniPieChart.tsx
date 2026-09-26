import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { Colors, FontSize, FontWeight, Spacing, Radii } from '@/constants/theme';
import { SupplyCategory } from '@/contexts/DataContext';

const CATEGORY_CONFIG: Record<SupplyCategory, { label: string; color: string; light: string }> = {
  alimentos: { label: 'Alimentos', color: Colors.catAlimentos, light: Colors.catAlimentosLight },
  higiene: { label: 'Higiene', color: Colors.catHigiene, light: Colors.catHigieneLight },
  roupas: { label: 'Roupas', color: Colors.catRoupas, light: Colors.catRoupasLight },
  medicamentos: { label: 'Medicamentos', color: Colors.catMedicamentos, light: Colors.catMedicamentosLight },
  outros: { label: 'Outros', color: Colors.catOutros, light: Colors.catOutrosLight },
};

interface Slice {
  category: SupplyCategory;
  total: number;
}

interface Props {
  data: Slice[];
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function MiniPieChart({ data, size = 160 }: Props) {
  const total = data.reduce((s, d) => s + d.total, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const innerR = r * 0.52;

  if (total === 0) {
    return (
      <View style={[styles.emptyWrap, { width: size, height: size }]}>
        <Text style={styles.emptyText}>Sem dados</Text>
      </View>
    );
  }

  let cumAngle = 0;
  const slices = data.map((d) => {
    const angle = (d.total / total) * 360;
    const start = cumAngle;
    cumAngle += angle;
    return { ...d, startAngle: start, endAngle: cumAngle, angle };
  });

  return (
    <View style={styles.wrap}>
      {/* Pie */}
      <View>
        <Svg width={size} height={size}>
          <G>
            {slices.map((s) => (
              <Path
                key={s.category}
                d={slicePath(cx, cy, r, s.startAngle, s.endAngle)}
                fill={CATEGORY_CONFIG[s.category].color}
              />
            ))}
            {/* Donut hole */}
            <Circle cx={cx} cy={cy} r={innerR} fill={Colors.surface} />
          </G>
        </Svg>
        {/* Center label */}
        <View style={[styles.centerLabel, { width: innerR * 2, height: innerR * 2, borderRadius: innerR, top: cy - innerR, left: cx - innerR }]}>
          <Text style={styles.centerTotal}>{total}</Text>
          <Text style={styles.centerSub}>itens</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {slices.map((s) => {
          const cfg = CATEGORY_CONFIG[s.category];
          const pct = Math.round((s.total / total) * 100);
          return (
            <View key={s.category} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
              <Text style={styles.legendLabel} numberOfLines={1}>{cfg.label}</Text>
              <Text style={styles.legendPct}>{pct}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textSubtle,
    fontSize: FontSize.sm,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTotal: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  centerSub: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    includeFontPadding: false,
  },
  legend: {
    flex: 1,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  legendLabel: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    includeFontPadding: false,
  },
  legendPct: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
});

export default memo(MiniPieChart);

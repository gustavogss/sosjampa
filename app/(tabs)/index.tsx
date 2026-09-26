import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppData } from '@/hooks/useAppData';
import MiniPieChart from '@/components/ui/MiniPieChart';
import { Colors, Spacing, Radii, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { SupplyCategory, SupplyItem, PixTransaction } from '@/contexts/DataContext';

const CATEGORY_LABELS: Record<SupplyCategory, string> = {
  alimentos: 'Alimentos',
  higiene: 'Higiene',
  roupas: 'Roupas',
  medicamentos: 'Medicamentos',
  outros: 'Outros',
};

const CATEGORY_ICONS: Record<SupplyCategory, keyof typeof MaterialIcons.glyphMap> = {
  alimentos: 'shopping-basket',
  higiene: 'sanitizer',
  roupas: 'checkroom',
  medicamentos: 'medical-services',
  outros: 'category',
};

const CATEGORY_COLORS: Record<SupplyCategory, string> = {
  alimentos: Colors.catAlimentos,
  higiene: Colors.catHigiene,
  roupas: Colors.catRoupas,
  medicamentos: Colors.catMedicamentos,
  outros: Colors.catOutros,
};

type HistoryEntry =
  | { kind: 'pix'; data: PixTransaction }
  | { kind: 'supply'; data: SupplyItem };

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { supplies, pixTransactions, familiesAttended, totalPix, supplySummary } = useAppData();

  const recentHistory: HistoryEntry[] = useMemo(() => {
    const pix: HistoryEntry[] = pixTransactions.map((p) => ({ kind: 'pix', data: p }));
    const sup: HistoryEntry[] = supplies.map((s) => ({ kind: 'supply', data: s }));
    return [...pix, ...sup]
      .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
      .slice(0, 12);
  }, [pixTransactions, supplies]);

  const totalSupplyItems = supplies.reduce((s, i) => s + i.quantity, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.appName}>SOS Jampa</Text>
            <Text style={styles.appSub}>Painel de Recursos</Text>
          </View>
          <View style={styles.familiesBadge}>
            <MaterialIcons name="people" size={16} color={Colors.textOnPrimary} />
            <Text style={styles.familiesCount}>{familiesAttended}</Text>
            <Text style={styles.familiesLabel}>famílias</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* ── Money Card ──────────────────────────────────────── */}
        <View style={styles.moneyCard}>
          <View style={styles.moneyCardTop}>
            <View style={styles.moneyIconWrap}>
              <MaterialIcons name="pix" size={28} color={Colors.textOnPrimary} />
            </View>
            <View style={styles.moneyMeta}>
              <Text style={styles.moneyLabel}>Total Arrecadado (Pix)</Text>
              <Text style={styles.moneySubLabel}>{pixTransactions.length} transações recebidas</Text>
            </View>
          </View>
          <Text style={styles.moneyValue}>{formatCurrency(totalPix)}</Text>
          <View style={styles.moneyFooter}>
            <View style={styles.moneyFooterChip}>
              <MaterialIcons name="trending-up" size={13} color={Colors.primaryLight} />
              <Text style={styles.moneyFooterText}>Última: {formatCurrency(pixTransactions[0]?.amount ?? 0)}</Text>
            </View>
            <View style={styles.moneyFooterChip}>
              <MaterialIcons name="verified" size={13} color={Colors.primaryLight} />
              <Text style={styles.moneyFooterText}>100% auditado</Text>
            </View>
          </View>
        </View>

        {/* ── Quick stats ─────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderTopColor: Colors.catAlimentos }]}>
            <MaterialIcons name="inventory" size={20} color={Colors.catAlimentos} />
            <Text style={styles.statValue}>{totalSupplyItems}</Text>
            <Text style={styles.statLabel}>Itens em{'\n'}estoque</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: Colors.catHigiene }]}>
            <MaterialIcons name="category" size={20} color={Colors.catHigiene} />
            <Text style={styles.statValue}>{supplies.length}</Text>
            <Text style={styles.statLabel}>Tipos de{'\n'}mantimento</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: Colors.primary }]}>
            <MaterialIcons name="family-restroom" size={20} color={Colors.primary} />
            <Text style={styles.statValue}>{familiesAttended}</Text>
            <Text style={styles.statLabel}>Famílias{'\n'}atendidas</Text>
          </View>
        </View>

        {/* ── Pie Chart ───────────────────────────────────────── */}
        <View style={styles.chartCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="pie-chart" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Mantimentos por Categoria</Text>
          </View>
          <MiniPieChart data={supplySummary} size={160} />
        </View>

        {/* ── Recent History ──────────────────────────────────── */}
        <View style={styles.historyCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="history" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Histórico Recente</Text>
          </View>

          {recentHistory.map((entry, idx) => {
            if (entry.kind === 'pix') {
              const tx = entry.data;
              return (
                <View key={tx.id} style={[styles.historyItem, idx < recentHistory.length - 1 && styles.historyItemBorder]}>
                  <View style={styles.historyIconWrap}>
                    <MaterialIcons name="pix" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {tx.sender}
                    </Text>
                    {tx.description ? (
                      <Text style={styles.historyDesc} numberOfLines={1}>{tx.description}</Text>
                    ) : null}
                    <Text style={styles.historyDate}>{formatDate(tx.date)}</Text>
                  </View>
                  <Text style={styles.historyAmount}>+{formatCurrency(tx.amount)}</Text>
                </View>
              );
            } else {
              const sup = entry.data;
              const color = CATEGORY_COLORS[sup.category];
              return (
                <View key={sup.id} style={[styles.historyItem, idx < recentHistory.length - 1 && styles.historyItemBorder]}>
                  <View style={[styles.historyIconWrap, { backgroundColor: color + '18' }]}>
                    <MaterialIcons name={CATEGORY_ICONS[sup.category]} size={18} color={color} />
                  </View>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyTitle} numberOfLines={1}>{sup.name}</Text>
                    <Text style={styles.historyDesc}>{CATEGORY_LABELS[sup.category]}</Text>
                    <Text style={styles.historyDate}>{formatDate(sup.date)}</Text>
                  </View>
                  <Text style={[styles.historyBadge, { color }]}>
                    +{sup.quantity} {sup.unit}
                  </Text>
                </View>
              );
            }
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textOnPrimary,
    includeFontPadding: false,
  },
  appSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.70)',
    includeFontPadding: false,
    marginTop: 2,
  },
  familiesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  familiesCount: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textOnPrimary,
    includeFontPadding: false,
  },
  familiesLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.80)',
    includeFontPadding: false,
  },

  body: {
    padding: Spacing.md,
    gap: Spacing.md,
  },

  // Money card
  moneyCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    ...Shadow.md,
  },
  moneyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  moneyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moneyMeta: {
    flex: 1,
  },
  moneyLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textOnPrimary,
    includeFontPadding: false,
  },
  moneySubLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.70)',
    includeFontPadding: false,
    marginTop: 2,
  },
  moneyValue: {
    fontSize: 36,
    fontWeight: FontWeight.extrabold,
    color: Colors.textOnPrimary,
    includeFontPadding: false,
    marginBottom: Spacing.md,
  },
  moneyFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  moneyFooterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    gap: 4,
  },
  moneyFooterText: {
    fontSize: FontSize.xs,
    color: Colors.primaryLight,
    includeFontPadding: false,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 3,
    ...Shadow.sm,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    includeFontPadding: false,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSubtle,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 14,
  },

  // Chart card
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },

  // History
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: Spacing.sm,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  historyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.moneyLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  historyMeta: {
    flex: 1,
    minWidth: 0,
  },
  historyTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  historyDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    includeFontPadding: false,
    marginTop: 1,
  },
  historyDate: {
    fontSize: 10,
    color: Colors.textSubtle,
    includeFontPadding: false,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.success,
    includeFontPadding: false,
    flexShrink: 0,
  },
  historyBadge: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
    flexShrink: 0,
  },
});

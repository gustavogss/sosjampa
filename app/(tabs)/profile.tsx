import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import { useReport } from '@/hooks/useReport';
import { Colors, Spacing, Radii, FontSize, FontWeight, Shadow } from '@/constants/theme';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface MenuItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, value, onPress, danger }: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      accessibilityLabel={label}
    >
      <MaterialIcons
        name={icon}
        size={22}
        color={danger ? Colors.error : Colors.textSecondary}
        style={styles.menuIcon}
      />
      <Text style={[styles.menuLabel, danger && { color: Colors.error }]}>{label}</Text>
      {value ? (
        <Text style={styles.menuValue}>{value}</Text>
      ) : (
        <MaterialIcons name="chevron-right" size={20} color={Colors.textSubtle} />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { totalPix, pixTransactions, supplies, familiesAttended, setFamiliesAttended, families } = useAppData();
  const { exportReport, printReport, isGenerating } = useReport();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const totalItems = supplies.reduce((s, i) => s + i.quantity, 0);

  const handleSignOut = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleEditFamilies = () => {
    Alert.prompt(
      'Famílias Atendidas',
      'Informe o número atual de famílias atendidas:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salvar',
          onPress: (val) => {
            const n = parseInt(val ?? '', 10);
            if (n > 0) setFamiliesAttended(n);
          },
        },
      ],
      'plain-text',
      String(familiesAttended),
      'number-pad'
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile header */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <MaterialIcons name="manage-accounts" size={40} color="#fff" />
          </View>
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.userName}>{user?.displayName ?? 'Coordenador'}</Text>
        <Text style={styles.userEmail}>{user?.email ?? 'usuario@sosjampa.org'}</Text>
        <View style={styles.mockChip}>
          <MaterialIcons name="info" size={12} color={Colors.accent} />
          <Text style={styles.mockChipText}>Usuário SOS Jampa</Text>
        </View>
      </View>

      {/* Impact summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RESUMO DE IMPACTO</Text>
        <View style={styles.impactRow}>
          {[
            { label: 'Arrecadado', value: formatCurrency(totalPix), icon: 'pix' as const, color: Colors.primary },
            { label: 'Itens', value: String(totalItems), icon: 'inventory' as const, color: Colors.catAlimentos },
            { label: 'Famílias', value: String(familiesAttended), icon: 'people' as const, color: Colors.catHigiene },
          ].map((item) => (
            <View key={item.label} style={[styles.impactCard, { borderTopColor: item.color }]}>
              <MaterialIcons name={item.icon} size={20} color={item.color} />
              <Text style={[styles.impactValue, { color: item.color }]} numberOfLines={1} adjustsFontSizeToFit>
                {item.value}
              </Text>
              <Text style={styles.impactLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Pix key */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CHAVE PIX</Text>
        <Pressable
          style={({ pressed }) => [styles.pixCard, pressed && { opacity: 0.9 }]}
          onPress={() => Alert.alert('Chave Pix', 'sosjampa@ajuda.org.br\n\n100% do valor é destinado às famílias cadastradas.')}
        >
          <MaterialIcons name="pix" size={24} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.pixTitle}>Chave Pix de Doação</Text>
            <Text style={styles.pixKey}>sosjampa@ajuda.org.br</Text>
          </View>
          <MaterialIcons name="content-copy" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      {/* Export / Reports */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RELATÓRIOS</Text>
        <View style={styles.reportCard}>
          <View style={styles.reportCardHeader}>
            <View style={styles.reportIconWrap}>
              <MaterialIcons name="picture-as-pdf" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reportCardTitle}>Relatório Completo</Text>
              <Text style={styles.reportCardSub}>
                {pixTransactions.length} Pix · {supplies.length} mantimentos · {families.length} famílias
              </Text>
            </View>
          </View>
          <View style={styles.reportBtns}>
            <Pressable
              style={({ pressed }) => [
                styles.reportBtn,
                styles.reportBtnPrimary,
                (pressed || isGenerating) && { opacity: 0.75 },
              ]}
              onPress={exportReport}
              disabled={isGenerating}
              accessibilityLabel="Exportar relatório PDF"
            >
              <MaterialIcons name={isGenerating ? 'hourglass-top' : 'share'} size={16} color="#fff" />
              <Text style={styles.reportBtnPrimaryText}>
                {isGenerating ? 'Gerando...' : 'Exportar PDF'}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.reportBtn,
                styles.reportBtnSecondary,
                (pressed || isGenerating) && { opacity: 0.75 },
              ]}
              onPress={printReport}
              disabled={isGenerating}
              accessibilityLabel="Imprimir relatório"
            >
              <MaterialIcons name="print" size={16} color={Colors.primary} />
              <Text style={styles.reportBtnSecondaryText}>Imprimir</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* App settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONFIGURAÇÕES</Text>
        <View style={styles.card}>
          <MenuItem
            icon="family-restroom"
            label="Famílias atendidas"
            value={String(familiesAttended)}
            onPress={handleEditFamilies}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="location-city"
            label="Localização"
            value="João Pessoa"
          />
          <View style={styles.divider} />
          <MenuItem icon="info" label="Versão" value="1.0.0 (Demo)" />
        </View>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONTA</Text>
        <View style={styles.card}>
          <MenuItem
            icon="notifications"
            label="Notificações"
            onPress={() => Alert.alert('Em breve', 'Alertas de novas doações serão adicionados em breve.')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="privacy-tip"
            label="Privacidade"
            onPress={() => Alert.alert('Privacidade', 'Seus dados são protegidos e não são compartilhados.')}
          />
          <View style={styles.divider} />
          <MenuItem icon="logout" label="Sair da conta" onPress={handleSignOut} danger />
        </View>
      </View>

      <Text style={styles.footer}>
        SOS Jampa © 2026{'\n'}Feito com solidariedade para a comunidade
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.md },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: Radii.full,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
    includeFontPadding: false,
    marginBottom: Spacing.md,
  },
  mockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    gap: 4,
  },
  mockChipText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
    includeFontPadding: false,
  },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSubtle,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    includeFontPadding: false,
  },
  impactRow: { flexDirection: 'row', gap: Spacing.sm },
  impactCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 3,
    ...Shadow.sm,
  },
  impactValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    includeFontPadding: false,
  },
  impactLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    includeFontPadding: false,
    textAlign: 'center',
  },
  pixCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.md,
  },
  pixTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#fff',
    includeFontPadding: false,
  },
  pixKey: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    includeFontPadding: false,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  menuIcon: { marginRight: Spacing.md },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  menuValue: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
    includeFontPadding: false,
  },
  divider: { height: 1, backgroundColor: Colors.divider, marginLeft: 54 },
  // Report card
  reportCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  reportIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  reportCardSub: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    includeFontPadding: false,
    marginTop: 2,
  },
  reportBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  reportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: Radii.full,
    minHeight: 44,
  },
  reportBtnPrimary: {
    backgroundColor: Colors.primary,
    ...Shadow.sm,
  },
  reportBtnPrimaryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#fff',
    includeFontPadding: false,
  },
  reportBtnSecondary: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  reportBtnSecondaryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    includeFontPadding: false,
  },
  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    lineHeight: 18,
    marginTop: Spacing.sm,
    includeFontPadding: false,
  },
});

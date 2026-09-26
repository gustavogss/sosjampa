import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppData } from '@/hooks/useAppData';
import { PixTransaction } from '@/contexts/DataContext';
import { Colors, Spacing, Radii, FontSize, FontWeight, Shadow } from '@/constants/theme';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Add Pix Modal ───────────────────────────────────────────────────────────

interface AddPixModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (tx: Omit<PixTransaction, 'id' | 'date'>) => void;
}

function AddPixModal({ visible, onClose, onSave }: AddPixModalProps) {
  const [amount, setAmount] = useState('');
  const [sender, setSender] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    const value = parseFloat(amount.replace(',', '.'));
    if (!value || value <= 0) {
      Alert.alert('Valor inválido', 'Informe o valor do Pix recebido.');
      return;
    }
    if (!sender.trim()) {
      Alert.alert('Remetente obrigatório', 'Informe o nome de quem realizou o Pix.');
      return;
    }
    onSave({ amount: value, sender: sender.trim(), description: description.trim() });
    setAmount(''); setSender(''); setDescription('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>Registrar Pix Recebido</Text>
            <Pressable onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={modalStyles.body}>
            <Text style={modalStyles.label}>Valor recebido (R$) *</Text>
            <View style={modalStyles.input}>
              <TextInput
                style={[modalStyles.inputText, modalStyles.amountInput]}
                placeholder="0,00"
                placeholderTextColor={Colors.textSubtle}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={modalStyles.label}>Nome do remetente *</Text>
            <View style={modalStyles.input}>
              <TextInput
                style={modalStyles.inputText}
                placeholder="Ex: João Silva, Empresa ABC..."
                placeholderTextColor={Colors.textSubtle}
                value={sender}
                onChangeText={setSender}
              />
            </View>

            <Text style={modalStyles.label}>Descrição / Mensagem</Text>
            <View style={[modalStyles.input, { minHeight: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
              <TextInput
                style={[modalStyles.inputText, { textAlignVertical: 'top' }]}
                placeholder="Mensagem do doador (opcional)"
                placeholderTextColor={Colors.textSubtle}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={modalStyles.pixKeyCard}>
              <MaterialIcons name="pix" size={20} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.pixKeyLabel}>Chave Pix do SOS Jampa</Text>
                <Text style={modalStyles.pixKeyValue}>sosjampa@ajuda.org.br</Text>
              </View>
              <MaterialIcons name="content-copy" size={18} color={Colors.textSubtle} />
            </View>
          </View>

          <View style={modalStyles.footer}>
            <Pressable
              style={({ pressed }) => [modalStyles.saveBtn, pressed && { opacity: 0.85 }]}
              onPress={handleSave}
            >
              <MaterialIcons name="check" size={20} color="#fff" />
              <Text style={modalStyles.saveBtnText}>Registrar Recebimento</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function FinanceScreen() {
  const insets = useSafeAreaInsets();
  const { pixTransactions, addPixTransaction, removePixTransaction, totalPix } = useAppData();
  const [modalVisible, setModalVisible] = useState(false);

  const handleDelete = (tx: PixTransaction) => {
    Alert.alert(
      'Remover transação',
      `Remover Pix de ${formatCurrency(tx.amount)} de "${tx.sender}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => removePixTransaction(tx.id) },
      ]
    );
  };

  const avgAmount = pixTransactions.length > 0 ? totalPix / pixTransactions.length : 0;
  const maxTx = pixTransactions.reduce((m, t) => (t.amount > (m?.amount ?? 0) ? t : m), pixTransactions[0]);

  const renderItem = ({ item, index }: { item: PixTransaction; index: number }) => (
    <View style={[styles.txRow, index < pixTransactions.length - 1 && styles.txRowBorder]}>
      <View style={styles.txIcon}>
        <MaterialIcons name="pix" size={20} color={Colors.primary} />
      </View>
      <View style={styles.txMeta}>
        <Text style={styles.txSender} numberOfLines={1}>{item.sender}</Text>
        {item.description ? (
          <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
        <Text style={styles.txDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={styles.txAmount}>{formatCurrency(item.amount)}</Text>
        <Pressable
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Financeiro</Text>
            <Text style={styles.headerSub}>SOS Jampa — Controle de Pix</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
            onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Registrar</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={pixTransactions}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        ListHeaderComponent={
          <>
            {/* Total card */}
            <View style={styles.totalCard}>
              <View style={styles.totalTop}>
                <View style={styles.totalIconWrap}>
                  <MaterialIcons name="account-balance-wallet" size={28} color="#fff" />
                </View>
                <View>
                  <Text style={styles.totalLabel}>Total Arrecadado</Text>
                  <Text style={styles.totalSub}>{pixTransactions.length} transações</Text>
                </View>
              </View>
              <Text style={styles.totalValue}>{formatCurrency(totalPix)}</Text>
              <View style={styles.totalStatsRow}>
                <View style={styles.totalStat}>
                  <Text style={styles.totalStatLabel}>Ticket médio</Text>
                  <Text style={styles.totalStatValue}>{formatCurrency(avgAmount)}</Text>
                </View>
                <View style={styles.totalStatDivider} />
                <View style={styles.totalStat}>
                  <Text style={styles.totalStatLabel}>Maior doação</Text>
                  <Text style={styles.totalStatValue}>{formatCurrency(maxTx?.amount ?? 0)}</Text>
                </View>
              </View>
            </View>

            {/* Pix key banner */}
            <Pressable
              style={({ pressed }) => [styles.pixKeyBanner, pressed && { opacity: 0.9 }]}
              onPress={() => Alert.alert('Chave Pix', 'sosjampa@ajuda.org.br\n\nCompartilhe esta chave para receber doações.')}
            >
              <MaterialIcons name="pix" size={22} color={Colors.textOnPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pixBannerTitle}>Chave Pix para doações</Text>
                <Text style={styles.pixBannerKey}>sosjampa@ajuda.org.br</Text>
              </View>
              <MaterialIcons name="content-copy" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>

            <Text style={styles.sectionLabel}>HISTÓRICO DE RECEBIMENTOS</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="account-balance-wallet" size={48} color={Colors.textSubtle} />
            <Text style={styles.emptyTitle}>Nenhuma transação</Text>
            <Text style={styles.emptyDesc}>Registre os Pix recebidos para acompanhar o total arrecadado.</Text>
          </View>
        }
      />

      <AddPixModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={addPixTransaction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadow.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    includeFontPadding: false,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 4,
    minHeight: 44,
    ...Shadow.sm,
  },
  addBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#fff',
    includeFontPadding: false,
  },
  listContent: { padding: Spacing.md },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSubtle,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    includeFontPadding: false,
  },

  // Total card
  totalCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  totalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  totalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#fff',
    includeFontPadding: false,
  },
  totalSub: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    includeFontPadding: false,
  },
  totalValue: {
    fontSize: 34,
    fontWeight: FontWeight.extrabold,
    color: '#fff',
    includeFontPadding: false,
    marginBottom: Spacing.md,
  },
  totalStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
  },
  totalStat: { flex: 1, alignItems: 'center' },
  totalStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  totalStatLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    includeFontPadding: false,
  },
  totalStatValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#fff',
    includeFontPadding: false,
    marginTop: 2,
  },

  // Pix key banner
  pixKeyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMid,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  pixBannerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#fff',
    includeFontPadding: false,
  },
  pixBannerKey: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    includeFontPadding: false,
    marginTop: 2,
  },

  // Transaction rows
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  txRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: Colors.moneyLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txMeta: { flex: 1, minWidth: 0 },
  txSender: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  txDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    includeFontPadding: false,
    marginTop: 1,
  },
  txDate: { fontSize: 10, color: Colors.textSubtle, includeFontPadding: false, marginTop: 2 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.success,
    includeFontPadding: false,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    includeFontPadding: false,
  },
  emptyDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 20,
    includeFontPadding: false,
  },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  body: { padding: Spacing.md, gap: Spacing.sm },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    includeFontPadding: false,
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  amountInput: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.success,
  },
  pixKeyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceTinted,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  pixKeyLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    includeFontPadding: false,
  },
  pixKeyValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    includeFontPadding: false,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingVertical: 14,
    gap: Spacing.sm,
    minHeight: 52,
    ...Shadow.md,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
  },
});

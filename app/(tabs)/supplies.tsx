import React, { useState, useRef, useCallback } from 'react';
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
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAppData } from '@/hooks/useAppData';
import { SupplyCategory, SupplyItem } from '@/contexts/DataContext';
import { Colors, Spacing, Radii, FontSize, FontWeight, Shadow } from '@/constants/theme';

const CATEGORIES: { key: SupplyCategory; label: string; icon: keyof typeof MaterialIcons.glyphMap; color: string }[] = [
  { key: 'alimentos', label: 'Alimentos', icon: 'shopping-basket', color: Colors.catAlimentos },
  { key: 'higiene', label: 'Higiene', icon: 'sanitizer', color: Colors.catHigiene },
  { key: 'roupas', label: 'Roupas', icon: 'checkroom', color: Colors.catRoupas },
  { key: 'medicamentos', label: 'Medicamentos', icon: 'medical-services', color: Colors.catMedicamentos },
  { key: 'outros', label: 'Outros', icon: 'category', color: Colors.catOutros },
];

function getCatConfig(cat: SupplyCategory) {
  return CATEGORIES.find((c) => c.key === cat) ?? CATEGORIES[4];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Add Supply Modal ────────────────────────────────────────────────────────
interface AddModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: Omit<SupplyItem, 'id' | 'date'>) => void;
  initialBarcode?: string;
}

function AddModal({ visible, onClose, onSave, initialBarcode }: AddModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('un');
  const [category, setCategory] = useState<SupplyCategory>('alimentos');
  const [barcode, setBarcode] = useState(initialBarcode ?? '');
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scanned = useRef(false);

  React.useEffect(() => {
    setBarcode(initialBarcode ?? '');
    scanned.current = false;
  }, [initialBarcode, visible]);

  const handleScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Permissão negada', 'Acesso à câmera necessário para escanear QR/código de barras.');
        return;
      }
    }
    scanned.current = false;
    setScanning(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned.current) return;
    scanned.current = true;
    setBarcode(data);
    setScanning(false);
    // Try to auto-fill name from barcode (mock product lookup)
    if (data.length > 4 && !name) {
      setName(`Produto ${data.slice(-4)}`);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome do item.');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      Alert.alert('Quantidade inválida', 'Informe uma quantidade válida.');
      return;
    }
    onSave({ name: name.trim(), quantity: qty, unit: unit.trim() || 'un', category, barcode: barcode || undefined });
    setName(''); setQuantity('1'); setUnit('un'); setCategory('alimentos'); setBarcode('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {scanning ? (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a'] }}
            onBarcodeScanned={handleBarCodeScanned}
          />
          <View style={scanStyles.overlay}>
            <View style={scanStyles.reticle} />
            <Text style={scanStyles.hint}>Aponte para o QR Code ou código de barras</Text>
            <Pressable style={scanStyles.cancelBtn} onPress={() => setScanning(false)}>
              <Text style={scanStyles.cancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={modalStyles.container}>
            {/* Header */}
            <View style={modalStyles.header}>
              <Text style={modalStyles.headerTitle}>Adicionar Mantimento</Text>
              <Pressable onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <View style={modalStyles.body}>
              {/* Barcode row */}
              <View style={modalStyles.barcodeRow}>
                <View style={[modalStyles.input, { flex: 1 }]}>
                  <TextInput
                    style={modalStyles.inputText}
                    placeholder="Código de barras / QR"
                    placeholderTextColor={Colors.textSubtle}
                    value={barcode}
                    onChangeText={setBarcode}
                    keyboardType="default"
                  />
                </View>
                <Pressable
                  style={({ pressed }) => [modalStyles.scanBtn, pressed && { opacity: 0.8 }]}
                  onPress={handleScan}
                >
                  <MaterialIcons name="qr-code-scanner" size={22} color="#fff" />
                  <Text style={modalStyles.scanBtnText}>Scan</Text>
                </Pressable>
              </View>
              {barcode ? (
                <Text style={modalStyles.barcodeHint}>Código: {barcode}</Text>
              ) : null}

              {/* Name */}
              <Text style={modalStyles.label}>Nome do item *</Text>
              <View style={modalStyles.input}>
                <TextInput
                  style={modalStyles.inputText}
                  placeholder="Ex: Arroz 5kg, Sabonete Dove..."
                  placeholderTextColor={Colors.textSubtle}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Quantity + Unit row */}
              <View style={modalStyles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.label}>Quantidade *</Text>
                  <View style={modalStyles.input}>
                    <TextInput
                      style={modalStyles.inputText}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                <View style={{ width: 100 }}>
                  <Text style={modalStyles.label}>Unidade</Text>
                  <View style={modalStyles.input}>
                    <TextInput
                      style={modalStyles.inputText}
                      value={unit}
                      onChangeText={setUnit}
                      placeholder="un, pct, cx"
                      placeholderTextColor={Colors.textSubtle}
                    />
                  </View>
                </View>
              </View>

              {/* Category */}
              <Text style={modalStyles.label}>Categoria</Text>
              <View style={modalStyles.catRow}>
                {CATEGORIES.map((c) => (
                  <Pressable
                    key={c.key}
                    style={[
                      modalStyles.catChip,
                      category === c.key && { backgroundColor: c.color, borderColor: c.color },
                    ]}
                    onPress={() => setCategory(c.key)}
                  >
                    <MaterialIcons name={c.icon} size={14} color={category === c.key ? '#fff' : c.color} />
                    <Text
                      style={[
                        modalStyles.catChipText,
                        { color: category === c.key ? '#fff' : Colors.textSecondary },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={modalStyles.footer}>
              <Pressable
                style={({ pressed }) => [modalStyles.saveBtn, pressed && { opacity: 0.85 }]}
                onPress={handleSave}
              >
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text style={modalStyles.saveBtnText}>Salvar Item</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function SuppliesScreen() {
  const insets = useSafeAreaInsets();
  const { supplies, addSupply, removeSupply, updateSupplyQty } = useAppData();
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SupplyCategory | 'todos'>('todos');

  const filtered = activeFilter === 'todos' ? supplies : supplies.filter((s) => s.category === activeFilter);

  const handleDelete = (item: SupplyItem) => {
    Alert.alert(
      'Remover item',
      `Remover "${item.name}" do estoque?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => removeSupply(item.id) },
      ]
    );
  };

  const renderItem = useCallback(({ item }: { item: SupplyItem }) => {
    const cfg = getCatConfig(item.category);
    return (
      <View style={styles.supplyRow}>
        <View style={[styles.supplyIcon, { backgroundColor: cfg.color + '18' }]}>
          <MaterialIcons name={cfg.icon} size={20} color={cfg.color} />
        </View>
        <View style={styles.supplyMeta}>
          <Text style={styles.supplyName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.supplyTagRow}>
            <View style={[styles.catTag, { backgroundColor: cfg.color + '18' }]}>
              <Text style={[styles.catTagText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            {item.barcode ? (
              <View style={styles.barcodeTag}>
                <MaterialIcons name="qr-code" size={10} color={Colors.textSubtle} />
                <Text style={styles.barcodeTagText}>{item.barcode.slice(-6)}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.supplyDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.supplyRight}>
          <Text style={[styles.supplyQty, { color: cfg.color }]}>{item.quantity}</Text>
          <Text style={styles.supplyUnit}>{item.unit}</Text>
        </View>
        <Pressable
          style={styles.deleteBtn}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
        </Pressable>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Mantimentos</Text>
            <Text style={styles.headerSub}>{supplies.length} itens · {supplies.reduce((s, i) => s + i.quantity, 0)} unidades</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
            onPress={() => setModalVisible(true)}
            accessibilityLabel="Adicionar mantimento"
          >
            <MaterialIcons name="qr-code-scanner" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Adicionar</Text>
          </Pressable>
        </View>

        {/* Category filter */}
        <FlatList
          horizontal
          data={[{ key: 'todos' as const, label: 'Todos', icon: 'list' as const, color: Colors.primary }, ...CATEGORIES]}
          keyExtractor={(i) => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item: f }) => (
            <Pressable
              style={[styles.filterChip, activeFilter === f.key && { backgroundColor: f.color, borderColor: f.color }]}
              onPress={() => setActiveFilter(f.key as any)}
            >
              <MaterialIcons name={f.icon} size={13} color={activeFilter === f.key ? '#fff' : Colors.textSubtle} />
              <Text style={[styles.filterChipText, activeFilter === f.key && { color: '#fff' }]}>{f.label}</Text>
            </Pressable>
          )}
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="inventory-2" size={48} color={Colors.textSubtle} />
            <Text style={styles.emptyTitle}>Nenhum item encontrado</Text>
            <Text style={styles.emptyDesc}>Toque em "Adicionar" para cadastrar mantimentos via QR Code ou manualmente.</Text>
          </View>
        }
      />

      <AddModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={addSupply}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadow.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
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
    gap: 6,
    minHeight: 44,
    ...Shadow.sm,
  },
  addBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#fff',
    includeFontPadding: false,
  },
  filterContent: {
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 34,
  },
  filterChipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSubtle,
    includeFontPadding: false,
  },

  listContent: { padding: Spacing.md },
  separator: { height: 1, backgroundColor: Colors.divider },
  supplyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  supplyIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  supplyMeta: { flex: 1, minWidth: 0 },
  supplyName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  supplyTagRow: { flexDirection: 'row', gap: 5, marginTop: 3, alignItems: 'center' },
  catTag: {
    borderRadius: Radii.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  catTagText: { fontSize: 10, fontWeight: FontWeight.semibold, includeFontPadding: false },
  barcodeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.background,
    borderRadius: Radii.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  barcodeTagText: { fontSize: 10, color: Colors.textSubtle, includeFontPadding: false },
  supplyDate: { fontSize: 10, color: Colors.textSubtle, includeFontPadding: false, marginTop: 3 },
  supplyRight: { alignItems: 'center', minWidth: 44 },
  supplyQty: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, includeFontPadding: false },
  supplyUnit: { fontSize: 10, color: Colors.textSubtle, includeFontPadding: false },
  deleteBtn: { padding: 4, marginLeft: 4 },
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

const scanStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  reticle: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
    borderRadius: Radii.lg,
    backgroundColor: 'transparent',
  },
  hint: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  cancelBtn: {
    backgroundColor: Colors.error,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
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
    minHeight: 48,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  barcodeRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  barcodeHint: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    includeFontPadding: false,
    marginTop: -4,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: 6,
    minHeight: 48,
    ...Shadow.sm,
  },
  scanBtnText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 4 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 36,
  },
  catChipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
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

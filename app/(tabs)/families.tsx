import React, { useState, useCallback, useMemo } from 'react';
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
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppData } from '@/hooks/useAppData';
import { Family, FamilyAttendance, FamilyStatus } from '@/contexts/DataContext';
import { Colors, Spacing, Radii, FontSize, FontWeight, Shadow } from '@/constants/theme';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_CONFIG: Record<FamilyStatus, { label: string; color: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  ativo:     { label: 'Em Atendimento', color: Colors.primary,    icon: 'pending-actions' },
  parcial:   { label: 'Parcialmente',   color: '#E65100',          icon: 'incomplete-circle' },
  atendido:  { label: 'Atendido',       color: Colors.success,     icon: 'check-circle' },
};

const STATUS_LIST: FamilyStatus[] = ['ativo', 'parcial', 'atendido'];

const ATTENDANCE_ICONS: Record<FamilyAttendance['type'], keyof typeof MaterialIcons.glyphMap> = {
  pix:    'pix',
  supply: 'inventory',
  note:   'notes',
};

const ATTENDANCE_COLORS: Record<FamilyAttendance['type'], string> = {
  pix:    Colors.primary,
  supply: Colors.catAlimentos,
  note:   Colors.catHigiene,
};

// ─── Add/Edit Family Modal ────────────────────────────────────────────────────

interface FamilyModalProps {
  visible: boolean;
  editing?: Family | null;
  onClose: () => void;
  onSave: (data: Omit<Family, 'id' | 'registeredAt' | 'attendance'>) => void;
  onUpdate: (id: string, updates: Partial<Omit<Family, 'id' | 'registeredAt'>>) => void;
}

function FamilyModal({ visible, editing, onClose, onSave, onUpdate }: FamilyModalProps) {
  const [name, setName] = useState('');
  const [members, setMembers] = useState('1');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<FamilyStatus>('ativo');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (editing) {
      setName(editing.name);
      setMembers(String(editing.members));
      setAddress(editing.address);
      setPhone(editing.phone);
      setStatus(editing.status);
      setNotes(editing.notes);
    } else {
      setName(''); setMembers('1'); setAddress(''); setPhone(''); setStatus('ativo'); setNotes('');
    }
  }, [editing, visible]);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Nome obrigatório', 'Informe o nome da família.'); return; }
    const m = parseInt(members, 10);
    if (!m || m < 1) { Alert.alert('Membros inválido', 'Informe o número de membros.'); return; }
    if (!address.trim()) { Alert.alert('Endereço obrigatório', 'Informe o endereço temporário.'); return; }
    const payload = {
      name: name.trim(),
      members: m,
      address: address.trim(),
      phone: phone.trim() || '—',
      status,
      notes: notes.trim(),
    };
    if (editing) {
      onUpdate(editing.id, payload);
    } else {
      onSave(payload);
    }
    onClose();
  };

  const isEditing = !!editing;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={mStyles.container}>
          {/* Header */}
          <View style={mStyles.header}>
            <Text style={mStyles.headerTitle}>{isEditing ? 'Editar Família' : 'Cadastrar Família'}</Text>
            <Pressable onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={mStyles.body} keyboardShouldPersistTaps="handled">
            {/* Name */}
            <Text style={mStyles.label}>Nome da família *</Text>
            <View style={mStyles.input}>
              <TextInput
                style={mStyles.inputText}
                placeholder="Ex: Família Silva, Maria da Conceição..."
                placeholderTextColor={Colors.textSubtle}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Members */}
            <Text style={mStyles.label}>Número de membros *</Text>
            <View style={mStyles.input}>
              <TextInput
                style={mStyles.inputText}
                placeholder="4"
                placeholderTextColor={Colors.textSubtle}
                value={members}
                onChangeText={setMembers}
                keyboardType="number-pad"
              />
            </View>

            {/* Address */}
            <Text style={mStyles.label}>Endereço temporário *</Text>
            <View style={[mStyles.input, { minHeight: 72, alignItems: 'flex-start', paddingTop: 12 }]}>
              <TextInput
                style={[mStyles.inputText, { textAlignVertical: 'top' }]}
                placeholder="R. das Flores, 12 — Bairro, Cidade"
                placeholderTextColor={Colors.textSubtle}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Phone */}
            <Text style={mStyles.label}>Telefone de contato</Text>
            <View style={mStyles.input}>
              <TextInput
                style={mStyles.inputText}
                placeholder="(83) 99999-9999"
                placeholderTextColor={Colors.textSubtle}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Status */}
            <Text style={mStyles.label}>Status de atendimento</Text>
            <View style={mStyles.statusRow}>
              {STATUS_LIST.map((s) => {
                const cfg = STATUS_CONFIG[s];
                const isSelected = status === s;
                return (
                  <Pressable
                    key={s}
                    style={[mStyles.statusChip, isSelected && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                    onPress={() => setStatus(s)}
                  >
                    <MaterialIcons name={cfg.icon} size={14} color={isSelected ? '#fff' : cfg.color} />
                    <Text style={[mStyles.statusChipText, { color: isSelected ? '#fff' : Colors.textSecondary }]}>
                      {cfg.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Notes */}
            <Text style={mStyles.label}>Observações</Text>
            <View style={[mStyles.input, { minHeight: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
              <TextInput
                style={[mStyles.inputText, { textAlignVertical: 'top' }]}
                placeholder="Necessidades específicas, informações importantes..."
                placeholderTextColor={Colors.textSubtle}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={mStyles.footer}>
            <Pressable
              style={({ pressed }) => [mStyles.saveBtn, pressed && { opacity: 0.85 }]}
              onPress={handleSave}
            >
              <MaterialIcons name={isEditing ? 'save' : 'person-add'} size={20} color="#fff" />
              <Text style={mStyles.saveBtnText}>{isEditing ? 'Salvar Alterações' : 'Cadastrar Família'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Add Attendance Modal ─────────────────────────────────────────────────────

interface AttendanceModalProps {
  visible: boolean;
  family: Family | null;
  onClose: () => void;
  onSave: (familyId: string, entry: Omit<FamilyAttendance, 'id' | 'date'>) => void;
}

function AttendanceModal({ visible, family, onClose, onSave }: AttendanceModalProps) {
  const [type, setType] = useState<FamilyAttendance['type']>('supply');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');

  React.useEffect(() => {
    if (visible) { setType('supply'); setDescription(''); setValue(''); }
  }, [visible]);

  const handleSave = () => {
    if (!description.trim()) { Alert.alert('Descrição obrigatória', 'Descreva o atendimento realizado.'); return; }
    const entry: Omit<FamilyAttendance, 'id' | 'date'> = {
      type,
      description: description.trim(),
      ...(type === 'pix' && value ? { value: parseFloat(value.replace(',', '.')) } : {}),
    };
    onSave(family!.id, entry);
    onClose();
  };

  const typeOptions: { key: FamilyAttendance['type']; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { key: 'supply', label: 'Mantimento', icon: 'inventory' },
    { key: 'pix',    label: 'Financeiro', icon: 'pix' },
    { key: 'note',   label: 'Anotação',   icon: 'notes' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={mStyles.container}>
          <View style={mStyles.header}>
            <View>
              <Text style={mStyles.headerTitle}>Registrar Atendimento</Text>
              {family ? (
                <Text style={{ fontSize: FontSize.xs, color: Colors.textSubtle, marginTop: 2 }}>
                  {family.name}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={mStyles.body}>
            <Text style={mStyles.label}>Tipo de atendimento</Text>
            <View style={mStyles.statusRow}>
              {typeOptions.map((t) => {
                const color = ATTENDANCE_COLORS[t.key];
                const isSelected = type === t.key;
                return (
                  <Pressable
                    key={t.key}
                    style={[mStyles.statusChip, isSelected && { backgroundColor: color, borderColor: color }]}
                    onPress={() => setType(t.key)}
                  >
                    <MaterialIcons name={t.icon} size={14} color={isSelected ? '#fff' : color} />
                    <Text style={[mStyles.statusChipText, { color: isSelected ? '#fff' : Colors.textSecondary }]}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {type === 'pix' ? (
              <>
                <Text style={mStyles.label}>Valor (R$)</Text>
                <View style={mStyles.input}>
                  <TextInput
                    style={[mStyles.inputText, { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.success }]}
                    placeholder="0,00"
                    placeholderTextColor={Colors.textSubtle}
                    value={value}
                    onChangeText={setValue}
                    keyboardType="decimal-pad"
                  />
                </View>
              </>
            ) : null}

            <Text style={mStyles.label}>Descrição *</Text>
            <View style={[mStyles.input, { minHeight: 88, alignItems: 'flex-start', paddingTop: 12 }]}>
              <TextInput
                style={[mStyles.inputText, { textAlignVertical: 'top' }]}
                placeholder={
                  type === 'supply' ? 'Ex: Arroz 5kg + Feijão + Sabonetes...' :
                  type === 'pix'    ? 'Ex: Auxílio moradia, ajuda de custo...' :
                                      'Observação ou anotação sobre a família...'
                }
                placeholderTextColor={Colors.textSubtle}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={mStyles.footer}>
            <Pressable
              style={({ pressed }) => [mStyles.saveBtn, pressed && { opacity: 0.85 }]}
              onPress={handleSave}
            >
              <MaterialIcons name="add-task" size={20} color="#fff" />
              <Text style={mStyles.saveBtnText}>Registrar Atendimento</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Family Detail Sheet ──────────────────────────────────────────────────────

interface FamilyDetailProps {
  family: Family;
  onClose: () => void;
  onEdit: () => void;
  onAddAttendance: () => void;
  onDeleteAttendance: (entryId: string) => void;
  onDelete: () => void;
}

function FamilyDetail({ family, onClose, onEdit, onAddAttendance, onDeleteAttendance, onDelete }: FamilyDetailProps) {
  const insets = useSafeAreaInsets();
  const status = STATUS_CONFIG[family.status];
  const totalPix = family.attendance
    .filter((a) => a.type === 'pix' && a.value)
    .reduce((s, a) => s + (a.value ?? 0), 0);

  return (
    <View style={[detailStyles.container, { paddingBottom: insets.bottom + Spacing.md }]}>
      {/* Header */}
      <View style={[detailStyles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={onClose} style={detailStyles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={detailStyles.headerTitle} numberOfLines={1}>{family.name}</Text>
        <Pressable onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="edit" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={detailStyles.body}>
        {/* Info card */}
        <View style={detailStyles.infoCard}>
          <View style={detailStyles.infoRow}>
            <View style={detailStyles.avatarCircle}>
              <MaterialIcons name="family-restroom" size={32} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={detailStyles.familyName}>{family.name}</Text>
              <Text style={detailStyles.registeredDate}>Cadastro: {formatDate(family.registeredAt)}</Text>
              <View style={[detailStyles.statusBadge, { backgroundColor: status.color + '18', borderColor: status.color + '40' }]}>
                <MaterialIcons name={status.icon} size={12} color={status.color} />
                <Text style={[detailStyles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
          </View>

          <View style={detailStyles.detailGrid}>
            <View style={detailStyles.detailItem}>
              <MaterialIcons name="people" size={16} color={Colors.primary} />
              <View>
                <Text style={detailStyles.detailValue}>{family.members}</Text>
                <Text style={detailStyles.detailLabel}>membros</Text>
              </View>
            </View>
            <View style={detailStyles.detailDivider} />
            <View style={detailStyles.detailItem}>
              <MaterialIcons name="pix" size={16} color={Colors.success} />
              <View>
                <Text style={[detailStyles.detailValue, { color: Colors.success }]}>{formatCurrency(totalPix)}</Text>
                <Text style={detailStyles.detailLabel}>recebido</Text>
              </View>
            </View>
            <View style={detailStyles.detailDivider} />
            <View style={detailStyles.detailItem}>
              <MaterialIcons name="history" size={16} color={Colors.catAlimentos} />
              <View>
                <Text style={detailStyles.detailValue}>{family.attendance.length}</Text>
                <Text style={detailStyles.detailLabel}>registros</Text>
              </View>
            </View>
          </View>

          <View style={detailStyles.addressRow}>
            <MaterialIcons name="location-on" size={14} color={Colors.primary} />
            <Text style={detailStyles.addressText}>{family.address}</Text>
          </View>
          {family.phone !== '—' ? (
            <View style={detailStyles.addressRow}>
              <MaterialIcons name="phone" size={14} color={Colors.primary} />
              <Text style={detailStyles.addressText}>{family.phone}</Text>
            </View>
          ) : null}
          {family.notes ? (
            <View style={detailStyles.notesBox}>
              <MaterialIcons name="notes" size={14} color={Colors.textSubtle} />
              <Text style={detailStyles.notesText}>{family.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Attendance history */}
        <View style={detailStyles.section}>
          <View style={detailStyles.sectionHeader}>
            <MaterialIcons name="history" size={16} color={Colors.primary} />
            <Text style={detailStyles.sectionTitle}>Histórico de Atendimento</Text>
            <Pressable
              style={({ pressed }) => [detailStyles.addEntryBtn, pressed && { opacity: 0.8 }]}
              onPress={onAddAttendance}
            >
              <MaterialIcons name="add" size={16} color="#fff" />
              <Text style={detailStyles.addEntryText}>Registrar</Text>
            </Pressable>
          </View>

          {family.attendance.length === 0 ? (
            <View style={detailStyles.emptyHistory}>
              <MaterialIcons name="pending-actions" size={32} color={Colors.textSubtle} />
              <Text style={detailStyles.emptyHistoryText}>Nenhum atendimento registrado</Text>
            </View>
          ) : (
            family.attendance.map((entry, idx) => {
              const color = ATTENDANCE_COLORS[entry.type];
              const icon = ATTENDANCE_ICONS[entry.type];
              return (
                <View
                  key={entry.id}
                  style={[detailStyles.entryRow, idx < family.attendance.length - 1 && detailStyles.entryBorder]}
                >
                  <View style={[detailStyles.entryIcon, { backgroundColor: color + '18' }]}>
                    <MaterialIcons name={icon} size={16} color={color} />
                  </View>
                  <View style={detailStyles.entryMeta}>
                    <Text style={detailStyles.entryDesc} numberOfLines={2}>{entry.description}</Text>
                    {entry.value ? (
                      <Text style={[detailStyles.entryValue, { color: Colors.success }]}>{formatCurrency(entry.value)}</Text>
                    ) : null}
                    <Text style={detailStyles.entryDate}>{formatDateTime(entry.date)}</Text>
                  </View>
                  <Pressable
                    onPress={() => onDeleteAttendance(entry.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
                  </Pressable>
                </View>
              );
            })
          )}
        </View>

        {/* Delete family */}
        <Pressable
          style={({ pressed }) => [detailStyles.deleteBtn, pressed && { opacity: 0.8 }]}
          onPress={onDelete}
        >
          <MaterialIcons name="delete" size={16} color={Colors.error} />
          <Text style={detailStyles.deleteBtnText}>Remover família</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function FamiliesScreen() {
  const insets = useSafeAreaInsets();
  const { families, addFamily, updateFamily, removeFamily, addFamilyAttendance, removeFamilyAttendance } = useAppData();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [detailFamily, setDetailFamily] = useState<Family | null>(null);
  const [attendanceFamily, setAttendanceFamily] = useState<Family | null>(null);
  const [filterStatus, setFilterStatus] = useState<FamilyStatus | 'todos'>('todos');
  const [search, setSearch] = useState('');

  // Keep detailFamily in sync when families state updates
  const currentDetail = useMemo(
    () => (detailFamily ? families.find((f) => f.id === detailFamily.id) ?? null : null),
    [families, detailFamily]
  );

  const filtered = useMemo(() => {
    return families.filter((f) => {
      const matchStatus = filterStatus === 'todos' || f.status === filterStatus;
      const matchSearch = !search.trim() || f.name.toLowerCase().includes(search.toLowerCase()) || f.address.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [families, filterStatus, search]);

  const handleDeleteFamily = (family: Family) => {
    Alert.alert(
      'Remover família',
      `Remover "${family.name}" e todo o histórico de atendimento?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            removeFamily(family.id);
            setDetailFamily(null);
          },
        },
      ]
    );
  };

  const handleDeleteAttendance = (familyId: string, entryId: string) => {
    Alert.alert('Remover registro', 'Remover este registro do histórico?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeFamilyAttendance(familyId, entryId) },
    ]);
  };

  const statusFilters: { key: FamilyStatus | 'todos'; label: string; color: string }[] = [
    { key: 'todos',    label: `Todas (${families.length})`, color: Colors.primary },
    { key: 'ativo',    label: 'Em Atendimento',             color: Colors.primary },
    { key: 'parcial',  label: 'Parcialmente',               color: '#E65100' },
    { key: 'atendido', label: 'Atendidos',                  color: Colors.success },
  ];

  const renderFamily = useCallback(({ item }: { item: Family }) => {
    const status = STATUS_CONFIG[item.status];
    const totalPix = item.attendance.filter((a) => a.type === 'pix').reduce((s, a) => s + (a.value ?? 0), 0);
    return (
      <Pressable
        style={({ pressed }) => [styles.familyCard, pressed && { opacity: 0.9 }]}
        onPress={() => setDetailFamily(item)}
      >
        <View style={[styles.familyCardBorder, { backgroundColor: status.color }]} />
        <View style={styles.familyCardInner}>
          <View style={styles.familyCardTop}>
            <View style={[styles.familyAvatar, { backgroundColor: status.color + '22' }]}>
              <MaterialIcons name="family-restroom" size={22} color={status.color} />
            </View>
            <View style={styles.familyMeta}>
              <Text style={styles.familyName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.familyAddress} numberOfLines={1}>{item.address}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '18' }]}>
              <MaterialIcons name={status.icon} size={12} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <View style={styles.familyCardStats}>
            <View style={styles.familyStatItem}>
              <MaterialIcons name="people" size={13} color={Colors.textSubtle} />
              <Text style={styles.familyStatText}>{item.members} membros</Text>
            </View>
            <View style={styles.familyStatItem}>
              <MaterialIcons name="history" size={13} color={Colors.textSubtle} />
              <Text style={styles.familyStatText}>{item.attendance.length} registros</Text>
            </View>
            {totalPix > 0 ? (
              <View style={styles.familyStatItem}>
                <MaterialIcons name="pix" size={13} color={Colors.success} />
                <Text style={[styles.familyStatText, { color: Colors.success }]}>{formatCurrency(totalPix)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  }, []);

  // Show detail view if selected
  if (currentDetail) {
    return (
      <>
        <FamilyDetail
          family={currentDetail}
          onClose={() => setDetailFamily(null)}
          onEdit={() => { setEditingFamily(currentDetail); setModalVisible(true); }}
          onAddAttendance={() => setAttendanceFamily(currentDetail)}
          onDeleteAttendance={(entryId) => handleDeleteAttendance(currentDetail.id, entryId)}
          onDelete={() => handleDeleteFamily(currentDetail)}
        />
        <FamilyModal
          visible={modalVisible}
          editing={editingFamily}
          onClose={() => { setModalVisible(false); setEditingFamily(null); }}
          onSave={addFamily}
          onUpdate={updateFamily}
        />
        <AttendanceModal
          visible={!!attendanceFamily}
          family={attendanceFamily}
          onClose={() => setAttendanceFamily(null)}
          onSave={addFamilyAttendance}
        />
      </>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Famílias</Text>
            <Text style={styles.headerSub}>{families.length} cadastradas</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
            onPress={() => { setEditingFamily(null); setModalVisible(true); }}
          >
            <MaterialIcons name="person-add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Cadastrar</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={18} color={Colors.textSubtle} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou endereço..."
            placeholderTextColor={Colors.textSubtle}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={16} color={Colors.textSubtle} />
            </Pressable>
          ) : null}
        </View>

        {/* Status filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {statusFilters.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.filterChip, filterStatus === f.key && { backgroundColor: f.color, borderColor: f.color }]}
              onPress={() => setFilterStatus(f.key)}
            >
              <Text style={[styles.filterChipText, filterStatus === f.key && { color: '#fff' }]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        {[
          { label: 'Em Atendimento', value: families.filter((f) => f.status === 'ativo').length, color: Colors.primary },
          { label: 'Parcialmente', value: families.filter((f) => f.status === 'parcial').length, color: '#E65100' },
          { label: 'Atendidos', value: families.filter((f) => f.status === 'atendido').length, color: Colors.success },
        ].map((s) => (
          <View key={s.label} style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderFamily}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="family-restroom" size={52} color={Colors.textSubtle} />
            <Text style={styles.emptyTitle}>
              {search ? 'Nenhuma família encontrada' : 'Nenhuma família cadastrada'}
            </Text>
            <Text style={styles.emptyDesc}>
              {search
                ? 'Tente buscar por outro nome ou endereço.'
                : 'Toque em "Cadastrar" para adicionar a primeira família desabrigada.'}
            </Text>
          </View>
        }
      />

      <FamilyModal
        visible={modalVisible}
        editing={editingFamily}
        onClose={() => { setModalVisible(false); setEditingFamily(null); }}
        onSave={addFamily}
        onUpdate={updateFamily}
      />
    </View>
  );
}

// ─── Detail Styles ────────────────────────────────────────────────────────────
const detailStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  body: { padding: Spacing.md, gap: Spacing.md },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  familyName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  registeredDate: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    includeFontPadding: false,
    marginTop: 3,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, includeFontPadding: false },
  detailGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceTinted,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  detailDivider: { width: 1, backgroundColor: Colors.border },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  detailLabel: { fontSize: FontSize.xs, color: Colors.textSubtle, includeFontPadding: false },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginBottom: 5 },
  addressText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1, includeFontPadding: false },
  notesBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginTop: 4,
  },
  notesText: { fontSize: FontSize.sm, color: Colors.textSubtle, flex: 1, lineHeight: 20 },
  section: {
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
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  addEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    gap: 3,
    minHeight: 32,
  },
  addEntryText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#fff', includeFontPadding: false },
  emptyHistory: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  emptyHistoryText: { fontSize: FontSize.sm, color: Colors.textSubtle, includeFontPadding: false },
  entryRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: Spacing.sm },
  entryBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  entryIcon: { width: 34, height: 34, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  entryMeta: { flex: 1, minWidth: 0 },
  entryDesc: { fontSize: FontSize.sm, color: Colors.textPrimary, includeFontPadding: false },
  entryValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, includeFontPadding: false, marginTop: 2 },
  entryDate: { fontSize: 10, color: Colors.textSubtle, includeFontPadding: false, marginTop: 3 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radii.full,
    paddingVertical: 12,
    gap: Spacing.sm,
    minHeight: 48,
  },
  deleteBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.error, includeFontPadding: false },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const mStyles = StyleSheet.create({
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
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
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
  inputText: { fontSize: FontSize.md, color: Colors.textPrimary, includeFontPadding: false },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 4 },
  statusChip: {
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
  statusChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, includeFontPadding: false },
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
  saveBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold, includeFontPadding: false },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
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
  headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, includeFontPadding: false },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSubtle, includeFontPadding: false, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 5,
    minHeight: 44,
    ...Shadow.sm,
  },
  addBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#fff', includeFontPadding: false },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, includeFontPadding: false },
  filterContent: { paddingBottom: Spacing.sm, gap: Spacing.sm, flexDirection: 'row', alignItems: 'center' },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 34,
    justifyContent: 'center',
  },
  filterChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSubtle, includeFontPadding: false },

  summaryRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, includeFontPadding: false },
  summaryLabel: { fontSize: 10, color: Colors.textSubtle, includeFontPadding: false, textAlign: 'center' },

  listContent: { padding: Spacing.md, gap: Spacing.sm },
  familyCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  familyCardBorder: { width: 4 },
  familyCardInner: { flex: 1, padding: Spacing.md },
  familyCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  familyAvatar: { width: 44, height: 44, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  familyMeta: { flex: 1, minWidth: 0 },
  familyName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  familyAddress: { fontSize: FontSize.xs, color: Colors.textSubtle, includeFontPadding: false, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  statusText: { fontSize: 10, fontWeight: FontWeight.semibold, includeFontPadding: false },
  familyCardStats: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  familyStatItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  familyStatText: { fontSize: FontSize.xs, color: Colors.textSubtle, includeFontPadding: false },

  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textSecondary, includeFontPadding: false },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.textSubtle, textAlign: 'center', lineHeight: 20, includeFontPadding: false },
});

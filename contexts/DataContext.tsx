import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SupplyCategory = 'alimentos' | 'higiene' | 'roupas' | 'medicamentos' | 'outros';

export interface SupplyItem {
  id: string;
  name: string;
  category: SupplyCategory;
  quantity: number;
  unit: string;
  barcode?: string;
  date: string;
}

export interface PixTransaction {
  id: string;
  amount: number;
  sender: string;
  description: string;
  date: string;
}

export type FamilyStatus = 'ativo' | 'parcial' | 'atendido';

export interface FamilyAttendance {
  id: string;
  date: string;
  type: 'pix' | 'supply' | 'note';
  description: string;
  value?: number;       // for pix
  supplyId?: string;    // for supply
  quantity?: number;    // for supply
  unit?: string;
}

export interface Family {
  id: string;
  name: string;
  members: number;
  address: string;
  phone: string;
  status: FamilyStatus;
  registeredAt: string;
  notes: string;
  attendance: FamilyAttendance[];
}

export interface AppData {
  supplies: SupplyItem[];
  pixTransactions: PixTransaction[];
  familiesAttended: number;
  families: Family[];
}

export interface DataContextType extends AppData {
  isLoading: boolean;
  // Supplies
  addSupply: (item: Omit<SupplyItem, 'id' | 'date'>) => void;
  removeSupply: (id: string) => void;
  updateSupplyQty: (id: string, quantity: number) => void;
  // Pix
  addPixTransaction: (tx: Omit<PixTransaction, 'id' | 'date'>) => void;
  removePixTransaction: (id: string) => void;
  // Legacy counter
  setFamiliesAttended: (count: number) => void;
  // Families
  addFamily: (family: Omit<Family, 'id' | 'registeredAt' | 'attendance'>) => void;
  updateFamily: (id: string, updates: Partial<Omit<Family, 'id' | 'registeredAt'>>) => void;
  removeFamily: (id: string) => void;
  addFamilyAttendance: (familyId: string, entry: Omit<FamilyAttendance, 'id' | 'date'>) => void;
  removeFamilyAttendance: (familyId: string, attendanceId: string) => void;
  // Derived
  totalPix: number;
  supplySummary: { category: SupplyCategory; total: number }[];
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = '@sosjampa_data_v2';

const INITIAL_DATA: AppData = {
  familiesAttended: 47,
  families: [
    {
      id: 'f1',
      name: 'Família Silva',
      members: 4,
      address: 'R. das Flores, 12 — Ernesto Geisel',
      phone: '(83) 99876-5432',
      status: 'ativo',
      registeredAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      notes: 'Crianças pequenas, precisam de fraldas',
      attendance: [
        {
          id: 'a1',
          date: new Date(Date.now() - 86400000 * 4).toISOString(),
          type: 'supply',
          description: 'Arroz 5kg + Feijão 1kg',
          quantity: 2,
          unit: 'pct',
        },
        {
          id: 'a2',
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          type: 'pix',
          description: 'Ajuda de custo',
          value: 150,
        },
      ],
    },
    {
      id: 'f2',
      name: 'Família Oliveira',
      members: 6,
      address: 'Av. Dom Pedro II, 300 — Cruz das Armas',
      phone: '(83) 98765-4321',
      status: 'parcial',
      registeredAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      notes: 'Idosa no grupo, precisa de medicamentos',
      attendance: [
        {
          id: 'a3',
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          type: 'supply',
          description: 'Dipirona + Sabonetes',
          quantity: 3,
          unit: 'un',
        },
      ],
    },
    {
      id: 'f3',
      name: 'Família Santos',
      members: 3,
      address: 'R. da Paz, 88 — Mandacaru',
      phone: '—',
      status: 'atendido',
      registeredAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      notes: '',
      attendance: [
        {
          id: 'a4',
          date: new Date(Date.now() - 86400000 * 6).toISOString(),
          type: 'supply',
          description: 'Cesta básica completa',
          quantity: 1,
          unit: 'cesta',
        },
        {
          id: 'a5',
          date: new Date(Date.now() - 86400000 * 1).toISOString(),
          type: 'pix',
          description: 'Auxílio moradia',
          value: 200,
        },
        {
          id: 'a6',
          date: new Date().toISOString(),
          type: 'note',
          description: 'Família conseguiu abrigo temporário',
        },
      ],
    },
  ],
  supplies: [
    { id: 's1', name: 'Arroz (5kg)', category: 'alimentos', quantity: 120, unit: 'pct', barcode: '7896006750001', date: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 's2', name: 'Feijão Carioca (1kg)', category: 'alimentos', quantity: 85, unit: 'pct', barcode: '7896006751001', date: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 's3', name: 'Sabonete Dove', category: 'higiene', quantity: 200, unit: 'un', barcode: '7891150010836', date: new Date(Date.now() - 86400000).toISOString() },
    { id: 's4', name: 'Fralda Pampers M', category: 'higiene', quantity: 40, unit: 'pct', barcode: '7500435131155', date: new Date(Date.now() - 86400000).toISOString() },
    { id: 's5', name: 'Camiseta adulto P/M', category: 'roupas', quantity: 60, unit: 'un', date: new Date(Date.now() - 3600000 * 5).toISOString() },
    { id: 's6', name: 'Dipirona 500mg', category: 'medicamentos', quantity: 30, unit: 'cx', barcode: '7896045506011', date: new Date(Date.now() - 3600000 * 3).toISOString() },
    { id: 's7', name: 'Óleo de soja (900ml)', category: 'alimentos', quantity: 55, unit: 'un', barcode: '7896036090337', date: new Date().toISOString() },
  ],
  pixTransactions: [
    { id: 'p1', amount: 500, sender: 'João Silva', description: 'Ajuda às famílias', date: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 'p2', amount: 1200, sender: 'Empresa ABC Ltda', description: 'Doação corporativa', date: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'p3', amount: 150, sender: 'Maria Oliveira', description: 'Para os desabrigados', date: new Date(Date.now() - 86400000).toISOString() },
    { id: 'p4', amount: 300, sender: 'Carlos Mendes', description: 'Força JP!', date: new Date(Date.now() - 3600000 * 8).toISOString() },
    { id: 'p5', amount: 80, sender: 'Ana Paula R.', description: '', date: new Date(Date.now() - 3600000 * 2).toISOString() },
  ],
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function calcSupplySummary(supplies: SupplyItem[]) {
  const map: Record<string, number> = {};
  for (const s of supplies) {
    map[s.category] = (map[s.category] || 0) + s.quantity;
  }
  return (Object.entries(map) as [SupplyCategory, number][]).map(([category, total]) => ({
    category,
    total,
  }));
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AppData;
          // Ensure families array exists for older stored data
          setData({ ...INITIAL_DATA, ...parsed, families: parsed.families ?? INITIAL_DATA.families });
        }
      } catch (_) {
        // use initial data
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (newData: AppData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (_) {}
  }, []);

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, [persist]);

  // ── Supplies ────────────────────────────────────────────────────────────────

  const addSupply = useCallback((item: Omit<SupplyItem, 'id' | 'date'>) => {
    update((prev) => {
      if (item.barcode) {
        const existingIdx = prev.supplies.findIndex((s) => s.barcode === item.barcode);
        if (existingIdx !== -1) {
          const updated = [...prev.supplies];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + item.quantity,
            date: new Date().toISOString(),
          };
          return { ...prev, supplies: updated };
        }
      }
      return {
        ...prev,
        supplies: [{ ...item, id: generateId(), date: new Date().toISOString() }, ...prev.supplies],
      };
    });
  }, [update]);

  const removeSupply = useCallback((id: string) => {
    update((prev) => ({ ...prev, supplies: prev.supplies.filter((s) => s.id !== id) }));
  }, [update]);

  const updateSupplyQty = useCallback((id: string, quantity: number) => {
    update((prev) => ({
      ...prev,
      supplies: prev.supplies.map((s) => (s.id === id ? { ...s, quantity } : s)),
    }));
  }, [update]);

  // ── Pix ─────────────────────────────────────────────────────────────────────

  const addPixTransaction = useCallback((tx: Omit<PixTransaction, 'id' | 'date'>) => {
    update((prev) => ({
      ...prev,
      pixTransactions: [{ ...tx, id: generateId(), date: new Date().toISOString() }, ...prev.pixTransactions],
    }));
  }, [update]);

  const removePixTransaction = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      pixTransactions: prev.pixTransactions.filter((p) => p.id !== id),
    }));
  }, [update]);

  const setFamiliesAttended = useCallback((count: number) => {
    update((prev) => ({ ...prev, familiesAttended: count }));
  }, [update]);

  // ── Families ────────────────────────────────────────────────────────────────

  const addFamily = useCallback((family: Omit<Family, 'id' | 'registeredAt' | 'attendance'>) => {
    update((prev) => ({
      ...prev,
      familiesAttended: prev.familiesAttended + 1,
      families: [
        {
          ...family,
          id: generateId(),
          registeredAt: new Date().toISOString(),
          attendance: [],
        },
        ...prev.families,
      ],
    }));
  }, [update]);

  const updateFamily = useCallback((id: string, updates: Partial<Omit<Family, 'id' | 'registeredAt'>>) => {
    update((prev) => ({
      ...prev,
      families: prev.families.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  }, [update]);

  const removeFamily = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      familiesAttended: Math.max(0, prev.familiesAttended - 1),
      families: prev.families.filter((f) => f.id !== id),
    }));
  }, [update]);

  const addFamilyAttendance = useCallback((familyId: string, entry: Omit<FamilyAttendance, 'id' | 'date'>) => {
    update((prev) => ({
      ...prev,
      families: prev.families.map((f) =>
        f.id === familyId
          ? {
              ...f,
              attendance: [
                { ...entry, id: generateId(), date: new Date().toISOString() },
                ...f.attendance,
              ],
            }
          : f
      ),
    }));
  }, [update]);

  const removeFamilyAttendance = useCallback((familyId: string, attendanceId: string) => {
    update((prev) => ({
      ...prev,
      families: prev.families.map((f) =>
        f.id === familyId
          ? { ...f, attendance: f.attendance.filter((a) => a.id !== attendanceId) }
          : f
      ),
    }));
  }, [update]);

  const totalPix = data.pixTransactions.reduce((sum, t) => sum + t.amount, 0);
  const supplySummary = calcSupplySummary(data.supplies);

  return (
    <DataContext.Provider
      value={{
        ...data,
        isLoading,
        addSupply,
        removeSupply,
        updateSupplyQty,
        addPixTransaction,
        removePixTransaction,
        setFamiliesAttended,
        addFamily,
        updateFamily,
        removeFamily,
        addFamilyAttendance,
        removeFamilyAttendance,
        totalPix,
        supplySummary,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

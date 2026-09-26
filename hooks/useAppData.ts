import { useContext } from 'react';
import { DataContext, DataContextType } from '@/contexts/DataContext';

export function useAppData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) throw new Error('useAppData must be used within DataProvider');
  return context;
}

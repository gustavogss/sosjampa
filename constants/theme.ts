// SOS Jampa — Controle de Recursos e Ajuda a Desabrigados
// Paleta: Preto (headers) · Vermelho escuro (cards, botões) · Branco (superfícies)
export const Colors = {
  // Brand — Vermelho escuro (urgência + determinação)
  primary: '#B71C1C',        // Vermelho escuro — cards, botões
  primaryDark: '#121212',    // Preto — headers, fundo de telas escuras
  primaryLight: '#FFCDD2',   // Vermelho claro
  primaryMid: '#C62828',     // Vermelho médio
  accent: '#D32F2F',         // Vermelho acento
  accentLight: '#FFEBEE',

  // Surface
  background: '#F7F7F7',     // Branco quente
  surface: '#FFFFFF',        // Branco puro
  surfaceElevated: '#FFFFFF',
  surfaceTinted: '#FFEBEE',  // Vermelho muito claro

  // Text
  textPrimary: '#121212',    // Preto
  textSecondary: '#333333',
  textSubtle: '#757575',
  textOnPrimary: '#FFFFFF',  // Branco sobre vermelho/preto
  textOnDark: '#FFFFFF',

  // Semantic
  success: '#2E7D32',
  successLight: '#E8F5E9',
  warning: '#F57F17',
  warningLight: '#FFF8E1',
  error: '#B71C1C',
  errorLight: '#FFEBEE',
  info: '#01579B',

  // Supply categories (pie chart)
  catAlimentos: '#2E7D32',
  catAlimentosLight: '#E8F5E9',
  catHigiene: '#00838F',
  catHigieneLight: '#E0F7FA',
  catRoupas: '#6A1B9A',
  catRoupasLight: '#F3E5F5',
  catMedicamentos: '#B71C1C',
  catMedicamentosLight: '#FFEBEE',
  catOutros: '#E65100',
  catOutrosLight: '#FFF3E0',

  // Financial
  money: '#B71C1C',
  moneyLight: '#FFEBEE',
  moneyDark: '#7F0000',

  // UI
  border: '#E0E0E0',
  divider: '#F0F0F0',
  shadow: 'rgba(0,0,0,0.15)',
  overlay: 'rgba(0,0,0,0.6)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  hero: 32,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 8,
  },
};

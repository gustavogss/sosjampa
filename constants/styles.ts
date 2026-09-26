import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radii, FontSize, FontWeight, Shadow } from './theme';

export const GlobalStyles = StyleSheet.create({
  flex1: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { justifyContent: 'center', alignItems: 'center' },

  // Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  cardElevated: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    ...Shadow.md,
  },

  // Buttons
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  primaryButtonText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },

  // Typography
  heroTitle: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  bodyText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
    lineHeight: 24,
    includeFontPadding: false,
  },
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    color: Colors.textSubtle,
    includeFontPadding: false,
  },

  // Layout
  screenPadding: {
    paddingHorizontal: Spacing.md,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.divider,
  },
});

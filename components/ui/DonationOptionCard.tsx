import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, FontSize, FontWeight, Shadow } from '@/constants/theme';

export interface DonationOption {
  id: string;
  title: string;
  description: string;
  items?: string[];
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  bgColor: string;
  ctaLabel: string;
  ctaIcon: keyof typeof MaterialIcons.glyphMap;
}

interface DonationOptionCardProps {
  option: DonationOption;
  onPress?: () => void;
}

function DonationOptionCard({ option, onPress }: DonationOptionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: option.color },
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
      ]}
      onPress={onPress}
      accessibilityLabel={option.title}
      accessibilityRole="button"
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: option.bgColor }]}>
          <MaterialIcons name={option.icon} size={26} color={option.color} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{option.title}</Text>
          <Text style={styles.desc}>{option.description}</Text>
        </View>
      </View>

      {option.items && option.items.length > 0 ? (
        <View style={styles.itemsWrap}>
          {option.items.map((item, idx) => (
            <View key={idx} style={styles.itemChip}>
              <Text style={[styles.itemText, { color: option.color }]}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        style={[styles.cta, { backgroundColor: option.color }]}
        onPress={onPress}
        accessibilityLabel={option.ctaLabel}
      >
        <MaterialIcons name={option.ctaIcon} size={16} color={Colors.textOnPrimary} />
        <Text style={styles.ctaText}>{option.ctaLabel}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    ...Shadow.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
    marginBottom: 4,
  },
  desc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    includeFontPadding: false,
  },
  itemsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  itemChip: {
    backgroundColor: Colors.background,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    includeFontPadding: false,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radii.md,
    paddingVertical: 11,
    minHeight: 44,
  },
  ctaText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textOnPrimary,
    includeFontPadding: false,
  },
});

export default memo(DonationOptionCard);

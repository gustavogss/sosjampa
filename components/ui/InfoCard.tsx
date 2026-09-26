import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, FontSize, FontWeight, Shadow } from '@/constants/theme';

export interface InfoItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

interface InfoCardProps {
  item: InfoItem;
}

function InfoCard({ item }: InfoCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.9 },
      ]}
      onPress={() => setExpanded((prev) => !prev)}
      accessibilityLabel={item.title}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: item.color + '22' }]}>
          <MaterialIcons name={item.icon} size={22} color={item.color} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.summary}>{item.summary}</Text>
        </View>
        <MaterialIcons
          name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={22}
          color={Colors.textSubtle}
        />
      </View>

      {expanded ? (
        <View style={styles.content}>
          <View style={styles.divider} />
          <Text style={styles.contentText}>{item.content}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
    marginBottom: 2,
  },
  summary: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    includeFontPadding: false,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  content: {},
  contentText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    includeFontPadding: false,
  },
});

export default memo(InfoCard);

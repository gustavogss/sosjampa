import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, FontSize, FontWeight, Shadow } from '@/constants/theme';

export interface Campaign {
  id: string;
  title: string;
  location: string;
  description: string;
  goal: number;
  raised: number;
  families: number;
  urgent: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  bgColor: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  onPress?: () => void;
}

function CampaignCard({ campaign, onPress }: CampaignCardProps) {
  const progress = Math.min(campaign.raised / campaign.goal, 1);
  const percent = Math.round(progress * 100);
  const remaining = campaign.goal - campaign.raised;

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
    return `R$ ${value}`;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.93, transform: [{ scale: 0.985 }] },
      ]}
      onPress={onPress}
      accessibilityLabel={campaign.title}
      accessibilityRole="button"
    >
      {/* Colored accent top strip */}
      <View style={[styles.accentStrip, { backgroundColor: campaign.color }]} />

      {/* Card body */}
      <View style={styles.body}>

        {/* Header: icon + title + urgent */}
        <View style={styles.headerRow}>
          <View style={[styles.iconCircle, { backgroundColor: campaign.bgColor }]}>
            <MaterialIcons name={campaign.icon} size={26} color={campaign.color} />
          </View>

          <View style={styles.headerMeta}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>{campaign.title}</Text>
            </View>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={11} color={Colors.textSubtle} />
              <Text style={styles.location} numberOfLines={1}>{campaign.location}</Text>
            </View>
          </View>

          {campaign.urgent ? (
            <View style={styles.urgentBadge}>
              <MaterialIcons name="priority-high" size={10} color="#fff" />
              <Text style={styles.urgentText}>URGENTE</Text>
            </View>
          ) : null}
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>{campaign.description}</Text>

        {/* Progress section */}
        <View style={styles.progressSection}>
          {/* Labels row */}
          <View style={styles.progressTopRow}>
            <Text style={styles.raisedLabel}>
              <Text style={[styles.raisedAmount, { color: campaign.color }]}>
                {formatCurrency(campaign.raised)}
              </Text>
              {'  '}
              <Text style={styles.goalAmount}>/ {formatCurrency(campaign.goal)}</Text>
            </Text>
            <View style={[styles.percentPill, { backgroundColor: campaign.bgColor }]}>
              <Text style={[styles.percentValue, { color: campaign.color }]}>{percent}%</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percent}%` as any,
                  backgroundColor: campaign.color,
                },
              ]}
            />
          </View>

          {/* Remaining */}
          <Text style={styles.remainingText}>
            Faltam {formatCurrency(remaining)} para a meta
          </Text>
        </View>

        {/* Stats + CTA footer */}
        <View style={styles.footer}>
          {/* Family stat */}
          <View style={styles.familyStat}>
            <View style={[styles.familyIconWrap, { backgroundColor: campaign.bgColor }]}>
              <MaterialIcons name="people" size={14} color={campaign.color} />
            </View>
            <View>
              <Text style={[styles.familyCount, { color: campaign.color }]}>
                {campaign.families}
              </Text>
              <Text style={styles.familyLabel}>famílias</Text>
            </View>
          </View>

          {/* Apoiar button */}
          <Pressable
            style={({ pressed }) => [
              styles.donateBtn,
              { backgroundColor: campaign.color },
              pressed && { opacity: 0.85 },
            ]}
            onPress={onPress}
            accessibilityLabel={`Apoiar ${campaign.title}`}
          >
            <MaterialIcons name="volunteer-activism" size={16} color="#fff" />
            <Text style={styles.donateBtnText}>Apoiar</Text>
            <MaterialIcons name="arrow-forward" size={14} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadow.md,
  },
  accentStrip: {
    height: 4,
    width: '100%',
  },
  body: {
    padding: Spacing.md,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    marginBottom: 3,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
    lineHeight: 21,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  location: {
    fontSize: 11,
    color: Colors.textSubtle,
    includeFontPadding: false,
    flex: 1,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.error,
    borderRadius: Radii.sm,
    paddingHorizontal: 7,
    paddingVertical: 4,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  urgentText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: '#fff',
    letterSpacing: 0.4,
    includeFontPadding: false,
  },

  // Description
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
    includeFontPadding: false,
  },

  // Progress
  progressSection: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    padding: Spacing.sm,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  raisedLabel: {
    includeFontPadding: false,
  },
  raisedAmount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    includeFontPadding: false,
  },
  goalAmount: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    fontWeight: FontWeight.regular,
    includeFontPadding: false,
  },
  percentPill: {
    borderRadius: Radii.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  percentValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    includeFontPadding: false,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.divider,
    borderRadius: Radii.full,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radii.full,
  },
  remainingText: {
    fontSize: 11,
    color: Colors.textSubtle,
    includeFontPadding: false,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  familyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  familyIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyCount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    includeFontPadding: false,
    lineHeight: 18,
  },
  familyLabel: {
    fontSize: 11,
    color: Colors.textSubtle,
    includeFontPadding: false,
  },
  donateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    minHeight: 44,
    ...Shadow.sm,
  },
  donateBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#fff',
    includeFontPadding: false,
  },
});

export default memo(CampaignCard);

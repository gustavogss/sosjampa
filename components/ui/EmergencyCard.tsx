import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, FontSize, FontWeight, Shadow } from '@/constants/theme';

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  bgColor: string;
  priority?: boolean;
}

interface EmergencyCardProps {
  contact: EmergencyContact;
}

function EmergencyCard({ contact }: EmergencyCardProps) {
  const handleCall = () => {
    const phoneUrl = `tel:${contact.number}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert(
            'Ligar',
            `Ligue agora para ${contact.name}: ${contact.number}`,
            [{ text: 'OK' }]
          );
        }
      })
      .catch(() => {
        Alert.alert('Número', `${contact.name}: ${contact.number}`);
      });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        contact.priority && styles.cardPriority,
        pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
      ]}
      onPress={handleCall}
      accessibilityLabel={`Ligar para ${contact.name}, número ${contact.number}`}
      accessibilityRole="button"
    >
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: contact.bgColor }]}>
        <MaterialIcons name={contact.icon} size={28} color={contact.color} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.desc}>{contact.description}</Text>
      </View>

      {/* Number + CTA */}
      <View style={styles.right}>
        <View style={[styles.numberBadge, { backgroundColor: contact.color }]}>
          <Text style={styles.number}>{contact.number}</Text>
        </View>
        <MaterialIcons name="phone" size={16} color={contact.color} style={styles.phoneIcon} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  cardPriority: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
    marginBottom: 2,
  },
  desc: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    includeFontPadding: false,
    lineHeight: 16,
  },
  right: {
    alignItems: 'center',
    gap: 4,
  },
  numberBadge: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  number: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.textOnPrimary,
    includeFontPadding: false,
  },
  phoneIcon: {
    marginTop: 2,
  },
});

export default memo(EmergencyCard);

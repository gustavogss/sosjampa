import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radii, FontSize, FontWeight, Shadow } from '@/constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const ONBOARDING_KEY = 'sos_jampa_onboarding_done';

const SLIDES = [
  {
    id: '1',
    image: require('@/assets/images/onboarding-1.png'),
    badge: 'Painel Financeiro',
    badgeIcon: 'dashboard' as const,
    title: 'Controle total\ndos recursos',
    description:
      'Acompanhe em tempo real o total arrecadado via Pix, itens em estoque e o número de famílias atendidas — tudo em um único painel.',
    accent: Colors.primary,
  },
  {
    id: '2',
    image: require('@/assets/images/onboarding-2.png'),
    badge: 'Scanner QR',
    badgeIcon: 'qr-code-scanner' as const,
    title: 'Registre mantimentos\ncom QR Code',
    description:
      'Escaneie o código de barras de qualquer produto para registrá-lo no estoque instantaneamente — como um caixa de supermercado.',
    accent: '#E65100',
  },
  {
    id: '3',
    image: require('@/assets/images/onboarding-3.png'),
    badge: 'Mapa de Pontos',
    badgeIcon: 'location-on' as const,
    title: 'Encontre pontos\nde distribuição',
    description:
      'Visualize no mapa todos os locais de coleta e entrega em João Pessoa, com navegação GPS integrada ao Google Maps.',
    accent: '#00838F',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setCurrentIndex(idx);
  };

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/login');
  };

  const isLast = currentIndex === SLIDES.length - 1;
  const slide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full-bleed image carousel */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        style={StyleSheet.absoluteFill}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_W, height: SCREEN_H }}>
            <Image
              source={item.image}
              style={{ width: SCREEN_W, height: SCREEN_H }}
              contentFit="cover"
              transition={250}
            />
            {/* Dark gradient overlay */}
            <View style={styles.imageOverlay} />
          </View>
        )}
      />

      {/* Skip button */}
      {!isLast ? (
        <Pressable
          style={[styles.skipBtn, { top: insets.top + Spacing.md }]}
          onPress={handleFinish}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipText}>Pular</Text>
          <MaterialIcons name="chevron-right" size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>
      ) : null}

      {/* Bottom content panel */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: slide.accent + '28', borderColor: slide.accent + '60' }]}>
          <MaterialIcons name={slide.badgeIcon} size={14} color={slide.accent} />
          <Text style={[styles.badgeText, { color: slide.accent }]}>{slide.badge}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{slide.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{slide.description}</Text>

        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => listRef.current?.scrollToIndex({ index: i, animated: true })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={[
                  styles.dot,
                  i === currentIndex && [styles.dotActive, { backgroundColor: slide.accent }],
                ]}
              />
            </Pressable>
          ))}
        </View>

        {/* CTA Button */}
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: isLast ? slide.accent : Colors.primary },
            pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
          ]}
          onPress={goNext}
          accessibilityLabel={isLast ? 'Começar' : 'Próximo'}
        >
          {isLast ? (
            <>
              <MaterialIcons name="volunteer-activism" size={20} color="#fff" />
              <Text style={styles.ctaBtnText}>Começar a Ajudar</Text>
            </>
          ) : (
            <>
              <Text style={styles.ctaBtnText}>Próximo</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  skipBtn: {
    position: 'absolute',
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: 2,
    zIndex: 10,
  },
  skipText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    includeFontPadding: false,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(18,18,18,0.92)',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    gap: 5,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: FontSize.xxl + 4,
    fontWeight: FontWeight.extrabold,
    color: '#FFFFFF',
    lineHeight: 34,
    includeFontPadding: false,
  },
  description: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 22,
    includeFontPadding: false,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: Radii.full,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
    paddingVertical: 15,
    gap: Spacing.sm,
    minHeight: 52,
    ...Shadow.md,
  },
  ctaBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#fff',
    includeFontPadding: false,
  },
});

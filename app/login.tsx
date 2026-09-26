import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, Radii, FontSize, FontWeight, Shadow } from '@/constants/theme';

export default function LoginScreen() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Hero image */}
      <Image
        source={require('@/assets/images/login-hero.png')}
        style={styles.heroImage}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.overlay} />

      {/* Mock badge */}
      <View style={[styles.mockBadge, { top: insets.top + 12 }]}>
        <Text style={styles.mockText}>DEMO — LOGIN SIMULADO</Text>
      </View>

      {/* Bottom card */}
      <View style={[styles.card, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="volunteer-activism" size={26} color="#fff" />
          </View>
          <View style={styles.logoTextWrap}>
            <Text style={styles.logoTitle}>SOS Jampa</Text>
            <Text style={styles.logoSub}>Controle de Recursos e Doações</Text>
          </View>
        </View>

        <Text style={styles.headline}>Ajude famílias{'\n'}a reconstruir suas vidas</Text>
        <Text style={styles.desc}>
          Gerencie arrecadações, mantimentos e ajuda de custo para famílias desabrigadas pelas chuvas.
        </Text>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>47</Text>
            <Text style={styles.statLabel}>Famílias atendidas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>R$ 2,2k</Text>
            <Text style={styles.statLabel}>Arrecadados</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>557</Text>
            <Text style={styles.statLabel}>Itens em estoque</Text>
          </View>
        </View>

        {/* Sign-in Button */}
        <Pressable
          style={({ pressed }) => [
            styles.signInButton,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
          onPress={signInWithGoogle}
          disabled={isLoading}
          accessibilityLabel="Acessar painel"
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialIcons name="lock-open" size={20} color="#fff" style={styles.btnIcon} />
              <Text style={styles.signInButtonText}>Acessar Painel</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.legal}>
          Ao entrar, você concorda com os Termos de Uso do SOS Jampa.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryDark },
  heroImage: { position: 'absolute', top: 0, left: 0, right: 0, height: '60%' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0,77,64,0.45)',
  },
  mockBadge: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    zIndex: 10,
  },
  mockText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    ...Shadow.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    ...Shadow.sm,
  },
  logoTextWrap: { flex: 1 },
  logoTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    includeFontPadding: false,
  },
  logoSub: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    includeFontPadding: false,
    marginTop: 1,
  },
  headline: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    lineHeight: 32,
    marginBottom: Spacing.sm,
    includeFontPadding: false,
  },
  desc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
    includeFontPadding: false,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceTinted,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    includeFontPadding: false,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSubtle,
    includeFontPadding: false,
    textAlign: 'center',
    marginTop: 2,
  },
  statDivider: { width: 1, backgroundColor: Colors.border },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingVertical: 15,
    paddingHorizontal: Spacing.xl,
    ...Shadow.md,
    marginBottom: Spacing.md,
    minHeight: 52,
  },
  btnIcon: { marginRight: Spacing.sm },
  signInButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#fff',
    includeFontPadding: false,
  },
  legal: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 18,
    includeFontPadding: false,
  },
});

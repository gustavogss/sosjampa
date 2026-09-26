import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/useAuth';
import { ONBOARDING_KEY } from './onboarding';

export default function IndexPage() {
  const { user, isLoading } = useAuth();
  const [checked, setChecked] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingDone(val === 'true');
      setChecked(true);
    });
  }, []);

  if (!checked || isLoading) return null;

  if (!onboardingDone) return <Redirect href="/onboarding" />;
  if (user) return <Redirect href="/(tabs)" />;
  return <Redirect href="/login" />;
}

import '@/global.css';

import { Stack } from 'expo-router';
import { colorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useSettingsStore } from '@/features/settings/settingsStore';

export default function RootLayout() {
  const preference = useSettingsStore((s) => s.settings.colorScheme);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Intentional: this is the client-only mount gate described below, not a case the "avoid
    // setState in effects" rule is meant to catch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) colorScheme.set(preference);
  }, [hasMounted, preference]);

  // The whole app is client-only (localStorage-backed timer/settings/stats), so rather than
  // reconciling every persisted-store/SafeAreaView/color-scheme value against a server-rendered
  // guess, render an inert shell for the static-export server pass and the very first client
  // paint, then mount the real tree once we know we're running in the browser. This keeps
  // hydration trivially consistent instead of chasing individual server/client mismatches.
  if (!hasMounted) {
    return <View style={{ flex: 1, backgroundColor: '#FBF6EF' }} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

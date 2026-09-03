import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

interface SectionProps {
  title: string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <View className="mb-6 w-full">
      <Text
        accessibilityRole="header"
        className="mb-2 text-sm font-semibold uppercase tracking-wide text-coffee-500 dark:text-coffee-400"
      >
        {title}
      </Text>
      <View className="divide-y divide-coffee-100 rounded-xl bg-white/60 px-4 dark:divide-coffee-800 dark:bg-coffee-800/40">
        {children}
      </View>
    </View>
  );
}

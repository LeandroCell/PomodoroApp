import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { NumberStepper } from '@/components/NumberStepper';
import { Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SwitchRow } from '@/components/SwitchRow';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { SoundId } from '@/features/settings/types';
import { useStatsStore } from '@/features/stats/statsStore';
import { playPhaseEndSound } from '@/lib/sound';

const SOUND_OPTIONS: { value: SoundId; label: string }[] = [
  { value: 'chime', label: 'Chime' },
  { value: 'bell', label: 'Bell' },
  { value: 'digital', label: 'Digital' },
  { value: 'none', label: 'None' },
];

const COLOR_SCHEME_OPTIONS = [
  { value: 'system' as const, label: 'System' },
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
];

export default function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults);
  const clearHistory = useStatsStore((s) => s.clearHistory);

  return (
    <SafeAreaView className="flex-1 bg-coffee-50 dark:bg-coffee-900" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="px-5 py-6" contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
        <Text className="mb-6 text-2xl font-bold text-coffee-800 dark:text-coffee-50">Settings</Text>

        <Section title="Durations">
          <NumberStepper
            label="Work session"
            value={settings.workMinutes}
            onChange={(v) => update({ workMinutes: v })}
            min={1}
            max={90}
          />
          <NumberStepper
            label="Short break"
            value={settings.shortBreakMinutes}
            onChange={(v) => update({ shortBreakMinutes: v })}
            min={1}
            max={30}
          />
          <NumberStepper
            label="Long break"
            value={settings.longBreakMinutes}
            onChange={(v) => update({ longBreakMinutes: v })}
            min={1}
            max={60}
          />
          <NumberStepper
            label="Sessions until long break"
            value={settings.cyclesUntilLongBreak}
            onChange={(v) => update({ cyclesUntilLongBreak: v })}
            min={2}
            max={8}
            unit="x"
          />
        </Section>

        <Section title="Behavior">
          <SwitchRow
            label="Auto-start next phase"
            description="Automatically begin the next phase when the timer ends"
            value={settings.autoStartNext}
            onChange={(v) => update({ autoStartNext: v })}
          />
          <SwitchRow
            label="Notifications"
            description="Alert me when a phase ends, even in the background"
            value={settings.notificationsEnabled}
            onChange={(v) => update({ notificationsEnabled: v })}
          />
        </Section>

        <Section title="Sound">
          <SwitchRow label="Play sound on phase end" value={settings.soundEnabled} onChange={(v) => update({ soundEnabled: v })} />
          <View className="py-3">
            <SegmentedControl
              accessibilityLabel="Notification sound"
              options={SOUND_OPTIONS}
              value={settings.soundId}
              onChange={(soundId) => {
                update({ soundId });
                if (soundId !== 'none') playPhaseEndSound(soundId);
              }}
            />
          </View>
        </Section>

        <Section title="Appearance">
          <View className="py-3">
            <SegmentedControl
              accessibilityLabel="Color scheme"
              options={COLOR_SCHEME_OPTIONS}
              value={settings.colorScheme}
              onChange={(colorScheme) => update({ colorScheme })}
            />
          </View>
        </Section>

        <View className="gap-3 mt-2">
          <Button label="Reset settings to defaults" variant="secondary" onPress={resetToDefaults} />
          <Button label="Clear history" variant="ghost" onPress={clearHistory} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

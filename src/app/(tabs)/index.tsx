import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Confetti } from '@/components/Confetti';
import { IconButton } from '@/components/IconButton';
import { CoffeeCup } from '@/features/coffee-cup/CoffeeCup';
import { TimerPhase } from '@/features/timer/types';
import { useTimer } from '@/features/timer/useTimer';
import { formatMmSs } from '@/lib/format';

const PHASE_LABEL: Record<string, string> = {
  work: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

const PHASE_BG: Record<string, string> = {
  work: 'bg-coffee-50 dark:bg-coffee-900',
  shortBreak: 'bg-[#EAF6F1] dark:bg-[#122019]',
  longBreak: 'bg-[#EAF1FA] dark:bg-[#101E2C]',
};

export default function TimerScreen() {
  const timer = useTimer();
  const taskInputRef = useRef<TextInput>(null);
  const { colorScheme } = useColorScheme();
  const [showConfetti, setShowConfetti] = useState(false);
  const prevPhaseRef = useRef<TimerPhase>(timer.phase);

  // Celebrate finishing a full cycle (reaching a long break) with a brief confetti burst.
  useEffect(() => {
    const enteredLongBreak = prevPhaseRef.current !== 'longBreak' && timer.phase === 'longBreak';
    prevPhaseRef.current = timer.phase;
    if (!enteredLongBreak) return;
    setShowConfetti(true);
    const timeout = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(timeout);
  }, [timer.phase]);

  // Nice-to-have: spacebar starts/pauses on web, unless the user is typing in the task field.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      if (event.code === 'Space' && !isTyping) {
        event.preventDefault();
        if (timer.status === 'running') {
          timer.pause();
        } else {
          timer.start();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.status]);

  const dots = Array.from({ length: timer.cyclesUntilLongBreak }, (_, i) => i < timer.cyclesCompleted);

  return (
    <SafeAreaView className={`flex-1 ${PHASE_BG[timer.phase]}`} edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-between px-6 py-4">
        <View className="w-full max-w-md items-center gap-2 pt-2">
          <Text
            accessibilityRole="header"
            className="text-lg font-semibold tracking-wide text-coffee-700 dark:text-coffee-100"
          >
            {PHASE_LABEL[timer.phase]}
          </Text>
          <View className="flex-row gap-2" accessibilityLabel={`${timer.cyclesCompleted} of ${timer.cyclesUntilLongBreak} focus sessions completed before the next long break`}>
            {dots.map((filled, i) => (
              <View
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${
                  filled ? 'bg-coffee-600 dark:bg-coffee-300' : 'bg-coffee-200 dark:bg-coffee-700'
                }`}
              />
            ))}
          </View>
        </View>

        <View className="items-center gap-6">
          <CoffeeCup
            state={{
              phase: timer.phase,
              status: timer.status,
              cyclesCompleted: timer.cyclesCompleted,
              remainingMs: timer.remainingMs,
              totalMs: timer.totalMs,
              targetTimestamp: timer.targetTimestamp,
            }}
            size={220}
            isDark={colorScheme === 'dark'}
          />
          <Text
            className="text-6xl font-bold tabular-nums text-coffee-800 dark:text-coffee-50"
            accessibilityLabel={`${formatMmSs(timer.remainingMs)} remaining in this ${PHASE_LABEL[timer.phase]} session`}
          >
            {formatMmSs(timer.remainingMs)}
          </Text>
        </View>

        <View className="w-full max-w-md gap-6">
          <TextInput
            ref={taskInputRef}
            value={timer.task}
            onChangeText={timer.setTask}
            placeholder="Woran arbeitest du gerade?"
            placeholderTextColor="#B0A695"
            accessibilityLabel="What are you working on"
            className="w-full rounded-xl border border-coffee-200 bg-white/70 px-4 py-3 text-base text-coffee-800 dark:border-coffee-700 dark:bg-coffee-800/60 dark:text-coffee-50"
            returnKeyType="done"
          />

          <View className="flex-row items-center justify-center gap-6">
            <IconButton icon="refresh" label="Reset session" onPress={timer.reset} />
            <Button
              label={timer.status === 'running' ? 'Pause' : 'Start'}
              onPress={timer.status === 'running' ? timer.pause : timer.start}
              size="lg"
              accessibilityHint={
                timer.status === 'running' ? 'Pauses the current session' : 'Starts counting down the current session'
              }
            />
            <IconButton icon="play-skip-forward" label="Skip to next phase" onPress={timer.skip} />
          </View>
        </View>
      </View>
      {showConfetti ? <Confetti /> : null}
    </SafeAreaView>
  );
}

import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Section } from '@/components/Section';
import {
  getCurrentStreak,
  getLast7Days,
  getTodayCount,
  getTotalFocusSeconds,
  getWeekCount,
  sessionsToCsv,
} from '@/features/stats/selectors';
import { useStatsStore } from '@/features/stats/statsStore';
import { PomodoroSession } from '@/features/stats/types';
import { WeekBarChart } from '@/features/stats/WeekBarChart';
import { exportCsvFile } from '@/lib/exportCsv';
import { formatHoursMinutes } from '@/lib/format';

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View
      className="flex-1 items-center rounded-xl bg-white/60 py-4 dark:bg-coffee-800/40"
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text className="text-2xl font-bold text-coffee-800 dark:text-coffee-50">{value}</Text>
      <Text className="mt-1 text-xs text-coffee-500 dark:text-coffee-400">{label}</Text>
    </View>
  );
}

function SessionRow({ session }: { session: PomodoroSession }) {
  const date = new Date(session.completedAt);
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const day = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1 pr-3">
        <Text className="text-base text-coffee-800 dark:text-coffee-100" numberOfLines={1}>
          {session.task ?? 'Focus session'}
        </Text>
        <Text className="text-xs text-coffee-500 dark:text-coffee-400">
          {day} · {time}
        </Text>
      </View>
      <Text className="text-sm font-medium text-coffee-600 dark:text-coffee-300">
        {Math.round(session.durationSeconds / 60)}m
      </Text>
    </View>
  );
}

export default function StatsScreen() {
  const sessions = useStatsStore((s) => s.sessions);

  const { today, week, totalFocus, streak, last7Days, recent } = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.completedAt - a.completedAt);
    return {
      today: getTodayCount(sessions),
      week: getWeekCount(sessions),
      totalFocus: getTotalFocusSeconds(sessions),
      streak: getCurrentStreak(sessions),
      last7Days: getLast7Days(sessions),
      recent: sorted.slice(0, 15),
    };
  }, [sessions]);

  return (
    <SafeAreaView className="flex-1 bg-coffee-50 dark:bg-coffee-900" edges={['top', 'bottom']}>
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
        data={recent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SessionRow session={item} />}
        ListHeaderComponent={
          <View>
            <Text className="mb-6 text-2xl font-bold text-coffee-800 dark:text-coffee-50">Stats</Text>

            <View className="mb-6 flex-row gap-3">
              <StatTile label="Today" value={String(today)} />
              <StatTile label="This week" value={String(week)} />
              <StatTile label="Streak" value={`${streak}d`} />
            </View>

            <Section title="Last 7 days">
              <WeekBarChart days={last7Days} />
            </Section>

            <Section title="Total focus time">
              <Text className="py-3 text-3xl font-bold text-coffee-800 dark:text-coffee-50">
                {formatHoursMinutes(totalFocus)}
              </Text>
            </Section>

            <View className="mb-2">
              <Button
                label="Export history as CSV"
                variant="secondary"
                disabled={sessions.length === 0}
                onPress={() => exportCsvFile('pomodoro-history.csv', sessionsToCsv(sessions))}
              />
            </View>

            <Text className="mb-1 mt-4 text-sm font-semibold uppercase tracking-wide text-coffee-500 dark:text-coffee-400">
              History
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text className="py-6 text-center text-coffee-500 dark:text-coffee-400">
            No completed focus sessions yet. Start your first Pomodoro!
          </Text>
        }
        ItemSeparatorComponent={() => <View className="h-px bg-coffee-100 dark:bg-coffee-800" />}
      />
    </SafeAreaView>
  );
}

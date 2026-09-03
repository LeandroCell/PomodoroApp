import { Text, View } from 'react-native';

import { DayStat } from './types';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function weekdayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
}

interface WeekBarChartProps {
  days: DayStat[];
  height?: number;
}

export function WeekBarChart({ days, height = 140 }: WeekBarChartProps) {
  const maxCount = Math.max(1, ...days.map((d) => d.count));
  const summary = days.map((d) => `${weekdayLabel(d.date)} ${d.count}`).join(', ');

  return (
    <View accessibilityLabel={`Completed pomodoros over the last 7 days: ${summary}`}>
      <View className="flex-row items-end justify-between" style={{ height }} importantForAccessibility="no-hide-descendants">
        {days.map((day) => {
          const barHeight = day.count === 0 ? 4 : Math.max(6, (day.count / maxCount) * (height - 24));
          const isToday = day.date === days[days.length - 1].date;
          return (
            <View key={day.date} className="flex-1 items-center gap-1.5">
              <Text className="text-xs font-medium text-coffee-600 dark:text-coffee-300">
                {day.count > 0 ? day.count : ''}
              </Text>
              <View
                className={`w-5 rounded-full ${isToday ? 'bg-coffee-600 dark:bg-coffee-300' : 'bg-coffee-300 dark:bg-coffee-600'}`}
                style={{ height: barHeight }}
              />
              <Text className="text-xs text-coffee-500 dark:text-coffee-400">{weekdayLabel(day.date)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

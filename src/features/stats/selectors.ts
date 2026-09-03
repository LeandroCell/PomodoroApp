import { DayStat, PomodoroSession } from './types';

export function toDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const dayIndex = d.getDay(); // 0 = Sunday
  const diffToMonday = (dayIndex + 6) % 7; // Monday -> 0, Sunday -> 6
  return addDays(d, -diffToMonday);
}

export function getTodayCount(sessions: PomodoroSession[], now: Date = new Date()): number {
  const key = toDateKey(now.getTime());
  return sessions.filter((s) => toDateKey(s.completedAt) === key).length;
}

export function getWeekCount(sessions: PomodoroSession[], now: Date = new Date()): number {
  const start = startOfWeek(now).getTime();
  const end = addDays(startOfWeek(now), 7).getTime();
  return sessions.filter((s) => s.completedAt >= start && s.completedAt < end).length;
}

export function getTotalFocusSeconds(sessions: PomodoroSession[]): number {
  return sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
}

export function getLast7Days(sessions: PomodoroSession[], now: Date = new Date()): DayStat[] {
  const days: DayStat[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayDate = addDays(startOfDay(now), -i);
    const key = toDateKey(dayDate.getTime());
    const daySessions = sessions.filter((s) => toDateKey(s.completedAt) === key);
    days.push({
      date: key,
      count: daySessions.length,
      focusSeconds: daySessions.reduce((sum, s) => sum + s.durationSeconds, 0),
    });
  }
  return days;
}

export function getCurrentStreak(sessions: PomodoroSession[], now: Date = new Date()): number {
  const daysWithSessions = new Set(sessions.map((s) => toDateKey(s.completedAt)));
  let cursor = startOfDay(now);
  let streak = 0;

  if (daysWithSessions.has(toDateKey(cursor.getTime()))) {
    streak = 1;
  }
  cursor = addDays(cursor, -1);

  while (daysWithSessions.has(toDateKey(cursor.getTime()))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function sessionsToCsv(sessions: PomodoroSession[]): string {
  const header = 'id,started_at,completed_at,duration_seconds,task';
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = sessions
    .slice()
    .sort((a, b) => a.completedAt - b.completedAt)
    .map((s) =>
      [
        s.id,
        new Date(s.startedAt).toISOString(),
        new Date(s.completedAt).toISOString(),
        String(s.durationSeconds),
        escape(s.task ?? ''),
      ].join(',')
    );
  return [header, ...rows].join('\n');
}

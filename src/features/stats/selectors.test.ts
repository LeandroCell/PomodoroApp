import { getCurrentStreak, getLast7Days, getTodayCount, getTotalFocusSeconds, getWeekCount } from './selectors';
import { PomodoroSession } from './types';

function makeSession(daysAgo: number, hour = 12): PomodoroSession {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return {
    id: `s-${daysAgo}-${hour}`,
    startedAt: d.getTime() - 25 * 60 * 1000,
    completedAt: d.getTime(),
    durationSeconds: 25 * 60,
  };
}

describe('getTodayCount', () => {
  it('counts only sessions completed today', () => {
    const sessions = [makeSession(0), makeSession(0, 15), makeSession(1)];
    expect(getTodayCount(sessions)).toBe(2);
  });
});

describe('getWeekCount', () => {
  it('counts sessions within the current Mon-Sun week', () => {
    const sessions = [makeSession(0), makeSession(1), makeSession(6), makeSession(10)];
    // 10 days ago is guaranteed to fall outside the current week regardless of today's weekday.
    expect(getWeekCount(sessions)).toBeLessThan(sessions.length);
    expect(getWeekCount([makeSession(0)])).toBe(1);
  });
});

describe('getTotalFocusSeconds', () => {
  it('sums planned durations', () => {
    const sessions = [makeSession(0), makeSession(1)];
    expect(getTotalFocusSeconds(sessions)).toBe(50 * 60);
  });
});

describe('getLast7Days', () => {
  it('returns exactly 7 entries, oldest first, ending with today', () => {
    const sessions = [makeSession(0), makeSession(3)];
    const days = getLast7Days(sessions);
    expect(days).toHaveLength(7);
    expect(days[6].count).toBe(1); // today
    expect(days[3].count).toBe(1); // 3 days ago
    expect(days[0].count + days[1].count + days[2].count + days[4].count + days[5].count).toBe(0);
  });
});

describe('getCurrentStreak', () => {
  it('is 0 with no sessions', () => {
    expect(getCurrentStreak([])).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const sessions = [makeSession(0), makeSession(1), makeSession(2)];
    expect(getCurrentStreak(sessions)).toBe(3);
  });

  it('still counts a streak ending yesterday if today has no session yet', () => {
    const sessions = [makeSession(1), makeSession(2)];
    expect(getCurrentStreak(sessions)).toBe(2);
  });

  it('breaks the streak on a gap day', () => {
    const sessions = [makeSession(0), makeSession(2)];
    expect(getCurrentStreak(sessions)).toBe(1);
  });
});

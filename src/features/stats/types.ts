export interface PomodoroSession {
  id: string;
  /** ms since epoch when the work session started. */
  startedAt: number;
  /** ms since epoch when the work session was completed. */
  completedAt: number;
  /** Planned duration of the session, in seconds. */
  durationSeconds: number;
  /** Optional free-text task the user said they were working on. */
  task?: string;
}

export interface DayStat {
  /** yyyy-mm-dd, in the user's local time zone. */
  date: string;
  count: number;
  focusSeconds: number;
}

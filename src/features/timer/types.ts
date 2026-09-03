export type TimerPhase = 'work' | 'shortBreak' | 'longBreak';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerConfig {
  /** Work session duration, in seconds. */
  workDuration: number;
  /** Short break duration, in seconds. */
  shortBreakDuration: number;
  /** Long break duration, in seconds. */
  longBreakDuration: number;
  /** Number of work sessions completed before a long break is taken. */
  cyclesUntilLongBreak: number;
  /** Whether the next phase should start automatically when the current one ends. */
  autoStartNext: boolean;
}

export interface TimerState {
  phase: TimerPhase;
  status: TimerStatus;
  /** Work sessions completed since the last long break, in [0, cyclesUntilLongBreak). */
  cyclesCompleted: number;
  /** Authoritative remaining time in the current phase, in milliseconds. */
  remainingMs: number;
  /** Total duration of the current phase, in milliseconds (for progress display). */
  totalMs: number;
  /** Absolute timestamp (Date.now()) the current phase will end at; null unless running. */
  targetTimestamp: number | null;
}

export interface TimerTickResult {
  state: TimerState;
  /** Phases that finished naturally as part of this tick, oldest first. */
  completedPhases: TimerPhase[];
}

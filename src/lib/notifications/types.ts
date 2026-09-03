import { TimerPhase } from '@/features/timer/types';

export interface SchedulePhaseEndParams {
  /** The phase that is ending. */
  phase: TimerPhase;
  /** The phase that will start next. */
  nextPhase: TimerPhase;
  /** Absolute timestamp (ms) the phase ends at. */
  endTimestamp: number;
  /** Optional task label the user attached to the current work session. */
  task?: string;
}

export interface ScheduledNotificationHandle {
  cancel: () => Promise<void>;
}

export interface NotificationService {
  requestPermission(): Promise<boolean>;
  schedulePhaseEnd(params: SchedulePhaseEndParams): Promise<ScheduledNotificationHandle | null>;
}

export function phaseEndTitle(phase: TimerPhase): string {
  switch (phase) {
    case 'work':
      return 'Focus session complete';
    case 'shortBreak':
      return 'Short break over';
    case 'longBreak':
      return 'Long break over';
  }
}

export function phaseEndBody(nextPhase: TimerPhase, task?: string): string {
  const taskSuffix = task ? ` (${task})` : '';
  switch (nextPhase) {
    case 'work':
      return `Time to focus again${taskSuffix}.`;
    case 'shortBreak':
      return 'Take a short break — you earned it.';
    case 'longBreak':
      return 'Great work! Time for a long break.';
  }
}

import { TimerConfig, TimerPhase, TimerState, TimerTickResult } from './types';

/**
 * Hard cap on phase transitions simulated within a single tick. Protects against pathological
 * configs (e.g. all durations 0) or extreme forward clock jumps turning into a runaway loop.
 */
const MAX_PHASE_TRANSITIONS_PER_TICK = 1000;

function durationSecondsForPhase(phase: TimerPhase, config: TimerConfig): number {
  switch (phase) {
    case 'work':
      return config.workDuration;
    case 'shortBreak':
      return config.shortBreakDuration;
    case 'longBreak':
      return config.longBreakDuration;
  }
}

function durationMsForPhase(phase: TimerPhase, config: TimerConfig): number {
  return Math.max(0, durationSecondsForPhase(phase, config)) * 1000;
}

function nextPhase(
  phase: TimerPhase,
  cyclesCompleted: number,
  config: TimerConfig
): { phase: TimerPhase; cyclesCompleted: number } {
  if (phase === 'work') {
    const completed = cyclesCompleted + 1;
    if (completed >= Math.max(1, config.cyclesUntilLongBreak)) {
      return { phase: 'longBreak', cyclesCompleted: completed };
    }
    return { phase: 'shortBreak', cyclesCompleted: completed };
  }
  if (phase === 'longBreak') {
    return { phase: 'work', cyclesCompleted: 0 };
  }
  return { phase: 'work', cyclesCompleted };
}

export function createInitialTimerState(
  config: TimerConfig,
  phase: TimerPhase = 'work',
  cyclesCompleted = 0
): TimerState {
  const totalMs = durationMsForPhase(phase, config);
  return {
    phase,
    status: 'idle',
    cyclesCompleted,
    remainingMs: totalMs,
    totalMs,
    targetTimestamp: null,
  };
}

/** Start (or resume) the timer from its current remaining time. Idempotent while already running. */
export function startTimer(state: TimerState, now: number): TimerState {
  if (state.status === 'running') return state;
  if (state.remainingMs <= 0) return state;
  return {
    ...state,
    status: 'running',
    targetTimestamp: now + state.remainingMs,
  };
}

/** Pause the timer, freezing the remaining time. Idempotent while already paused/idle. */
export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'running' || state.targetTimestamp == null) {
    return state.status === 'running' ? { ...state, status: 'paused', targetTimestamp: null } : state;
  }
  const remainingMs = Math.max(0, state.targetTimestamp - now);
  return {
    ...state,
    status: 'paused',
    remainingMs,
    targetTimestamp: null,
  };
}

/** Reset the current phase back to its full configured duration and stop the timer. */
export function resetTimer(state: TimerState, config: TimerConfig): TimerState {
  const totalMs = durationMsForPhase(state.phase, config);
  return {
    ...state,
    status: 'idle',
    remainingMs: totalMs,
    totalMs,
    targetTimestamp: null,
  };
}

/** Reset the whole cycle back to a fresh work session (used e.g. after changing settings drastically). */
export function resetCycle(config: TimerConfig): TimerState {
  return createInitialTimerState(config, 'work', 0);
}

/** Immediately advance to the next phase, preserving whether the timer was running. */
export function skipPhase(state: TimerState, config: TimerConfig, now: number): TimerState {
  const advanced = nextPhase(state.phase, state.cyclesCompleted, config);
  const totalMs = durationMsForPhase(advanced.phase, config);
  const continueRunning = state.status === 'running';
  return {
    phase: advanced.phase,
    cyclesCompleted: advanced.cyclesCompleted,
    status: continueRunning ? 'running' : 'idle',
    remainingMs: totalMs,
    totalMs,
    targetTimestamp: continueRunning ? now + totalMs : null,
  };
}

/** Apply a fresh config to the current state without losing progress unnecessarily. */
export function applyConfig(state: TimerState, config: TimerConfig): TimerState {
  if (state.status === 'running') {
    // Let the current phase play out with its original duration; new config applies from the next phase.
    return state;
  }
  const totalMs = durationMsForPhase(state.phase, config);
  return {
    ...state,
    remainingMs: Math.min(state.remainingMs, totalMs) || totalMs,
    totalMs,
  };
}

/**
 * Recompute state as of `now`, using only the absolute target timestamp (never a decrementing
 * counter) so the countdown cannot drift. Handles the case where more than one phase has elapsed
 * since the last tick (e.g. the device was asleep/backgrounded) by walking phase transitions
 * forward until `now` is accounted for.
 */
export function tickTimer(state: TimerState, config: TimerConfig, now: number): TimerTickResult {
  if (state.status !== 'running' || state.targetTimestamp == null) {
    return { state, completedPhases: [] };
  }

  const remainingMs = state.targetTimestamp - now;
  if (remainingMs > 0) {
    return { state: { ...state, remainingMs }, completedPhases: [] };
  }

  let phase = state.phase;
  let cyclesCompleted = state.cyclesCompleted;
  let overshootMs = -remainingMs;
  const completedPhases: TimerPhase[] = [];
  let iterations = 0;

  while (iterations < MAX_PHASE_TRANSITIONS_PER_TICK) {
    completedPhases.push(phase);
    const advanced = nextPhase(phase, cyclesCompleted, config);
    phase = advanced.phase;
    cyclesCompleted = advanced.cyclesCompleted;
    const phaseDurationMs = durationMsForPhase(phase, config);

    if (!config.autoStartNext) {
      return {
        state: {
          phase,
          cyclesCompleted,
          status: 'idle',
          remainingMs: phaseDurationMs,
          totalMs: phaseDurationMs,
          targetTimestamp: null,
        },
        completedPhases,
      };
    }

    if (phaseDurationMs > 0 && overshootMs < phaseDurationMs) {
      return {
        state: {
          phase,
          cyclesCompleted,
          status: 'running',
          remainingMs: phaseDurationMs - overshootMs,
          totalMs: phaseDurationMs,
          targetTimestamp: now + (phaseDurationMs - overshootMs),
        },
        completedPhases,
      };
    }

    overshootMs = Math.max(0, overshootMs - phaseDurationMs);
    iterations++;
  }

  // Safety valve for pathological configs (e.g. every duration is 0) or an extreme clock jump.
  const totalMs = durationMsForPhase(phase, config);
  return {
    state: {
      phase,
      cyclesCompleted,
      status: 'idle',
      remainingMs: totalMs,
      totalMs,
      targetTimestamp: null,
    },
    completedPhases,
  };
}

/** What phase would come after the current one, without mutating anything (used to preview e.g. notification text). */
export function previewNextPhase(state: TimerState, config: TimerConfig): TimerPhase {
  return nextPhase(state.phase, state.cyclesCompleted, config).phase;
}

export function progressFraction(state: TimerState): number {
  if (state.totalMs <= 0) return 1;
  return 1 - Math.min(1, Math.max(0, state.remainingMs / state.totalMs));
}

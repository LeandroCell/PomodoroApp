import {
  applyConfig,
  createInitialTimerState,
  pauseTimer,
  progressFraction,
  resetTimer,
  skipPhase,
  startTimer,
  tickTimer,
} from './timerEngine';
import { TimerConfig } from './types';

const baseConfig: TimerConfig = {
  workDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  cyclesUntilLongBreak: 4,
  autoStartNext: false,
};

describe('createInitialTimerState', () => {
  it('starts idle with the full work duration', () => {
    const state = createInitialTimerState(baseConfig);
    expect(state.phase).toBe('work');
    expect(state.status).toBe('idle');
    expect(state.cyclesCompleted).toBe(0);
    expect(state.remainingMs).toBe(25 * 60 * 1000);
    expect(state.totalMs).toBe(25 * 60 * 1000);
    expect(state.targetTimestamp).toBeNull();
  });
});

describe('start / tick (timestamp-based countdown)', () => {
  it('computes remaining time from the absolute target, not from decrementing a counter', () => {
    const t0 = 1_000_000;
    let state = createInitialTimerState(baseConfig);
    state = startTimer(state, t0);
    expect(state.status).toBe('running');
    expect(state.targetTimestamp).toBe(t0 + 25 * 60 * 1000);

    const { state: after10s } = tickTimer(state, baseConfig, t0 + 10_000);
    expect(after10s.remainingMs).toBe(25 * 60 * 1000 - 10_000);

    // A second tick 1ms later must not have drifted: it's derived from the same fixed target.
    const { state: after10001ms } = tickTimer(state, baseConfig, t0 + 10_001);
    expect(after10001ms.remainingMs).toBe(25 * 60 * 1000 - 10_001);
  });

  it('does nothing when ticked while idle or paused', () => {
    const state = createInitialTimerState(baseConfig);
    const { state: stillIdle, completedPhases } = tickTimer(state, baseConfig, Date.now() + 999_999);
    expect(stillIdle).toBe(state);
    expect(completedPhases).toEqual([]);
  });
});

describe('pause / resume', () => {
  it('freezes remaining time on pause and resumes correctly from a new target', () => {
    const t0 = 1_000_000;
    let state = startTimer(createInitialTimerState(baseConfig), t0);

    state = pauseTimer(state, t0 + 5_000);
    expect(state.status).toBe('paused');
    expect(state.remainingMs).toBe(25 * 60 * 1000 - 5_000);
    expect(state.targetTimestamp).toBeNull();

    // Resuming later must be based on the frozen remaining time, not on elapsed wall-clock time.
    state = startTimer(state, t0 + 500_000);
    expect(state.status).toBe('running');
    expect(state.targetTimestamp).toBe(t0 + 500_000 + (25 * 60 * 1000 - 5_000));
  });

  it('is idempotent under rapid repeated pausing', () => {
    const t0 = 1_000_000;
    let state = startTimer(createInitialTimerState(baseConfig), t0);
    state = pauseTimer(state, t0 + 3_000);
    const pausedOnce = state;
    // Pausing again (e.g. a double-tap) at a later timestamp must not further reduce remainingMs.
    state = pauseTimer(state, t0 + 60_000);
    expect(state).toEqual(pausedOnce);
    state = pauseTimer(state, t0 + 120_000);
    expect(state).toEqual(pausedOnce);
  });

  it('is idempotent under rapid repeated starting', () => {
    const t0 = 1_000_000;
    let state = startTimer(createInitialTimerState(baseConfig), t0);
    const startedOnce = state;
    state = startTimer(state, t0 + 10_000);
    expect(state).toBe(startedOnce);
  });
});

describe('reset', () => {
  it('restores the full duration of the current phase and stops the timer', () => {
    const t0 = 1_000_000;
    let state = startTimer(createInitialTimerState(baseConfig), t0);
    const { state: ticked } = tickTimer(state, baseConfig, t0 + 10_000);
    state = resetTimer(ticked, baseConfig);
    expect(state.status).toBe('idle');
    expect(state.remainingMs).toBe(25 * 60 * 1000);
    expect(state.targetTimestamp).toBeNull();
  });
});

describe('phase transitions', () => {
  it('goes work -> shortBreak -> work for the first cycles', () => {
    const t0 = 1_000_000;
    let state = startTimer(createInitialTimerState(baseConfig), t0);
    const result = tickTimer(state, baseConfig, t0 + 25 * 60 * 1000 + 1);
    expect(result.completedPhases).toEqual(['work']);
    expect(result.state.phase).toBe('shortBreak');
    expect(result.state.cyclesCompleted).toBe(1);
    expect(result.state.status).toBe('idle'); // autoStartNext: false
    expect(result.state.remainingMs).toBe(5 * 60 * 1000);
  });

  it('takes a long break after cyclesUntilLongBreak work sessions, then resets the cycle counter', () => {
    const config: TimerConfig = { ...baseConfig, cyclesUntilLongBreak: 2, autoStartNext: true };
    const t0 = 1_000_000;

    // Cycle 1: work -> shortBreak
    let state = startTimer(createInitialTimerState(config), t0);
    let result = tickTimer(state, config, t0 + config.workDuration * 1000 + 1);
    expect(result.state.phase).toBe('shortBreak');
    expect(result.state.cyclesCompleted).toBe(1);
    expect(result.state.status).toBe('running'); // auto-started

    // shortBreak -> work (cycle 2)
    state = result.state;
    result = tickTimer(state, config, state.targetTimestamp! + 1);
    expect(result.state.phase).toBe('work');
    expect(result.state.cyclesCompleted).toBe(1);

    // Cycle 2 work -> longBreak (2 >= cyclesUntilLongBreak)
    state = result.state;
    result = tickTimer(state, config, state.targetTimestamp! + 1);
    expect(result.state.phase).toBe('longBreak');
    expect(result.state.cyclesCompleted).toBe(2);

    // longBreak -> work, cyclesCompleted resets to 0
    state = result.state;
    result = tickTimer(state, config, state.targetTimestamp! + 1);
    expect(result.state.phase).toBe('work');
    expect(result.state.cyclesCompleted).toBe(0);
  });

  it('chains through multiple completed phases in a single tick when autoStartNext is on (e.g. after being backgrounded for a long time)', () => {
    const config: TimerConfig = { ...baseConfig, cyclesUntilLongBreak: 4, autoStartNext: true };
    const t0 = 1_000_000;
    let state = startTimer(createInitialTimerState(config), t0);

    // Jump far past work + shortBreak combined, landing partway into the next work session.
    const elapsedIntoNextWork = 2 * 60 * 1000;
    const jumpTo = t0 + config.workDuration * 1000 + config.shortBreakDuration * 1000 + elapsedIntoNextWork;
    const result = tickTimer(state, config, jumpTo);

    expect(result.completedPhases).toEqual(['work', 'shortBreak']);
    expect(result.state.phase).toBe('work');
    expect(result.state.cyclesCompleted).toBe(1);
    expect(result.state.status).toBe('running');
    expect(result.state.remainingMs).toBe(config.workDuration * 1000 - elapsedIntoNextWork);
  });

  it('lands idle at the start of the next phase (without skipping further) when autoStartNext is off, even after a huge gap', () => {
    const config: TimerConfig = { ...baseConfig, autoStartNext: false };
    const t0 = 1_000_000;
    const state = startTimer(createInitialTimerState(config), t0);

    const farFuture = t0 + 1000 * 60 * 60 * 24; // one day later
    const result = tickTimer(state, config, farFuture);

    expect(result.completedPhases).toEqual(['work']);
    expect(result.state.phase).toBe('shortBreak');
    expect(result.state.status).toBe('idle');
    expect(result.state.remainingMs).toBe(config.shortBreakDuration * 1000);
  });

  it('never hangs on a pathological all-zero-duration config with autoStartNext on', () => {
    const config: TimerConfig = {
      workDuration: 0,
      shortBreakDuration: 0,
      longBreakDuration: 0,
      cyclesUntilLongBreak: 4,
      autoStartNext: true,
    };
    const t0 = 1_000_000;
    // startTimer refuses to start with 0 remaining time; force a running state directly to
    // exercise the tick safety valve as if it had been started under a previous non-zero config.
    const state = { ...createInitialTimerState(config), status: 'running' as const, targetTimestamp: t0 };
    const result = tickTimer(state, config, t0 + 1);
    expect(result.state.status).toBe('idle');
    expect(Number.isFinite(result.state.remainingMs)).toBe(true);
  });
});

describe('skip', () => {
  it('advances to the next phase immediately and keeps running if it was running', () => {
    const t0 = 1_000_000;
    let state = startTimer(createInitialTimerState(baseConfig), t0);
    state = skipPhase(state, baseConfig, t0 + 1_000);
    expect(state.phase).toBe('shortBreak');
    expect(state.status).toBe('running');
    expect(state.targetTimestamp).toBe(t0 + 1_000 + 5 * 60 * 1000);
  });

  it('advances to the next phase and stays idle if it was idle', () => {
    const state = skipPhase(createInitialTimerState(baseConfig), baseConfig, Date.now());
    expect(state.phase).toBe('shortBreak');
    expect(state.status).toBe('idle');
    expect(state.targetTimestamp).toBeNull();
  });
});

describe('applyConfig', () => {
  it('does not disturb an in-progress running phase', () => {
    const t0 = 1_000_000;
    const state = startTimer(createInitialTimerState(baseConfig), t0);
    const updated = applyConfig(state, { ...baseConfig, workDuration: 50 * 60 });
    expect(updated).toBe(state);
  });

  it('updates the idle phase duration to match new settings', () => {
    const state = createInitialTimerState(baseConfig);
    const updated = applyConfig(state, { ...baseConfig, workDuration: 10 * 60 });
    expect(updated.totalMs).toBe(10 * 60 * 1000);
    expect(updated.remainingMs).toBe(10 * 60 * 1000);
  });
});

describe('progressFraction', () => {
  it('is 0 at full remaining time and 1 when time is up', () => {
    const full = createInitialTimerState(baseConfig);
    expect(progressFraction(full)).toBe(0);
    const empty = { ...full, remainingMs: 0 };
    expect(progressFraction(empty)).toBe(1);
    const half = { ...full, remainingMs: full.totalMs / 2 };
    expect(progressFraction(half)).toBeCloseTo(0.5);
  });
});

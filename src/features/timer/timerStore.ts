import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandJsonStorage } from '@/lib/storage';

import {
  applyConfig,
  createInitialTimerState,
  pauseTimer,
  resetTimer,
  skipPhase,
  startTimer,
  tickTimer,
} from './timerEngine';
import { TimerConfig, TimerPhase, TimerState } from './types';

const DEFAULT_CONFIG: TimerConfig = {
  workDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  cyclesUntilLongBreak: 4,
  autoStartNext: false,
};

interface TimerRuntimeStore {
  timer: TimerState;
  config: TimerConfig;
  task: string;
  hasHydrated: boolean;
  setConfig: (config: TimerConfig) => void;
  setTask: (task: string) => void;
  start: (now?: number) => void;
  pause: (now?: number) => void;
  reset: () => void;
  skip: (now?: number) => void;
  tick: (now?: number) => TimerPhase[];
  _setHasHydrated: (v: boolean) => void;
}

export const useTimerStore = create<TimerRuntimeStore>()(
  persist(
    (set, get) => ({
      timer: createInitialTimerState(DEFAULT_CONFIG),
      config: DEFAULT_CONFIG,
      task: '',
      hasHydrated: false,

      setConfig: (config) =>
        set((s) => ({ config, timer: applyConfig(s.timer, config) })),

      setTask: (task) => set({ task }),

      start: (now = Date.now()) => set((s) => ({ timer: startTimer(s.timer, now) })),

      pause: (now = Date.now()) => set((s) => ({ timer: pauseTimer(s.timer, now) })),

      reset: () => set((s) => ({ timer: resetTimer(s.timer, s.config) })),

      skip: (now = Date.now()) =>
        set((s) => ({ timer: skipPhase(s.timer, s.config, now) })),

      tick: (now = Date.now()) => {
        const s = get();
        const result = tickTimer(s.timer, s.config, now);
        if (result.state !== s.timer) {
          set({ timer: result.state });
        }
        return result.completedPhases;
      },

      _setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'pomodoro-brew/timer-runtime',
      storage: createJSONStorage(() => zustandJsonStorage),
      partialize: (state) => ({ timer: state.timer, config: state.config, task: state.task }) as TimerRuntimeStore,
      onRehydrateStorage: () => (state) => {
        // The initial `tick()` from `useTimer`'s mount effect (not here) is what fast-forwards
        // through any phases that finished while the app was closed, so completions get logged
        // to stats exactly once via the normal in-app code path.
        state?._setHasHydrated(true);
      },
    }
  )
);

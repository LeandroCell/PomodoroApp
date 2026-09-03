import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandJsonStorage } from '@/lib/storage';
import { TimerConfig } from '@/features/timer/types';

import { DEFAULT_SETTINGS, Settings } from './types';

interface SettingsStore {
  settings: Settings;
  hasHydrated: boolean;
  update: (patch: Partial<Settings>) => void;
  resetToDefaults: () => void;
  _setHasHydrated: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      hasHydrated: false,
      update: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      resetToDefaults: () => set({ settings: DEFAULT_SETTINGS }),
      _setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'pomodoro-brew/settings',
      storage: createJSONStorage(() => zustandJsonStorage),
      partialize: (state) => ({ settings: state.settings }) as SettingsStore,
      merge: (persisted, current) => ({
        ...current,
        settings: { ...DEFAULT_SETTINGS, ...(persisted as Partial<SettingsStore>)?.settings },
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    }
  )
);

export function settingsToTimerConfig(settings: Settings): TimerConfig {
  return {
    workDuration: settings.workMinutes * 60,
    shortBreakDuration: settings.shortBreakMinutes * 60,
    longBreakDuration: settings.longBreakMinutes * 60,
    cyclesUntilLongBreak: settings.cyclesUntilLongBreak,
    autoStartNext: settings.autoStartNext,
  };
}

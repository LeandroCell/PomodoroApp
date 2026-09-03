import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandJsonStorage } from '@/lib/storage';

import { PomodoroSession } from './types';

interface StatsStore {
  sessions: PomodoroSession[];
  hasHydrated: boolean;
  addSession: (session: Omit<PomodoroSession, 'id'>) => void;
  clearHistory: () => void;
  _setHasHydrated: (v: boolean) => void;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      sessions: [],
      hasHydrated: false,
      addSession: (session) =>
        set((s) => ({ sessions: [...s.sessions, { ...session, id: generateId() }] })),
      clearHistory: () => set({ sessions: [] }),
      _setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'pomodoro-brew/stats',
      storage: createJSONStorage(() => zustandJsonStorage),
      partialize: (state) => ({ sessions: state.sessions }) as StatsStore,
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    }
  )
);

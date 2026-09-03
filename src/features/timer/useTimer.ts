import { useCallback, useEffect, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { settingsToTimerConfig, useSettingsStore } from '@/features/settings/settingsStore';
import { useStatsStore } from '@/features/stats/statsStore';
import { notificationService } from '@/lib/notifications';
import { ScheduledNotificationHandle } from '@/lib/notifications/types';
import { playPhaseEndSound } from '@/lib/sound';

import { previewNextPhase, progressFraction } from './timerEngine';
import { useTimerStore } from './timerStore';
import { TimerPhase } from './types';

const TICK_INTERVAL_MS = 250;

export function useTimer() {
  const timer = useTimerStore((s) => s.timer);
  const config = useTimerStore((s) => s.config);
  const task = useTimerStore((s) => s.task);
  const hasHydrated = useTimerStore((s) => s.hasHydrated);
  const setConfig = useTimerStore((s) => s.setConfig);
  const setTaskAction = useTimerStore((s) => s.setTask);
  const startAction = useTimerStore((s) => s.start);
  const pauseAction = useTimerStore((s) => s.pause);
  const resetAction = useTimerStore((s) => s.reset);
  const skipAction = useTimerStore((s) => s.skip);
  const tickAction = useTimerStore((s) => s.tick);

  const settings = useSettingsStore((s) => s.settings);
  const addSession = useStatsStore((s) => s.addSession);

  // Keep the engine config in sync with settings. applyConfig() never disturbs an in-progress phase.
  useEffect(() => {
    setConfig(settingsToTimerConfig(settings));
  }, [settings, setConfig]);

  // Ask for notification permission as soon as the feature is enabled, so it's already granted
  // by the time a phase actually ends.
  useEffect(() => {
    if (settings.notificationsEnabled) {
      void notificationService.requestPermission();
    }
  }, [settings.notificationsEnabled]);

  const handleCompletedPhases = useCallback(
    (completed: TimerPhase[]) => {
      if (completed.length === 0) return;
      const now = Date.now();
      const currentTask = useTimerStore.getState().task.trim() || undefined;
      for (const phase of completed) {
        if (phase === 'work') {
          addSession({
            startedAt: now - config.workDuration * 1000,
            completedAt: now,
            durationSeconds: config.workDuration,
            task: currentTask,
          });
        }
      }
      if (settings.soundEnabled) {
        playPhaseEndSound(settings.soundId);
      }
    },
    [addSession, config.workDuration, settings.soundEnabled, settings.soundId]
  );

  // Drift-free tick loop: always re-derives remaining time from Date.now() via the engine, so a
  // throttled interval (e.g. a backgrounded web tab) never desyncs the countdown.
  useEffect(() => {
    if (timer.status !== 'running') return;
    const interval = setInterval(() => {
      handleCompletedPhases(tickAction(Date.now()));
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [timer.status, tickAction, handleCompletedPhases]);

  // Catch up immediately whenever the app (re)gains focus, e.g. after being backgrounded or
  // after the device was locked — no drift, since tick() recomputes from absolute timestamps.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        handleCompletedPhases(tickAction(Date.now()));
      }
    });
    return () => subscription.remove();
  }, [tickAction, handleCompletedPhases]);

  // Keep exactly one scheduled OS-level notification in sync with the currently running phase, so
  // the phase-end alert still fires even if the app is backgrounded, the tab is inactive, or the
  // device is locked.
  useEffect(() => {
    if (timer.status !== 'running' || timer.targetTimestamp == null || !settings.notificationsEnabled) {
      return;
    }
    let cancelled = false;
    let handle: ScheduledNotificationHandle | null = null;
    const targetTimestamp = timer.targetTimestamp;
    const nextPhase = previewNextPhase(timer, config);

    notificationService
      .schedulePhaseEnd({
        phase: timer.phase,
        nextPhase,
        endTimestamp: targetTimestamp,
        task: task.trim() || undefined,
      })
      .then((scheduled) => {
        if (cancelled) {
          void scheduled?.cancel();
        } else {
          handle = scheduled;
        }
      });

    return () => {
      cancelled = true;
      void handle?.cancel();
    };
    // `task` and `config` intentionally excluded: editing the task text or settings mid-session
    // shouldn't cancel/reschedule the already-armed notification for the running phase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.status, timer.targetTimestamp, timer.phase, settings.notificationsEnabled]);

  const progress = useMemo(() => progressFraction(timer), [timer]);

  return {
    phase: timer.phase,
    status: timer.status,
    remainingMs: timer.remainingMs,
    totalMs: timer.totalMs,
    targetTimestamp: timer.targetTimestamp,
    cyclesCompleted: timer.cyclesCompleted,
    cyclesUntilLongBreak: config.cyclesUntilLongBreak,
    progress,
    task,
    hasHydrated,
    setTask: setTaskAction,
    start: () => startAction(Date.now()),
    pause: () => pauseAction(Date.now()),
    reset: resetAction,
    skip: () => skipAction(Date.now()),
  };
}

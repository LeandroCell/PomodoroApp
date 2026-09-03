import { NotificationService, phaseEndBody, phaseEndTitle } from './types';

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

async function showNotification(title: string, body: string): Promise<void> {
  if (!isSupported() || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, { body, icon: '/icon.png', tag: 'pomodoro-phase-end' });
      return;
    }
  } catch {
    // Fall through to the plain Notification constructor below.
  }
  new Notification(title, { body });
}

export const notificationService: NotificationService = {
  async requestPermission() {
    if (!isSupported()) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  async schedulePhaseEnd({ phase, nextPhase, endTimestamp, task }) {
    if (!isSupported()) return null;
    const delayMs = Math.max(0, endTimestamp - Date.now());
    const title = phaseEndTitle(phase);
    const body = phaseEndBody(nextPhase, task);

    // Background tabs get their timers throttled by the browser, but they still fire
    // eventually — and our countdown display recomputes from Date.now() either way, so a
    // slightly-late notification never desyncs the actual timer state.
    const timeoutId = setTimeout(() => {
      void showNotification(title, body);
    }, delayMs);

    return {
      cancel: async () => {
        clearTimeout(timeoutId);
      },
    };
  },
};

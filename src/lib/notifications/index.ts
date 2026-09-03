import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { NotificationService, phaseEndBody, phaseEndTitle } from './types';

const CHANNEL_ID = 'pomodoro-phase-end';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let channelReady: Promise<void> | null = null;

function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();
  if (!channelReady) {
    channelReady = Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Pomodoro phase end',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    }).then(() => undefined);
  }
  return channelReady;
}

export const notificationService: NotificationService = {
  async requestPermission() {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  },

  async schedulePhaseEnd({ phase, nextPhase, endTimestamp, task }) {
    await ensureAndroidChannel();
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: phaseEndTitle(phase),
        body: phaseEndBody(nextPhase, task),
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: endTimestamp,
        channelId: CHANNEL_ID,
      },
    });
    return {
      cancel: () => Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
    };
  },
};

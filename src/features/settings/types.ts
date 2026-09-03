export type ColorSchemePreference = 'system' | 'light' | 'dark';

export type SoundId = 'chime' | 'bell' | 'digital' | 'none';

export interface Settings {
  /** Work session duration, in minutes. */
  workMinutes: number;
  /** Short break duration, in minutes. */
  shortBreakMinutes: number;
  /** Long break duration, in minutes. */
  longBreakMinutes: number;
  /** Number of work sessions before a long break. */
  cyclesUntilLongBreak: number;
  /** Automatically start the next phase when the current one ends. */
  autoStartNext: boolean;
  /** Whether to play a sound when a phase ends. */
  soundEnabled: boolean;
  soundId: SoundId;
  /** Whether to request/send local notifications when a phase ends. */
  notificationsEnabled: boolean;
  colorScheme: ColorSchemePreference;
}

export const DEFAULT_SETTINGS: Settings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesUntilLongBreak: 4,
  autoStartNext: false,
  soundEnabled: true,
  soundId: 'chime',
  notificationsEnabled: true,
  colorScheme: 'system',
};

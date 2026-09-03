import { createAudioPlayer } from 'expo-audio';

import { SoundId } from '@/features/settings/types';

const SOUND_SOURCES: Record<Exclude<SoundId, 'none'>, number> = {
  chime: require('../../assets/sounds/chime.wav'),
  bell: require('../../assets/sounds/bell.wav'),
  digital: require('../../assets/sounds/digital.wav'),
};

/** Plays a short built-in notification sound. expo-audio backs web, iOS and Android alike. */
export function playPhaseEndSound(soundId: SoundId): void {
  if (soundId === 'none') return;
  try {
    const player = createAudioPlayer(SOUND_SOURCES[soundId]);
    player.volume = 1;
    player.play();
    setTimeout(() => {
      try {
        player.remove();
      } catch {
        // Player may already have been released; safe to ignore.
      }
    }, 4000);
  } catch {
    // Best-effort: a failed sound (e.g. autoplay blocked before any user gesture on web)
    // should never break the timer itself.
  }
}

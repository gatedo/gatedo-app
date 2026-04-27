import { useCallback } from 'react';
import { useAppSettings } from '../context/AppSettingsContext';

let globalAudioInstance = null;

const SOUND_MAP = {
  soft: '/assets/sounds/meow-soft.mp3',
  loud: '/assets/sounds/meow-loud.mp3',
  happy: '/assets/sounds/meow-happy.mp3',
  alert: '/assets/sounds/dog-bark.mp3',
};

function triggerVibration(type) {
  if (!('vibrate' in navigator)) return;

  if (type === 'alert') {
    navigator.vibrate([200, 100, 200]);
    return;
  }

  navigator.vibrate(50);
}

export function useSound() {
  const { settings } = useAppSettings();

  const stopCurrentAudio = useCallback(() => {
    if (!globalAudioInstance) return;

    globalAudioInstance.pause();
    globalAudioInstance.currentTime = 0;
    globalAudioInstance = null;
  }, []);

  const playMeow = useCallback((type = 'soft') => {
    if (!settings.soundEnabled) return;

    stopCurrentAudio();

    let soundToPlay = type;
    if (type === 'random') {
      const meows = ['soft', 'loud', 'happy'];
      soundToPlay = meows[Math.floor(Math.random() * meows.length)];
    }

    const soundPath = SOUND_MAP[soundToPlay] || SOUND_MAP.soft;
    const audio = new Audio(`${soundPath}?v=${Date.now()}`);
    audio.volume = soundToPlay === 'alert' ? 0.7 : 0.1;

    globalAudioInstance = audio;

    audio.play()
      .then(() => {
        triggerVibration(soundToPlay);
      })
      .catch((error) => console.warn('Audio bloqueado:', error));

    audio.onended = () => {
      globalAudioInstance = null;
    };
  }, [settings.soundEnabled, stopCurrentAudio]);

  return { playMeow, stopCurrentAudio };
}

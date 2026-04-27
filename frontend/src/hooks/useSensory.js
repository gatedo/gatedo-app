import { useCallback } from 'react';
import { useAppSettings } from '../context/AppSettingsContext';

export default function useSensory() {
  const { settings } = useAppSettings();

  const trigger = useCallback((type = 'tap') => {
    if (!settings.soundEnabled) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === 'success') {
        [520, 680, 820].forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);
          gain.gain.setValueAtTime(0.05, ctx.currentTime + index * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + index * 0.08);
          osc.stop(ctx.currentTime + index * 0.08 + 0.2);
        });
      } else {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.1);
      }
    } catch (error) {
      console.error('Erro no sintetizador:', error);
    }

    if (navigator.vibrate) navigator.vibrate(10);
  }, [settings.soundEnabled]);

  return trigger;
}

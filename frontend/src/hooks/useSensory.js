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
      } else if (type === 'nav') {
        [880, 1240].forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = ctx.currentTime + index * 0.045;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.022, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.11);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.11);
        });
      } else {
        // Fade-in curto em vez de pular direto pro volume de pico — é o salto
        // instantâneo de ganho que soa como uma "batida seca"/clique percussivo.
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(420, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.09);

        gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.018);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.13);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.14);
      }
    } catch (error) {
      console.error('Erro no sintetizador:', error);
    }

    if (navigator.vibrate) navigator.vibrate(type === 'nav' ? 5 : 10);
  }, [settings.soundEnabled]);

  return trigger;
}

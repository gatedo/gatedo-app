import { useRef } from 'react';

let globalAudioInstance = null;

export function useSound() {
  const sounds = {
    soft: '/assets/sounds/meow-soft.mp3',
    loud: '/assets/sounds/meow-loud.mp3',
    happy: '/assets/sounds/meow-happy.mp3',
    alert: '/assets/sounds/dog-bark.mp3' // O intruso
  };

  const stopCurrentAudio = () => {
    if (globalAudioInstance) {
      globalAudioInstance.pause();
      globalAudioInstance.currentTime = 0;
      globalAudioInstance = null;
    }
  };

  const triggerVibration = (type) => {
    if (!("vibrate" in navigator)) return;
    if (type === 'alert') {
      navigator.vibrate([200, 100, 200]); // Vibração mais forte para o alerta
    } else {
      navigator.vibrate(50);
    }
  };

  const playMeow = (type = 'soft') => {
    stopCurrentAudio();

    let soundToPlay = type;
    
    // Trava de segurança: 'random' nunca sorteia o latido
    if (type === 'random') {
      const meows = ['soft', 'loud', 'happy'];
      soundToPlay = meows[Math.floor(Math.random() * meows.length)];
    }

    const soundPath = sounds[soundToPlay] || sounds.soft;
    const audio = new Audio(`${soundPath}?v=${Date.now()}`);
    
    // Volume diferenciado
    audio.volume = soundToPlay === 'alert' ? 0.7 : 0.1; 
    
    globalAudioInstance = audio;

    audio.play()
      .then(() => {
        triggerVibration(soundToPlay);
      })
      .catch(err => console.warn("🔊 Áudio bloqueado:", err));

    audio.onended = () => { globalAudioInstance = null; };
  };

  return { playMeow, stopCurrentAudio };
}
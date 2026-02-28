import { useRef } from 'react';

export function useSound() {
  const audioRef = useRef(null);

  const fadeOutAndStop = (audio) => {
    if (!audio) return;

    // Diminui o volume gradualmente em 200ms antes de parar
    const fadeInterval = setInterval(() => {
      if (audio.volume > 0.01) {
        audio.volume -= 0.01;
      } else {
        audio.pause();
        audio.currentTime = 0;
        clearInterval(fadeInterval);
      }
    }, 20); // Ajusta a cada 20ms para ser fluido
  };

  const playMeow = (type = 'soft') => {
    // 1. Se já houver som, aplica o fade-out antes de iniciar o próximo
    if (audioRef.current) {
      fadeOutAndStop(audioRef.current);
    }

    // 2. Prepara o novo áudio
    const audio = new Audio(`/assets/sounds/meow-${type}.mp3`);
    audio.volume = 0.05; // Volume inicial ultra-suave
    audioRef.current = audio;

    // 3. Play com tratamento de erro (interação do usuário)
    audio.play().catch(err => {
      console.log("Aguardando clique para liberar áudio.");
    });
  };

  return { playMeow };
}
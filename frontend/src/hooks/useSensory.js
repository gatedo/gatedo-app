import { useCallback } from 'react';

export default function useSensory() {
  const trigger = useCallback((type = 'tap') => {
    try {
      // Cria o contexto de áudio (o sintetizador do navegador)
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === 'success') {
        // Som de Sucesso (Acorde Mágico igual ao do arquivo)
        // Toca 3 notas rápidas
        [520, 680, 820].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gn = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
          gn.gain.setValueAtTime(0.05, ctx.currentTime + i * 0.08);
          gn.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
          osc.connect(gn);
          gn.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.08);
          osc.stop(ctx.currentTime + i * 0.08 + 0.2);
        });
      } else {
        // Som de Clique Padrão (Tap)
        oscillator.type = 'sine';
        // Frequência começa em 500Hz e cai rápido (efeito de gota/clique)
        oscillator.frequency.setValueAtTime(500, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
        
        // Volume: começa baixo e zera rápido
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.1);
      }

    } catch (e) {
      console.error("Erro no sintetizador:", e);
    }

    // Vibração (apenas Android)
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  return trigger;
}
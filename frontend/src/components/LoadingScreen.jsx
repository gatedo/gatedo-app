import React, { useMemo, useEffect } from 'react';
import { useSound } from '../hooks/useSound';

const CAT_PHRASES = [
  "Limpando as patinhas...",
  "Afiando as unhas...",
  "Caçando bugs pelo jardim...",
  "Enchendo o potinho de ração...",
  "Amassando pãozinho...",
  "Preparando os mimos..."
];

// 4 GIFs que vão alternar a cada navegação
const LOADING_GIFS = [
  '/assets/utils/loadcat1.gif',
  '/assets/utils/loadcat2.gif',
  '/assets/utils/loadcat3.gif',
  '/assets/utils/loadcat4.gif',
];

export function LoadingScreen({ isVisible }) {
  const { playMeow } = useSound();

  // Sorteia frase e gif juntos — só muda quando isVisible muda (nova navegação)
  const { phrase, gif } = useMemo(() => ({
    phrase: CAT_PHRASES[Math.floor(Math.random() * CAT_PHRASES.length)],
    gif:    LOADING_GIFS[Math.floor(Math.random() * LOADING_GIFS.length)],
  }), [isVisible]);

  useEffect(() => {
    if (isVisible) {
      const soundTypes = ['soft', 'loud'];
      const randomType = soundTypes[Math.floor(Math.random() * soundTypes.length)];
      playMeow(randomType);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#823fff',
      zIndex: 99999,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    }}>
      <img
        src={gif}
        alt="Carregando..."
        style={{ width: '150px' }}
      />
      <p style={{
        color: '#fbfbff70', marginTop: '20px', fontFamily: 'Nunito, sans-serif',
        fontWeight: '600', fontSize: '1.1rem', letterSpacing: '0.5px'
      }}>
        {phrase}
      </p>
    </div>
  );
}
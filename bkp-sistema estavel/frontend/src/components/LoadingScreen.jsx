import React, { useMemo } from 'react';

const CAT_PHRASES = [
  "Limpando as patinhas...",
  "Afiando as unhas...",
  "Caçando bugs pelo jardim...",
  "Enchendo o potinho de ração...",
  "Amassando pãozinho...",
  "Preparando os mimos..."
];

export function LoadingScreen({ isVisible }) {
  // Memoize para a frase não mudar durante o loading
  const phrase = useMemo(() => 
    CAT_PHRASES[Math.floor(Math.random() * CAT_PHRASES.length)], 
  [isVisible]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#FFFFFF', // Fundo sólido impede o "pisca" visual
      zIndex: 99999,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    }}>
      <img src="/assets/cat-walking.gif" alt="Carregando..." style={{ width: '150px' }} />
      <p style={{ 
        color: '#7865da70', marginTop: '20px', fontFamily: 'Nunito, sans-serif', 
        fontWeight: '600', fontSize: '1.1rem', letterSpacing: '0.5px'
      }}>
        {phrase} 🐾
      </p>
    </div>
  );
}
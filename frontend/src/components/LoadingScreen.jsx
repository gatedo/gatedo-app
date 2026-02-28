import React, { useMemo, useEffect } from 'react';
import { useSound } from '../hooks/useSound'; // Importamos seu hook

const CAT_PHRASES = [
  "Limpando as patinhas...",
  "Afiando as unhas...",
  "Caçando bugs pelo jardim...",
  "Enchendo o potinho de ração...",
  "Amassando pãozinho...",
  "Preparando os mimos..."
];

export function LoadingScreen({ isVisible }) {
  const { playMeow } = useSound(); // Inicializamos o som

  // Memoize para a frase não mudar durante o loading
  const phrase = useMemo(() => 
    CAT_PHRASES[Math.floor(Math.random() * CAT_PHRASES.length)], 
  [isVisible]);

  // Efeito para tocar o som assim que o loading aparecer
  useEffect(() => {
    if (isVisible) {
      // Sorteia entre 'soft', 'loud' ou 'happy' (se você os adicionou ao hook)
      const soundTypes = ['soft', 'loud']; 
      const randomType = soundTypes[Math.floor(Math.random() * soundTypes.length)];
      
      playMeow(randomType); // Toca o miado sorteado
    }
  }, [isVisible]); // Só dispara quando a visibilidade mudar

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#FFFFFF', 
      zIndex: 99999,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    }}>
      {/* Verifique se o nome do arquivo é gif-gatedo.gif ou cat-walking.gif conforme o print */}
      <img src="/assets/gif-gatedo.gif" alt="Carregando..." style={{ width: '150px' }} />
      <p style={{ 
        color: '#7865da70', marginTop: '20px', fontFamily: 'Nunito, sans-serif', 
        fontWeight: '600', fontSize: '1.1rem', letterSpacing: '0.5px'
      }}>
        {phrase} 🐾
      </p>
    </div>
  );
}
import React from "react";
// CORREÇÃO: O ficheiro está na mesma pasta
import CatIdentityCard, { CARD_GRADIENTS } from "./CatIdentityCard";
import useSensory from "../../hooks/useSensory";

// ... resto do componente ProfileCardSection

export default function ProfileCardSection({ cat, isFlipped, setIsFlipped, gradientIdx, setGradientIdx }) {
  const touch = useSensory();

  return (
    <div style={{ aspectRatio: '1.586/1' }} className="w-full max-w-lg mx-auto mb-6 relative">
      <CatIdentityCard 
        cat={cat} 
        gradientIndex={gradientIdx}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped(!isFlipped)}
        onPaletteClick={() => { 
          touch(); 
          setGradientIdx(prev => (prev + 1) % CARD_GRADIENTS.length); 
        }}
        onQrClick={() => console.log("Abrir ficha médica")}
      />
    </div>
  );
}
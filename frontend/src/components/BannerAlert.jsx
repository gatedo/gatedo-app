import { useState, useEffect } from 'react';
// Importação comentada para evitar o erro de "Failed to resolve" do Vite
// import { checkApiHealth } from '../services/api-health'; 

export function HealthBanner() {
  // Mudamos o estado inicial para false para o banner não aparecer
  const [isApiDown, setIsApiDown] = useState(false);

  useEffect(() => {
    /* Lógica de verificação pausada temporariamente para focar no design.
       Quando a API estiver pronta, basta descomentar este bloco.
       
    checkApiHealth().then(isHealthy => {
      setIsApiDown(!isHealthy);
    });
    */
  }, []);

  // Enquanto isApiDown for false, o banner nunca será renderizado
  if (!isApiDown) return null;

  return (
    <div className="bg-red-500 text-white p-3 text-center text-[10px] font-black uppercase tracking-widest relative z-[9999]">
      ⚠️ Instabilidade na conexão com o banco de dados.
    </div>
  );
}
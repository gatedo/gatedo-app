import { useState, useEffect, useRef } from 'react';
import { useSound } from './useSound';

// VARIÁVEIS GLOBAIS (fora do hook) para manter a memória entre abas
let globalLastStatus = { api: 'online', db: 'online' };
let isFirstCheckDone = false;

export function useSystemStatus() {
  const [status, setStatus] = useState({ api: 'loading', db: 'loading' });
  const { playMeow } = useSound();

  const checkHealth = async () => {
    try {
      const response = await fetch('https://app.gatedo.com/api/health');
      
      // Se a resposta não for OK (ex: 503), cai no catch
      if (!response.ok) throw new Error('Server Error');

      const data = await response.json();
      const currentApi = 'online';
      const currentDb = data.database === 'connected' ? 'online' : 'offline';

      // SÓ LATE se: já fizemos a 1ª carga E o estado mudou de online para offline
      if (isFirstCheckDone) {
        const apiCaiu = globalLastStatus.api === 'online' && currentApi === 'offline';
        const dbCaiu = globalLastStatus.db === 'online' && currentDb === 'offline';

        if (apiCaiu || dbCaiu) {
          playMeow('alert');
        }
      }

      // Atualiza a memória global e o estado local
      globalLastStatus = { api: currentApi, db: currentDb };
      isFirstCheckDone = true;
      setStatus({ api: currentApi, db: currentDb });

    } catch (error) {
      // Se era online e agora deu erro de rede/503: LATE!
      if (isFirstCheckDone && globalLastStatus.api === 'online') {
        playMeow('alert');
      }
      
      globalLastStatus = { api: 'offline', db: 'offline' };
      isFirstCheckDone = true;
      setStatus({ api: 'offline', db: 'offline' });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); 
    return () => clearInterval(interval);
  }, []);

  return { status, refresh: checkHealth };
}
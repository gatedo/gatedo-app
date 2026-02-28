import React, { useEffect, useState } from 'react';

export function StatusPage() {
  const [health, setHealth] = useState({ loading: true, api: 'checking', db: 'checking' });

  const checkStatus = async () => {
    try {
      const res = await fetch('https://app.gatedo.com/api/health');
      const data = await res.json();
      setHealth({ loading: false, api: 'online', db: data.database });
    } catch (err) {
      setHealth({ loading: false, api: 'offline', db: 'offline' });
    }
  };

  useEffect(() => { checkStatus(); }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>
      <h2>Status do Sistema 🐾</h2>
      <div style={{ margin: '20px', padding: '15px', borderRadius: '10px', backgroundColor: '#f4f3ff' }}>
        <p><strong>API Backend:</strong> {health.api === 'online' ? '🟢 Operacional' : '🔴 Fora do Ar'}</p>
        <p><strong>Banco de Dados:</strong> {health.db === 'connected' ? '🟢 Conectado' : '🔴 Erro de Conexão'}</p>
      </div>
      <button onClick={checkStatus} style={{ cursor: 'pointer', padding: '10px 20px', borderRadius: '5px', border: 'none', backgroundColor: '#7865da', color: 'white' }}>
        Atualizar Agora
      </button>
    </div>
  );
}
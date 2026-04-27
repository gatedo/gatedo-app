import { useState, useEffect } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { useSound } from './hooks/useSound';
import { usePWAInstall } from './hooks/usePWAInstall';
import gatedoLogo from './assets/gatedo-icon.svg';
import './App.css';

// ─── Cor primária do app — sincronizada com AppShell ─────────────────────────
const APP_THEME = '#8B4AFF';
const APP_BG    = '#0f0a1e';

function App() {
  const [count, setCount]       = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { installPrompt, handleInstallClick } = usePWAInstall();
  const { playMeow } = useSound();

  // ── Aplica theme-color dinamicamente (runtime) ────────────────────────────
  // Garante que a meta tag seja atualizada mesmo que o index.html base
  // já a tenha definida — útil quando a rota muda a cor (ex: AppShell).
  useEffect(() => {
    // theme-color — barra de status Android / Chrome
    let themeMeta = document.querySelector("meta[name='theme-color']");
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute('content', APP_THEME);

    // Cor de fundo do documento — evita flash branco durante carregamento
    document.body.style.backgroundColor       = APP_BG;
    document.documentElement.style.backgroundColor = APP_BG;

    return () => {
      document.body.style.backgroundColor       = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, []);

  const handleAction = () => {
    playMeow('happy');
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    // ── safe-area-inset-top: empurra o conteúdo para baixo da status bar ──
    // Necessário quando apple-mobile-web-app-status-bar-style = black-translucent,
    // pois nesse modo a barra flutua SOBRE o app — sem esse padding o conteúdo
    // fica embaixo do notch / Dynamic Island no iPhone.
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>

      {/* Tela de Loading Global */}
      <LoadingScreen isVisible={isLoading} />

      <div>
        <a href="https://gatedo.com" target="_blank" rel="noreferrer">
          <img src={gatedoLogo} className="logo" alt="Gatedo logo" />
        </a>
      </div>

      <h1>Gatedo App</h1>

      <div className="card">
        {/* Botão de instalação PWA — aparece só no Android/Chrome */}
        {installPrompt && (
          <button
            onClick={handleInstallClick}
            style={{
              backgroundColor: APP_THEME,
              color: 'white',
              marginBottom: '10px',
              display: 'block',
              width: '100%',
            }}
          >
            📲 Instalar Aplicativo Gatedo
          </button>
        )}

        {/* Botão principal com feedback sensorial */}
        <button onClick={() => { setCount(c => c + 1); handleAction(); }}>
          Acessar Painel: {count} 🐾
        </button>

        <p>Bem-vindo ao sistema de gestão felina.</p>
      </div>

      <p className="read-the-docs">
        Clique no logo para saber mais sobre o projeto
      </p>
    </div>
  );
}

export default App;
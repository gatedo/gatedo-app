import { useState } from 'react'
import { LoadingScreen } from './components/LoadingScreen';
import { useSound } from './hooks/useSound';
import { usePWAInstall } from './hooks/usePWAInstall';
import gatedoLogo from './assets/gatedo-icon.svg' 
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false);
  const { installPrompt, handleInstallClick } = usePWAInstall();
  const { playMeow } = useSound();

  // Função para simular o carregamento com som e o gatinho
  const handleAction = () => {
    playMeow('happy'); // Toca o som sensorial
    setIsLoading(true); // Ativa o gatinho caminhando
    
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <>
      {/* Tela de Loading Global */}
      <LoadingScreen isVisible={isLoading} />
      
      <div>
        <a href="https://gatedo.com" target="_blank" rel="noreferrer">
          <img src={gatedoLogo} className="logo" alt="Gatedo logo" />
        </a>
      </div>

      <h1>Gatedo App</h1>

      <div className="card">
        {/* Botão de Instalação PWA */}
        {installPrompt && (
          <button 
            onClick={handleInstallClick}
            style={{ 
              backgroundColor: '#2ecc71', 
              color: 'white', 
              marginBottom: '10px',
              display: 'block',
              width: '100%' 
            }}
          >
            📲 Instalar Aplicativo Gatedo
          </button>
        )}

        {/* Botão Principal com Feedback Sensorial */}
        <button onClick={() => {
          setCount((count) => count + 1);
          handleAction();
        }}>
          Acessar Painel: {count} 🐾
        </button>

        <p>
          Bem-vindo ao sistema de gestão felina.
        </p>
      </div>

      <p className="read-the-docs">
        Clique no logo para saber mais sobre o projeto
      </p>
    </>
  );
}

export default App;
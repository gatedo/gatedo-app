import { useRegisterSW } from 'virtual:pwa-register/react';

// Quem já tem o app instalado pode ficar dias com a aba aberta em segundo
// plano sem nunca recarregar — sem isso, uma correção publicada nunca chega
// até a pessoa fechar e abrir o app de novo por conta própria. Isso mostra
// um aviso assim que detecta versão nova e só atualiza quando a pessoa
// confirma (nada de recarregar a tela sozinho no meio do uso).
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => {
        registration.update().catch(() => {});
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[999] px-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
      <div
        className="max-w-[520px] mx-auto flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #8B4AFF 0%, #4B40C6 100%)' }}
      >
        <span className="text-xl leading-none">✨</span>
        <p className="flex-1 text-white text-[12px] font-bold leading-snug">
          Atualização disponível — tem melhorias novas esperando por você.
        </p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="shrink-0 bg-white text-[#4B40C6] text-[12px] font-black px-3.5 py-2 rounded-xl active:scale-95 transition-transform"
        >
          Atualizar
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { getInstallPrompt, subscribeInstallPrompt, triggerInstall } from '../utils/pwaInstall';

// Detecta se é iOS (iPhone, iPad, iPod)
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Detecta se já está rodando como PWA instalado
const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(getInstallPrompt()); // Android/Chrome
  const [showIOSBanner, setShowIOSBanner] = useState(false); // iOS manual

  useEffect(() => {
    // Já instalado como PWA → não mostra nada
    if (isInStandaloneMode()) return;

    if (isIOS()) {
      // iOS não suporta beforeinstallprompt — mostra banner manual
      const dismissed = sessionStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) {
        const t = setTimeout(() => setShowIOSBanner(true), 3000);
        return () => clearTimeout(t);
      }
      return;
    }

    // Android/Chrome — assina a fonte única (ver utils/pwaInstall.js);
    // já chega com o valor certo mesmo se o evento tiver disparado antes
    // deste componente montar.
    return subscribeInstallPrompt(setInstallPrompt);
  }, []);

  // Android: abre o prompt nativo
  const handleInstallClick = async () => {
    const outcome = await triggerInstall();
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  // iOS: fecha o banner e não mostra de novo nessa sessão
  const dismissIOSBanner = () => {
    setShowIOSBanner(false);
    sessionStorage.setItem('pwa-ios-dismissed', '1');
  };

  return {
    installPrompt,      // Android — truthy quando disponível
    handleInstallClick, // Android — dispara o prompt nativo
    showIOSBanner,      // iOS — true para exibir o banner manual
    dismissIOSBanner,   // iOS — fecha o banner
  };
}

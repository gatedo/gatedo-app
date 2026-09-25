// Captura o `beforeinstallprompt` uma única vez, no nível do módulo — não
// dentro de um hook/componente. O evento só dispara 1x por carregamento de
// página e não é reemitido; se cada componente registrasse seu próprio
// listener (como usePWAInstall fazia antes), só o primeiro a montar
// (a AppShell, no boot) recebia o evento — qualquer outro componente que
// monte depois (ex.: PushPermissionPrompt, bem depois de uma interação)
// nunca veria `installPrompt`. Este módulo age como fonte única: guarda o
// evento capturado e notifica quem se inscrever, na hora que se inscrever.
let deferredPrompt = null;
const listeners = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach((cb) => cb(deferredPrompt));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((cb) => cb(null));
  });
}

export function getInstallPrompt() {
  return deferredPrompt;
}

export function subscribeInstallPrompt(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export async function triggerInstall() {
  if (!deferredPrompt) return null;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    deferredPrompt = null;
    listeners.forEach((cb) => cb(null));
  }
  return outcome;
}

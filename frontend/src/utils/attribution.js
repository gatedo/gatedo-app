// Origem do usuário — anon_id persistente + primeiro toque (UTM/referrer),
// gravado uma única vez no navegador e nunca sobrescrito. Usado pelo
// track() (utils/track.js) pra ligar visitante → cadastro no funil.
const ANON_ID_KEY = 'gatedo_anon_id';
const FIRST_TOUCH_KEY = 'gatedo_first_touch';

function uuid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getAnonId() {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Chama uma vez no boot do app. Só grava se ainda não existir — primeiro
// toque não é sobrescrito por visitas seguintes.
export function captureFirstTouch() {
  try {
    if (localStorage.getItem(FIRST_TOUCH_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    const utmContent = params.get('utm_content');
    const referrer = document.referrer || null;

    if (!utmSource && !utmMedium && !utmCampaign && !utmContent && !referrer) return;

    localStorage.setItem(
      FIRST_TOUCH_KEY,
      JSON.stringify({ utmSource, utmMedium, utmCampaign, utmContent, referrer, capturedAt: new Date().toISOString() }),
    );
  } catch {
    // sem localStorage (modo privado etc.) — segue sem first-touch
  }
}

export function getFirstTouch() {
  try {
    const raw = localStorage.getItem(FIRST_TOUCH_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

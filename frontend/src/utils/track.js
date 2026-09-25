import api from '../services/api';
import { getAnonId, getFirstTouch } from './attribution';

// track(name, props) — nunca quebra a tela. Fila simples em localStorage
// quando offline/falha de rede; tenta esvaziar a cada chamada nova.
// Eventos críticos (cadastro, compra) NÃO passam por aqui — são gravados
// pelo servidor direto (ver EventsService no back-end).
const QUEUE_KEY = 'gatedo_event_queue';
const MAX_QUEUE = 30;

function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)));
  } catch {
    // ignora — telemetria não pode quebrar a tela
  }
}

function buildPayload(name, props) {
  const firstTouch = getFirstTouch();
  return {
    name,
    props: props || undefined,
    anonId: getAnonId(),
    utmSource: firstTouch.utmSource,
    utmMedium: firstTouch.utmMedium,
    utmCampaign: firstTouch.utmCampaign,
    utmContent: firstTouch.utmContent,
    referrer: firstTouch.referrer,
  };
}

async function send(payload) {
  await api.post('/events', payload);
}

async function flushQueue() {
  const queue = readQueue();
  if (!queue.length) return;
  writeQueue([]);
  for (const payload of queue) {
    try {
      await send(payload);
    } catch {
      writeQueue([...readQueue(), payload]);
    }
  }
}

export function track(name, props) {
  try {
    const payload = buildPayload(name, props);
    flushQueue()
      .then(() => send(payload))
      .catch(() => writeQueue([...readQueue(), payload]));
  } catch {
    // nunca deixa o tracking quebrar a tela
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flushQueue().catch(() => {}));
}

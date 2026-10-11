// Atendimento com consentimento no WhatsApp: regras puras (sem Prisma/HTTP)
// do bot de entrada, do opt-in/opt-out e de quem pode receber disparo.

export const IMPORTED_TAG = 'importado-sem-optin';
export const INBOUND_TAG = 'inbound';
export const OPTIN_SOURCES = ['app', 'bio', 'bot'] as const;
export type OptinSource = (typeof OPTIN_SOURCES)[number];

// O menu vale por 24h: depois disso "1", "2", "3" voltam a ser texto comum.
export const MENU_TTL_MS = 24 * 60 * 60 * 1000;

const MENU_KEYWORDS = ['gato', 'oi', 'ola', 'achados', 'app'];
const OPTOUT_KEYWORDS = ['sair', 'parar', 'stop'];

export function foldWords(text: string): string[] {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export type BotIntent = 'optout' | 'menu' | 'option_app' | 'option_group' | 'option_human' | null;

/**
 * SAIR/PARAR só como a mensagem inteira ("sair", "Parar!") — "não quero parar
 * de receber" não é opt-out. Palavra do menu vale em qualquer posição
 * ("oi, tudo bem?"). 1/2/3 só contam com menu enviado nas últimas 24h.
 */
export function detectIntent(message: string, menuSentAt: Date | string | null | undefined, now = new Date()): BotIntent {
  const words = foldWords(message);
  if (!words.length) return null;
  if (words.length === 1 && OPTOUT_KEYWORDS.includes(words[0])) return 'optout';

  const menuActive = Boolean(menuSentAt) && now.getTime() - new Date(menuSentAt as any).getTime() <= MENU_TTL_MS;
  if (menuActive && words.length === 1) {
    if (words[0] === '1') return 'option_app';
    if (words[0] === '2') return 'option_group';
    if (words[0] === '3') return 'option_human';
  }
  if (words.some((w) => MENU_KEYWORDS.includes(w))) return 'menu';
  return null;
}

// ── Textos do bot ───────────────────────────────────────────────────────────
export type ConsentBotTexts = {
  menu: string;
  app: string;
  group: string;
  human: string;
  optout: string;
};

export const DEFAULT_CONSENT_BOT_TEXTS: ConsentBotTexts = {
  menu: 'Oi! Aqui é o Gatedo 🐾 Escolhe uma opção:\n1 – Acessar o app grátis\n2 – Entrar no grupo Achados do Gatedo\n3 – Falar com o Diego',
  app: 'Aqui está o app do Gatedo, é grátis: {link}',
  group: 'Entra no grupo Achados do Gatedo: {link}\nOs links do grupo são de indicação: o Gatedo pode ganhar comissão, sem custo extra pra você.',
  human: 'Combinado! O Diego vai te responder por aqui em breve. 🐾',
  optout: 'Pronto, não envio mais mensagens.',
};

export const DEFAULT_LINKS = {
  app: 'https://app.gatedo.com?utm_source=whatsapp&utm_medium=bot',
  group: 'https://chat.whatsapp.com/GEruz4q0zeKDXDGnnW55Zy',
};

export const fillLink = (text: string, link: string) => text.replace('{link}', link);

// ── Quem pode receber ───────────────────────────────────────────────────────
export type ConsentState = {
  optin?: boolean | null;
  optoutAt?: Date | string | null;
  humanHandoffAt?: Date | string | null;
};

export type SendPurpose = 'campaign' | 'reply';

/**
 * campaign = disparo (botão Disparar, lote): exige opt-in se o número exigir
 * (o principal sempre exige). reply = resposta a quem escreveu primeiro.
 * Opt-out bloqueia tudo, em qualquer número.
 */
export function sendBlockReason(
  lead: ConsentState | null,
  purpose: SendPurpose,
  sender: { requireOptin: boolean },
): string | null {
  if (lead?.optoutAt) return 'opt-out: o contato pediu para não receber mensagens';
  if (purpose === 'campaign' && sender.requireOptin && !lead?.optin) return 'sem consentimento (opt-in)';
  return null;
}

// ── Números remetentes ──────────────────────────────────────────────────────
// Principal: só envia com consentimento. Outros números (publicidade) ficam em
// gateways próprios (outro serviço do wa-gateway no Render, com segredo
// próprio); a trava de opt-in é configurável por número.
export type WaSender = {
  id: string;
  label: string;
  phone: string;
  provider: 'gateway' | 'meta';
  gatewayUrl: string;
  // Nome da variável de ambiente com o segredo do gateway (o segredo em si
  // nunca fica no banco nem vai pro front).
  secretEnv: string;
  requireOptin: boolean;
  active: boolean;
};

export function sanitizeSender(raw: any, index: number): WaSender {
  const id = String(raw?.id || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || `numero_${index + 1}`;
  const secretEnv = String(raw?.secretEnv || '').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
  const gatewayUrl = String(raw?.gatewayUrl || '').trim().replace(/\/+$/, '');
  if (gatewayUrl && !/^https:\/\//.test(gatewayUrl)) throw new Error(`Gateway de "${id}" precisa ser https.`);
  return {
    id,
    label: String(raw?.label || id).trim().slice(0, 60),
    phone: String(raw?.phone || '').replace(/[^\d]/g, ''),
    provider: raw?.provider === 'meta' ? 'meta' : 'gateway',
    gatewayUrl,
    secretEnv,
    // Padrão seguro: exige opt-in. Só desliga explicitamente (false).
    requireOptin: raw?.requireOptin !== false,
    active: raw?.active !== false,
  };
}

/** Telefone BR para opt-in: 10–13 dígitos, devolve com 55. null se inválido. */
export function normalizeBrPhone(phone: string): string | null {
  const digits = String(phone ?? '').replace(/[^\d]/g, '');
  const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
  if (!/^[1-9]{2}9?\d{8}$/.test(local)) return null;
  const withNine = local.length === 10 ? `${local.slice(0, 2)}9${local.slice(2)}` : local;
  return `55${withNine}`;
}

/** Início do dia em America/Sao_Paulo (UTC-3 fixo), em UTC. */
export function startOfDayBrt(now = new Date()): Date {
  const offset = 3 * 60 * 60 * 1000;
  const brt = new Date(now.getTime() - offset);
  return new Date(Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth(), brt.getUTCDate()) + offset);
}

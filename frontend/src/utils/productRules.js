// Espelho de backend/src/store/product-rules.ts para o painel e a loja.
// Mudou uma regra lá? Mude aqui — backend/src/store/product-rules.spec.ts
// roda os mesmos casos contra os dois arquivos.

export const STORE_CATEGORIES = [
  'Alimentação', 'Petisco', 'Higiene', 'Hidratação',
  'Enriquecimento', 'Conforto', 'Pelagem', 'Transporte',
];
export const LEGACY_CATEGORY = 'Saúde';
export const BLOCKED_CATEGORY = 'Medicamento';
export const HIDDEN_CATEGORIES = [LEGACY_CATEGORY, BLOCKED_CATEGORY];
export const MEDICINE_MESSAGE = 'Medicamento veterinário não entra na loja do Gatedo';

export const PRODUCT_ROLES = ['heroi', 'grupo-frente', 'grupo', 'teste-margem', 'reserva'];
export const PRODUCT_BADGES = [
  'Em teste nos gatos', 'Testado pelos gatos', 'Recompra',
  'Oferta do dia', 'Achado', 'Teste de margem',
];
export const GANCHO_MAX = 120;
export const PRICE_STALE_MS = 24 * 60 * 60 * 1000;

export const HEALTH_WARNING = 'Descreva o produto e o uso, não resultado de saúde.';
export const HEALTH_TERMS = [
  'previne', 'prevenção', 'trata', 'tratamento', 'cura', 'combate',
  'elimina bactérias', 'bactéria', 'hálito', 'limpa os dentes',
  'intestino', 'imunidade', 'saúde em 1º lugar',
];

export const AFFILIATE_DISCLOSURE = 'Publi · link de indicação. Se você comprar, o Gatedo ganha uma comissão e você não paga nada a mais. É isso que ajuda a manter o app gratuito.';
export const AFFILIATE_INFO_URL = 'https://gatedo.com/indicacoes.html';

// Loja externa (Shopee, Mercado Livre, Amazon…): tudo que não é produto próprio.
export function isExternalStoreProduct(product) {
  return !!product && product.platform !== 'Gatedo';
}

export function foldText(text) {
  return Array.from(String(text ?? ''), (ch) => {
    const folded = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return folded.length === 1 ? folded : ch;
  }).join('').toLowerCase();
}

export function sameName(a, b) {
  return foldText(String(a ?? '').trim()) === foldText(String(b ?? '').trim());
}

export function isBlockedCategory(name) {
  return foldText(String(name ?? '')).trim().startsWith('medicamento');
}

export function isHiddenCategory(name) {
  return HIDDEN_CATEGORIES.some((c) => sameName(c, name)) || isBlockedCategory(name);
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

export function splitImageUrls(raw) {
  const text = Array.isArray(raw) ? raw.join('\n') : String(raw ?? '');
  const out = [];
  for (const token of text.split(/[,\n\r\s]+/)) {
    for (const part of token.split(/\.?(?=https?:\/\/)/)) {
      const url = part.trim();
      if (url && !out.includes(url)) out.push(url);
    }
  }
  return out;
}

export function isValidImageUrl(url) {
  let parsed;
  try { parsed = new URL(url); } catch { return false; }
  if (parsed.protocol !== 'https:') return false;
  return IMAGE_EXT.test(parsed.pathname) || parsed.hostname.endsWith('susercontent.com');
}

export function normalizeImages(raw) {
  const urls = splitImageUrls(raw);
  return {
    valid: urls.filter(isValidImageUrl),
    invalid: urls.filter((u) => !isValidImageUrl(u)),
  };
}

export function isValidAffiliateLink(url) {
  if (!url) return false;
  try { return new URL(String(url).trim()).protocol === 'https:'; } catch { return false; }
}

export function publishBlockers(p) {
  const errors = [];
  if (!isValidAffiliateLink(p.linkApp)) errors.push('Link de afiliado (https) obrigatório para publicar.');
  if (!(Number(p.price) > 0)) errors.push('Preço maior que zero obrigatório para publicar.');
  if (!(p.images || []).some(isValidImageUrl)) errors.push('Pelo menos 1 imagem válida obrigatória para publicar.');
  if (p.categoryName !== undefined && isHiddenCategory(p.categoryName)) {
    errors.push(`Categoria "${p.categoryName}" não é publicada na loja; recategorize antes.`);
  }
  return errors;
}

export function isPriceStale(priceCheckedAt, now = new Date()) {
  if (!priceCheckedAt) return true;
  return now.getTime() - new Date(priceCheckedAt).getTime() > PRICE_STALE_MS;
}

export function findHealthClaims(text) {
  const folded = foldText(String(text ?? ''));
  const hits = [];
  for (const term of HEALTH_TERMS) {
    const escaped = foldText(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}s?(?![\\p{L}\\p{N}])`, 'gu');
    for (const m of folded.matchAll(re)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (!hits.some((h) => start < h.end && end > h.start)) hits.push({ start, end, term });
    }
  }
  return hits.sort((a, b) => a.start - b.start);
}

export function normalizeBadge(badge) {
  if (!badge) return null;
  return PRODUCT_BADGES.find((b) => sameName(b, badge)) ?? null;
}

export function shortProductName(name) {
  return String(name ?? '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

export function formatBRL(value) {
  return Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatCheckedAt(date) {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(date));
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('day')}/${get('month')} ${get('hour')}:${get('minute')}`;
}

function storePreposition(platform) {
  return /^mercado/i.test(platform) ? 'no' : 'na';
}

export function groupPostMissing(p) {
  const missing = [];
  if (!(Number(p.price) > 0)) missing.push('preço');
  if (!(p.linkGroup || p.linkApp)) missing.push('link');
  if (!p.priceCheckedAt) missing.push('data do preço');
  return missing;
}

export function buildGroupPost(p) {
  const name = shortProductName(p.name);
  const gancho = String(p.gancho ?? '').trim();
  const platform = String(p.platform ?? '').trim() || 'loja';
  return [
    'Publi · link de indicação',
    gancho ? `${name} — ${gancho}` : name,
    `💰 R$ ${formatBRL(p.price)} ${storePreposition(platform)} ${platform}`,
    `👉 ${(p.linkGroup || p.linkApp || '').trim()}`,
    `Preço visto em ${p.priceCheckedAt ? formatCheckedAt(p.priceCheckedAt) : '—'}; pode mudar.`,
  ].join('\n');
}

// Link que o app usa (linkApp; externalLink é o campo antigo).
export function appLink(product) {
  return product?.linkApp || product?.externalLink || '';
}

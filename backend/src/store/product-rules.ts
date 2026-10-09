// Regras da loja "Achados do Gatedo" — funções puras, sem Prisma, pra serem
// usadas pelo controller, pelo import e pelos testes.
//
// O front tem um espelho em frontend/src/utils/productRules.js; o teste
// product-rules.spec.ts roda os mesmos casos contra os dois arquivos.

export const STORE_CATEGORIES = [
  'Alimentação', 'Petisco', 'Higiene', 'Hidratação',
  'Enriquecimento', 'Conforto', 'Pelagem', 'Transporte',
];
// Saúde: legado, não aceita produto novo e não aparece no app.
export const LEGACY_CATEGORY = 'Saúde';
export const BLOCKED_CATEGORY = 'Medicamento';
export const HIDDEN_CATEGORIES = [LEGACY_CATEGORY, BLOCKED_CATEGORY];
export const MEDICINE_MESSAGE = 'Medicamento veterinário não entra na loja do Gatedo';

// Filtro Prisma do que o app pode ver: publicado e fora de Saúde/Medicamento.
export const PUBLIC_PRODUCT_WHERE = {
  status: 'published',
  category: { name: { notIn: HIDDEN_CATEGORIES } },
};

export const PRODUCT_STATUSES = ['draft', 'published'] as const;
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

// Tira acento caractere a caractere, sem mudar o tamanho do texto — assim os
// índices do texto normalizado batem com o original (o modal destaca trechos).
export function foldText(text: string): string {
  return Array.from(String(text ?? ''), (ch) => {
    const folded = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return folded.length === 1 ? folded : ch;
  }).join('').toLowerCase();
}

export function sameName(a: string | null | undefined, b: string | null | undefined): boolean {
  return foldText(String(a ?? '').trim()) === foldText(String(b ?? '').trim());
}

export function isBlockedCategory(name: string | null | undefined): boolean {
  return foldText(String(name ?? '')).trim().startsWith('medicamento');
}

export function isHiddenCategory(name: string | null | undefined): boolean {
  return HIDDEN_CATEGORIES.some((c) => sameName(c, name)) || isBlockedCategory(name);
}

// ── Imagens ─────────────────────────────────────────────────────────────────
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

// Aceita string (vírgula/quebra de linha) ou array. Separa URLs coladas
// ("...a.webp.https://b..." ou "...a.webphttps://b...").
export function splitImageUrls(raw: string | string[] | null | undefined): string[] {
  const text = Array.isArray(raw) ? raw.join('\n') : String(raw ?? '');
  const out: string[] = [];
  for (const token of text.split(/[,\n\r\s]+/)) {
    for (const part of token.split(/\.?(?=https?:\/\/)/)) {
      const url = part.trim();
      if (url && !out.includes(url)) out.push(url);
    }
  }
  return out;
}

export function isValidImageUrl(url: string): boolean {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return false; }
  if (parsed.protocol !== 'https:') return false;
  return IMAGE_EXT.test(parsed.pathname) || parsed.hostname.endsWith('susercontent.com');
}

export function normalizeImages(raw: string | string[] | null | undefined) {
  const urls = splitImageUrls(raw);
  return {
    valid: urls.filter(isValidImageUrl),
    invalid: urls.filter((u) => !isValidImageUrl(u)),
  };
}

export function isValidAffiliateLink(url: string | null | undefined): boolean {
  if (!url) return false;
  try { return new URL(String(url).trim()).protocol === 'https:'; } catch { return false; }
}

// ── Publicação ──────────────────────────────────────────────────────────────
export function publishBlockers(p: {
  linkApp?: string | null; price?: number | string | null; images?: string[] | null; categoryName?: string | null;
}): string[] {
  const errors: string[] = [];
  if (!isValidAffiliateLink(p.linkApp)) errors.push('Link de afiliado (https) obrigatório para publicar.');
  if (!(Number(p.price) > 0)) errors.push('Preço maior que zero obrigatório para publicar.');
  if (!(p.images || []).some(isValidImageUrl)) errors.push('Pelo menos 1 imagem válida obrigatória para publicar.');
  if (p.categoryName !== undefined && isHiddenCategory(p.categoryName)) {
    errors.push(`Categoria "${p.categoryName}" não é publicada na loja; recategorize antes.`);
  }
  return errors;
}

export function isPriceStale(priceCheckedAt: Date | string | null | undefined, now: Date = new Date()): boolean {
  if (!priceCheckedAt) return true;
  return now.getTime() - new Date(priceCheckedAt).getTime() > PRICE_STALE_MS;
}

// ── Promessa de saúde ──────────────────────────────────────────────────────
export function findHealthClaims(text: string | null | undefined): Array<{ start: number; end: number; term: string }> {
  const folded = foldText(String(text ?? ''));
  const hits: Array<{ start: number; end: number; term: string }> = [];
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

// ── Badge, tags ────────────────────────────────────────────────────────────
export function normalizeBadge(badge: string | null | undefined): string | null {
  if (!badge) return null;
  return PRODUCT_BADGES.find((b) => sameName(b, badge)) ?? null;
}

export function parseTags(tags: unknown): { subid: string | null; role: string | null; tags: string[] } {
  const list = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];
  let subid: string | null = null;
  let role: string | null = null;
  const rest: string[] = [];
  for (const t of list) {
    if (/^subid:/i.test(t)) subid = t.slice(6).trim() || null;
    else if (PRODUCT_ROLES.includes(t.toLowerCase())) role = t.toLowerCase();
    else rest.push(t);
  }
  return { subid, role, tags: rest };
}

// ── Copiar post ────────────────────────────────────────────────────────────
export function shortProductName(name: string): string {
  return String(name ?? '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

export function formatBRL(value: number | string): string {
  return Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatCheckedAt(date: Date | string): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(date));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('day')}/${get('month')} ${get('hour')}:${get('minute')}`;
}

function storePreposition(platform: string): string {
  return /^mercado/i.test(platform) ? 'no' : 'na';
}

export type PostProduct = {
  name: string; gancho?: string | null; price: number | string; platform?: string | null;
  linkApp?: string | null; linkGroup?: string | null; priceCheckedAt?: Date | string | null;
};

export function groupPostMissing(p: PostProduct): string[] {
  const missing: string[] = [];
  if (!(Number(p.price) > 0)) missing.push('preço');
  if (!(p.linkGroup || p.linkApp)) missing.push('link');
  if (!p.priceCheckedAt) missing.push('data do preço');
  return missing;
}

export function buildGroupPost(p: PostProduct): string {
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

// ── Import ─────────────────────────────────────────────────────────────────
// Aceita o formato do export (JSON) + campos novos. Nunca grava: só diz o que
// entraria, como rascunho ou publicado, ou por que falhou.
export type ImportCategory = { id: string; name: string };
export type ImportResult =
  | { ok: true; index: number; name: string; status: 'draft' | 'published'; reasons: string[]; warnings: string[]; data: Record<string, any> }
  | { ok: false; index: number; name: string; error: string };

export function normalizeImportItem(raw: any, index: number, categories: ImportCategory[], now: Date = new Date()): ImportResult {
  const name = String(raw?.name ?? '').trim();
  if (!raw || typeof raw !== 'object') return { ok: false, index, name: '', error: 'Item não é um objeto.' };
  if (!name) return { ok: false, index, name: '', error: 'Sem nome.' };

  const byId = raw.categoryId ? categories.find((c) => c.id === raw.categoryId) : undefined;
  const categoryName = byId?.name ?? String(raw.categoryName ?? '').trim();
  if (isBlockedCategory(categoryName)) return { ok: false, index, name, error: MEDICINE_MESSAGE };
  if (!categoryName) return { ok: false, index, name, error: 'Sem categoria (categoryId ou categoryName).' };
  if (sameName(categoryName, LEGACY_CATEGORY)) return { ok: false, index, name, error: 'Categoria "Saúde" não aceita produto novo.' };
  const category = byId ?? categories.find((c) => sameName(c.name, categoryName));
  if (!category) return { ok: false, index, name, error: `Categoria "${categoryName}" não existe.` };

  const price = Number(String(raw.price ?? 0).replace(',', '.'));
  if (!Number.isFinite(price) || price < 0) return { ok: false, index, name, error: 'Preço inválido.' };

  const reasons: string[] = [];
  const warnings: string[] = [];
  const images = normalizeImages(raw.images);
  if (images.invalid.length) warnings.push(`Imagens descartadas: ${images.invalid.join(' ')}`);

  const parsed = parseTags(raw.tags);
  const role = PRODUCT_ROLES.includes(raw.role) ? raw.role : parsed.role;
  const badge = normalizeBadge(raw.badge);
  if (raw.badge && !badge) warnings.push(`Badge "${raw.badge}" fora da lista; ficou vazio.`);
  if (findHealthClaims(raw.description).length) warnings.push(HEALTH_WARNING);

  const linkApp = String(raw.linkApp ?? raw.externalLink ?? '').trim() || null;
  const linkGroup = String(raw.linkGroup ?? '').trim() || null;
  const gancho = String(raw.gancho ?? '').trim().slice(0, GANCHO_MAX) || null;
  const commission = raw.commissionPct === null || raw.commissionPct === undefined || raw.commissionPct === ''
    ? null : Number(raw.commissionPct);

  const blockers = publishBlockers({ linkApp, price, images: images.valid, categoryName: category.name });
  const status: 'draft' | 'published' = raw.status === 'published' && blockers.length === 0 ? 'published' : 'draft';
  if (status === 'draft') reasons.push(...(blockers.length ? blockers : ['Sem status "published" no arquivo.']));

  return {
    ok: true, index, name, status, reasons, warnings,
    data: {
      name,
      description: String(raw.description ?? ''),
      price,
      promoPrice: raw.promoPrice ? Number(raw.promoPrice) : null,
      images: images.valid,
      isDigital: !!raw.isDigital,
      stock: Number(raw.stock) || 0,
      platform: raw.platform || null,
      badge,
      videoReview: raw.videoReview || null,
      tags: parsed.tags,
      entitlementProductId: raw.entitlementProductId || null,
      categoryId: category.id,
      status,
      linkApp,
      linkGroup,
      externalLink: linkApp,
      subid: String(raw.subid ?? '').trim() || parsed.subid,
      role: role || null,
      commissionPct: commission !== null && Number.isFinite(commission) ? commission : null,
      gancho,
      priceCheckedAt: raw.priceCheckedAt ? new Date(raw.priceCheckedAt) : price > 0 ? now : null,
    },
  };
}

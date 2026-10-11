// Regras puras da busca/cadastro automático de produtos de afiliado (Shopee e
// Mercado Livre) e da rotina diária. Sem Prisma nem HTTP, pra testar isolado.

import { foldText, formatBRL } from '../product-rules';

// ── Oferta Shopee (productOfferV2) ──────────────────────────────────────────
// A API devolve números como string; comissão vem em fração ("0.12" = 12%).
export type ShopeeOfferNode = {
  itemId: number | string;
  shopId: number | string;
  productName: string;
  shopName?: string | null;
  shopType?: number[] | null;
  price?: string | number | null;
  priceMin?: string | number | null;
  commissionRate?: string | number | null;
  sellerCommissionRate?: string | number | null;
  shopeeCommissionRate?: string | number | null;
  commission?: string | number | null;
  sales?: number | string | null;
  ratingStar?: string | number | null;
  imageUrl?: string | null;
  productLink?: string | null;
  offerLink?: string | null;
  periodEndTime?: number | null;
};

export type AffiliateOffer = {
  source: 'shopee';
  externalId: string; // "shopee:<itemId>"
  itemId: string;
  shopId: string;
  name: string;
  shopName: string | null;
  officialShop: boolean;
  price: number;
  commissionPct: number;
  commissionValue: number;
  commissionExtra: boolean;
  rating: number | null;
  sales: number | null;
  images: string[];
  productLink: string | null;
  offerLink: string | null;
};

// shopType: 1 = Shopee Mall (loja oficial). 2/4 = indicada / indicada plus.
const OFFICIAL_SHOP_TYPE = 1;

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function normalizeShopeeOffer(node: ShopeeOfferNode): AffiliateOffer {
  const price = num(node.price) ?? num(node.priceMin) ?? 0;
  const rate = num(node.commissionRate) ?? 0;
  const commissionValue = num(node.commission) ?? price * rate;
  const itemId = String(node.itemId);
  return {
    source: 'shopee',
    externalId: `shopee:${itemId}`,
    itemId,
    shopId: String(node.shopId),
    name: String(node.productName ?? '').trim(),
    shopName: node.shopName ?? null,
    officialShop: Array.isArray(node.shopType) && node.shopType.includes(OFFICIAL_SHOP_TYPE),
    price: round2(price),
    commissionPct: round2(rate * 100),
    commissionValue: round2(commissionValue),
    // Comissão extra = a loja paga por cima da base da Shopee (programa XTRA).
    commissionExtra: (num(node.sellerCommissionRate) ?? 0) > 0,
    rating: num(node.ratingStar),
    sales: num(node.sales),
    images: node.imageUrl ? [node.imageUrl] : [],
    productLink: node.productLink ?? null,
    offerLink: node.offerLink ?? null,
  };
}

// ── Filtros da busca ────────────────────────────────────────────────────────
export type OfferFilters = {
  minRating: number;
  minSales: number;
  hideDog: boolean;
  hideMedicine: boolean;
};

export const DEFAULT_OFFER_FILTERS: OfferFilters = {
  minRating: 4.7,
  minSales: 100,
  hideDog: true,
  hideMedicine: true,
};

const DOG_TERMS = ['cao', 'caes', 'cachorro', 'cachorros', 'dog', 'dogs', 'canino', 'caninos', 'canina'];
// Medicamento veterinário não entra na loja (mesma regra da categoria
// Medicamento em product-rules.ts) — aqui pelo título, antes de cadastrar.
const MEDICINE_TERMS = [
  'medicamento', 'remedio', 'vermifugo', 'antipulgas', 'antipulga', 'carrapaticida', 'antibiotico',
  'anti-inflamatorio', 'antiinflamatorio', 'comprimido', 'comprimidos', 'pipeta', 'bravecto', 'nexgard',
  'simparic', 'revolution', 'advocate', 'frontline', 'drontal', 'milbemax', 'credeli', 'seresto',
];

function hasTerm(title: string, terms: string[]): boolean {
  const words = foldText(title).split(/[^a-z0-9-]+/).filter(Boolean);
  return terms.some((t) => words.includes(t));
}

export const isDogProduct = (title: string) => hasTerm(title, DOG_TERMS);
export const isMedicineProduct = (title: string) => hasTerm(title, MEDICINE_TERMS);

export function filterOffers(offers: AffiliateOffer[], filters: OfferFilters = DEFAULT_OFFER_FILTERS) {
  return offers.filter((o) =>
    (o.rating ?? 0) >= filters.minRating &&
    (o.sales ?? 0) >= filters.minSales &&
    !(filters.hideDog && isDogProduct(o.name)) &&
    !(filters.hideMedicine && isMedicineProduct(o.name)));
}

/** Maior comissão em R$ por venda primeiro; empate → mais vendas. */
export function sortByCommissionValue(offers: AffiliateOffer[]) {
  return [...offers].sort((a, b) => b.commissionValue - a.commissionValue || (b.sales ?? 0) - (a.sales ?? 0));
}

// ── Nome curto e slug ───────────────────────────────────────────────────────
export const SHORT_NAME_MAX = 40;

/** Tira [tags], (parênteses), emojis e "frete grátis"; corta em palavra inteira. */
export function suggestShortName(name: string, max = SHORT_NAME_MAX): string {
  const clean = String(name ?? '')
    .replace(/\[[^\]]*\]|\([^)]*\)|【[^】]*】/g, ' ')
    .replace(/[\p{Extended_Pictographic}‍️]/gu, ' ')
    .replace(/\b(frete gr[aá]tis|envio imediato|pronta entrega|promo[cç][aã]o|original)\b/gi, ' ')
    .replace(/[|/+*#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : clean.slice(0, max)).replace(/[\s,.;:-]+$/, '');
}

const SLUG_STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'para', 'pra', 'com', 'e', 'em', 'o', 'a', 'os', 'as', 'gato', 'gatos', 'pet', 'pets']);

/** Subid no padrão da loja ("churu", "fonte_inox"): até 3 palavras, [a-z0-9_]. */
export function slugify(name: string, maxLength = 30): string {
  const words = foldText(name).split(/[^a-z0-9]+/).filter((w) => w && !SLUG_STOPWORDS.has(w));
  const slug = words.slice(0, 3).join('_').slice(0, maxLength).replace(/_+$/, '');
  return slug || 'produto';
}

/** Primeiro slug livre: base, base_2, base_3… */
export function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let i = 2; ; i += 1) {
    const candidate = `${base}_${i}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export const shopeeSubIds = (slug: string) => ({ app: ['app', slug], grp: ['grp', slug] });

// ── Mercado Livre ───────────────────────────────────────────────────────────
/**
 * Aceita "MLB123", "MLB-123", URL de anúncio (produto.mercadolivre.com.br/MLB-123-...)
 * ou de catálogo (/p/MLB123). Devolve { id: "MLB123", kind } ou null.
 * Link curto meli.la não tem o código — precisa abrir e copiar o da página.
 */
export function parseMlbCode(input: string): { id: string; kind: 'item' | 'product' } | null {
  const text = String(input ?? '').trim();
  const catalog = text.match(/\/p\/(MLB)-?(\d{5,})/i);
  if (catalog) return { id: `MLB${catalog[2]}`, kind: 'product' };
  const item = text.match(/\b(MLB)-?(\d{5,})/i);
  if (item) return { id: `MLB${item[2]}`, kind: 'item' };
  return null;
}

// ── Rotina diária: alertas ──────────────────────────────────────────────────
export const PRICE_UP_ALERT_PCT = 15;

export type SyncAlert =
  | { type: 'price_up'; from: number; to: number; pct: number }
  | { type: 'commission_down'; from: number; to: number }
  | { type: 'extra_ended' }
  | { type: 'offline' };

export type SyncSnapshot = { price: number; commissionPct: number | null; commissionExtra: boolean | null };

/**
 * Compara o produto salvo com o que a API devolveu hoje. `next` null = a API
 * não achou mais a oferta (saiu do ar ou do programa de afiliados).
 * Só gera alerta — nunca decide despublicar.
 */
export function evaluateSyncAlerts(prev: SyncSnapshot, next: SyncSnapshot | null): SyncAlert[] {
  if (!next) return [{ type: 'offline' }];
  const alerts: SyncAlert[] = [];
  const pricePct = prev.price > 0 ? round2(((next.price - prev.price) / prev.price) * 100) : 0;
  if (pricePct > PRICE_UP_ALERT_PCT) {
    alerts.push({ type: 'price_up', from: prev.price, to: next.price, pct: pricePct });
  }
  if (prev.commissionExtra && next.commissionExtra === false) alerts.push({ type: 'extra_ended' });
  if (prev.commissionPct !== null && next.commissionPct !== null && next.commissionPct < prev.commissionPct) {
    alerts.push({ type: 'commission_down', from: prev.commissionPct, to: next.commissionPct });
  }
  return alerts;
}

const pctBR = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export function describeSyncAlert(alert: SyncAlert): string {
  switch (alert.type) {
    case 'price_up': return `Preço subiu ${pctBR(alert.pct)}% (R$ ${formatBRL(alert.from)} → R$ ${formatBRL(alert.to)})`;
    case 'commission_down': return `Comissão caiu de ${pctBR(alert.from)}% para ${pctBR(alert.to)}%`;
    case 'extra_ended': return 'Acabou a comissão extra';
    case 'offline': return 'Produto saiu do ar ou do programa de afiliados';
  }
}

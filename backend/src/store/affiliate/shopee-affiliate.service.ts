import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AffiliateOffer, ShopeeOfferNode, normalizeShopeeOffer } from './affiliate-rules';
import { foldText } from '../product-rules';

// Shopee Affiliate Open API (GraphQL), Brasil. Só o backend fala com ela:
// SHOPEE_AFF_APP_ID / SHOPEE_AFF_SECRET nunca vão pro front.
//
// Assinatura: SHA256(AppId + Timestamp + corpo JSON exato + Secret), no header
//   Authorization: SHA256 Credential=<AppId>, Signature=<hex>, Timestamp=<unix>
//
// Sem as variáveis, roda em modo mock (ofertas de exemplo) pra dar pra testar
// a tela; o admin mostra "API Shopee não configurada".

const ENDPOINT = process.env.SHOPEE_AFF_ENDPOINT || 'https://open-api.affiliate.shopee.com.br/graphql';

// Limite da Open API: ~2000 chamadas/hora por AppId. Fica uma margem.
const MAX_PER_HOUR = Number(process.env.SHOPEE_AFF_MAX_PER_HOUR || 1800);
const MIN_SPACING_MS = 300;
const MAX_RETRIES = 4;
const REQUEST_TIMEOUT_MS = 15_000;
// Código de erro da Open API para limite de chamadas excedido.
const RATE_LIMIT_CODES = new Set([10030]);

const OFFER_FIELDS = `
  itemId shopId productName shopName shopType
  price priceMin commissionRate sellerCommissionRate shopeeCommissionRate commission
  sales ratingStar imageUrl productLink offerLink periodEndTime
`;

const gqlString = (value: string) => JSON.stringify(value);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ShopeeApiError extends Error {
  constructor(message: string, readonly code?: number, readonly retryable = false) {
    super(message);
  }
}

export function shopeeSignature(appId: string, timestamp: number, body: string, secret: string) {
  return crypto.createHash('sha256').update(`${appId}${timestamp}${body}${secret}`).digest('hex');
}

@Injectable()
export class ShopeeAffiliateService {
  private readonly logger = new Logger(ShopeeAffiliateService.name);
  private queue: Promise<unknown> = Promise.resolve();
  private calls: number[] = [];
  private lastCallAt = 0;
  private readonly mockOffers = new Map<string, AffiliateOffer>();

  get configured() {
    return Boolean(process.env.SHOPEE_AFF_APP_ID && process.env.SHOPEE_AFF_SECRET);
  }

  get mock() {
    return !this.configured;
  }

  async searchOffers(keyword: string, page = 1, limit = 50): Promise<AffiliateOffer[]> {
    if (this.mock) return this.mockSearch(keyword);
    const data = await this.request<{ productOfferV2: { nodes: ShopeeOfferNode[] } }>(
      `{ productOfferV2(keyword: ${gqlString(keyword)}, page: ${Math.max(1, page)}, limit: ${Math.min(50, limit)}) { nodes { ${OFFER_FIELDS} } } }`,
    );
    return (data.productOfferV2?.nodes ?? []).map(normalizeShopeeOffer);
  }

  /** null = a oferta não existe mais (saiu do ar ou do programa de afiliados). */
  async getOffer(itemId: string): Promise<AffiliateOffer | null> {
    if (this.mock) return this.mockOffers.get(String(itemId)) ?? null;
    if (!/^\d+$/.test(String(itemId))) return null;
    const data = await this.request<{ productOfferV2: { nodes: ShopeeOfferNode[] } }>(
      `{ productOfferV2(itemId: ${itemId}, limit: 1) { nodes { ${OFFER_FIELDS} } } }`,
    );
    const node = data.productOfferV2?.nodes?.[0];
    return node ? normalizeShopeeOffer(node) : null;
  }

  async shortLink(originUrl: string, subIds: string[]): Promise<string> {
    if (this.mock) return `https://s.shopee.com.br/mock_${subIds.join('_')}`;
    const data = await this.request<{ generateShortLink: { shortLink: string } }>(
      `mutation { generateShortLink(input: { originUrl: ${gqlString(originUrl)}, subIds: ${JSON.stringify(subIds)} }) { shortLink } }`,
    );
    const link = data.generateShortLink?.shortLink;
    if (!link) throw new ShopeeApiError('A Shopee não devolveu o link curto.');
    return link;
  }

  // ── Transporte: fila única, limite por hora, backoff ───────────────────────
  private request<T>(query: string): Promise<T> {
    const run = this.queue.then(() => this.requestWithRetry<T>(query));
    // A fila segue mesmo se esta chamada falhar.
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async requestWithRetry<T>(query: string): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        await this.waitForSlot();
        return await this.send<T>(query);
      } catch (error) {
        const retryable = error instanceof ShopeeApiError ? error.retryable : true;
        if (!retryable || attempt >= MAX_RETRIES) throw error;
        const delay = 2000 * 2 ** attempt + Math.floor(Math.random() * 500);
        this.logger.warn(`Shopee: tentativa ${attempt + 1} falhou (${(error as Error).message}); nova em ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  private async waitForSlot() {
    const hourAgo = Date.now() - 3_600_000;
    this.calls = this.calls.filter((t) => t > hourAgo);
    if (this.calls.length >= MAX_PER_HOUR) {
      throw new ShopeeApiError(`Limite de ${MAX_PER_HOUR} chamadas/hora da API Shopee atingido. Tente mais tarde.`);
    }
    const wait = this.lastCallAt + MIN_SPACING_MS - Date.now();
    if (wait > 0) await sleep(wait);
    this.lastCallAt = Date.now();
    this.calls.push(this.lastCallAt);
  }

  private async send<T>(query: string): Promise<T> {
    const appId = process.env.SHOPEE_AFF_APP_ID as string;
    const secret = process.env.SHOPEE_AFF_SECRET as string;
    const body = JSON.stringify({ query });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = shopeeSignature(appId, timestamp, body, secret);

    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `SHA256 Credential=${appId}, Signature=${signature}, Timestamp=${timestamp}`,
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new ShopeeApiError(`Sem resposta da API Shopee: ${(error as Error).message}`, undefined, true);
    }

    if (response.status === 429 || response.status >= 500) {
      throw new ShopeeApiError(`API Shopee respondeu ${response.status}`, response.status, true);
    }
    const json: any = await response.json().catch(() => null);
    const gqlError = json?.errors?.[0];
    if (gqlError) {
      const code = Number(gqlError.extensions?.code);
      throw new ShopeeApiError(`API Shopee: ${gqlError.message}${code ? ` (código ${code})` : ''}`, code, RATE_LIMIT_CODES.has(code));
    }
    if (!response.ok || !json?.data) {
      throw new ShopeeApiError(`API Shopee respondeu ${response.status}`, response.status);
    }
    return json.data as T;
  }

  // ── Modo mock ──────────────────────────────────────────────────────────────
  private mockSearch(keyword: string): AffiliateOffer[] {
    const samples: Array<[string, number, number, number, number, number, boolean]> = [
      // nome, preço, comissão %, extra %, nota, vendas, oficial
      [`Fonte Bebedouro Inox 2L Silenciosa`, 89.9, 8, 4, 4.9, 1240, true],
      [`Arranhador Torre Sisal 3 Andares`, 149.9, 7, 3, 4.8, 610, false],
      [`Petisco Cremoso Churu Atum 4 un`, 24.9, 10, 0, 4.9, 5300, true],
      [`Caixa de Areia Fechada Grande`, 119.9, 6, 0, 4.7, 320, false],
      [`Cama Nuvem Pelúcia Antiestresse`, 69.9, 9, 5, 4.6, 880, false],
      [`Brinquedo Varinha com Penas`, 19.9, 12, 0, 4.8, 75, false],
      [`Coleira Peitoral para Cão e Gato`, 34.9, 8, 0, 4.8, 400, false],
      [`Vermífugo Comprimido Gatos`, 39.9, 5, 0, 4.9, 900, true],
    ];
    // O mock respeita a palavra buscada (só devolve exemplos que a contêm),
    // pra não parecer que a busca ignora o termo.
    const words = foldText(keyword).split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
    const all = samples.map(([name, price, pct, extra, rating, sales, official], i) => {
      const itemId = String(9_000_000 + i);
      const offer: AffiliateOffer = {
        source: 'shopee',
        externalId: `shopee:${itemId}`,
        itemId,
        shopId: '777',
        name,
        shopName: official ? 'Loja Oficial (mock)' : 'Loja Exemplo (mock)',
        officialShop: official,
        price,
        commissionPct: pct + extra,
        commissionValue: Math.round(price * (pct + extra)) / 100,
        commissionExtra: extra > 0,
        rating,
        sales,
        images: [`https://placehold.co/400x400.png?text=Mock+${i + 1}`],
        productLink: `https://shopee.com.br/product/777/${itemId}`,
        offerLink: null,
      };
      this.mockOffers.set(itemId, offer);
      return offer;
    });
    return words.length ? all.filter((o) => words.some((w) => foldText(o.name).includes(w))) : all;
  }

  assertLive(action: string) {
    if (this.mock) throw new ServiceUnavailableException(`API Shopee não configurada: ${action} indisponível.`);
  }
}

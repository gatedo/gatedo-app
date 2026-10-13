import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as crypto from 'crypto';
import { ShopeeAffiliateService, shopeeSignature } from './shopee-affiliate.service';
import { mergeAlerts } from './store-sync.service';

const okResponse = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data }) });
const gqlError = (message: string, code: number) => ({ ok: true, status: 200, json: async () => ({ errors: [{ message, extensions: { code } }] }) });

describe('shopeeSignature', () => {
  it('é SHA256 hex de AppId + Timestamp + corpo + Secret', () => {
    const body = JSON.stringify({ query: '{ x }' });
    const expected = crypto.createHash('sha256').update(`123${1700000000}${body}segredo`).digest('hex');
    expect(shopeeSignature('123', 1700000000, body, 'segredo')).toBe(expected);
  });
});

describe('ShopeeAffiliateService', () => {
  let service: ShopeeAffiliateService;
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    process.env.SHOPEE_AFF_APP_ID = '123';
    process.env.SHOPEE_AFF_SECRET = 'segredo';
    service = new ShopeeAffiliateService();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete process.env.SHOPEE_AFF_APP_ID;
    delete process.env.SHOPEE_AFF_SECRET;
  });

  it('assina a chamada e manda subIds no link curto', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ generateShortLink: { shortLink: 'https://s.shopee.com.br/abc' } }));
    const link = service.shortLink('https://shopee.com.br/product/1/2', ['app', 'churu']);
    await vi.runAllTimersAsync();
    expect(await link).toBe('https://s.shopee.com.br/abc');

    const [, init] = fetchMock.mock.calls[0];
    const timestamp = Number(/Timestamp=(\d+)/.exec(init.headers.Authorization)![1]);
    expect(init.headers.Authorization).toBe(
      `SHA256 Credential=123, Signature=${shopeeSignature('123', timestamp, init.body, 'segredo')}, Timestamp=${timestamp}`,
    );
    expect(JSON.parse(init.body).query).toContain('subIds: ["app","churu"]');
  });

  it('limite de chamadas (10030) tenta de novo com espera', async () => {
    fetchMock
      .mockResolvedValueOnce(gqlError('rate limit', 10030))
      .mockResolvedValueOnce(okResponse({ productOfferV2: { nodes: [] } }));
    const result = service.getOffer('42');
    await vi.runAllTimersAsync();
    expect(await result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('erro de consulta não repete', async () => {
    fetchMock.mockResolvedValue(gqlError('campo inválido', 10020));
    const result = service.getOffer('42').catch((e) => e);
    await vi.runAllTimersAsync();
    expect((await result).message).toContain('campo inválido');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sem chave roda em mock e não chama a API', async () => {
    delete process.env.SHOPEE_AFF_APP_ID;
    const offers = await service.searchOffers('fonte');
    expect(service.mock).toBe(true);
    expect(offers.length).toBeGreaterThan(0);
    expect(await service.getOffer(offers[0].itemId)).toEqual(offers[0]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mock respeita a palavra buscada', async () => {
    delete process.env.SHOPEE_AFF_APP_ID;
    const areia = await service.searchOffers('areia');
    expect(areia.map((o) => o.name)).toEqual(['Caixa de Areia Fechada Grande']);
    expect(await service.searchOffers('xyzabc')).toEqual([]);
  });
});

describe('mergeAlerts', () => {
  it('um alerta por tipo, o mais recente fica', () => {
    const old = [{ type: 'offline', message: 'x', at: '2026-10-01T10:00:00.000Z' }];
    const merged = mergeAlerts(old, [{ type: 'offline' }, { type: 'extra_ended' }], new Date('2026-10-02T10:00:00Z'));
    expect(merged.map((a) => [a.type, a.at])).toEqual([
      ['offline', '2026-10-02T10:00:00.000Z'],
      ['extra_ended', '2026-10-02T10:00:00.000Z'],
    ]);
  });
});

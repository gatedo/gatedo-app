import { describe, it, expect } from 'vitest';
import {
  DEFAULT_OFFER_FILTERS, evaluateSyncAlerts, filterOffers, isDogProduct, isMedicineProduct,
  normalizeShopeeOffer, parseMlbCode, slugify, sortByCommissionValue, suggestShortName, uniqueSlug,
} from './affiliate-rules';

const node = (over: Record<string, unknown> = {}) => ({
  itemId: 111, shopId: 222, productName: 'Fonte Bebedouro Gato Inox 2L', shopName: 'Loja X',
  shopType: [1], price: '89.90', commissionRate: '0.12', sellerCommissionRate: '0.04',
  commission: '10.79', sales: 350, ratingStar: '4.8', imageUrl: 'https://down-br.img.susercontent.com/file/a',
  productLink: 'https://shopee.com.br/product/222/111', offerLink: 'https://s.shopee.com.br/x', ...over,
});

describe('normalizeShopeeOffer', () => {
  it('converte strings, fração da comissão e loja oficial', () => {
    const o = normalizeShopeeOffer(node());
    expect(o).toMatchObject({
      externalId: 'shopee:111', price: 89.9, commissionPct: 12, commissionValue: 10.79,
      commissionExtra: true, rating: 4.8, sales: 350, officialShop: true,
      images: ['https://down-br.img.susercontent.com/file/a'],
    });
  });

  it('sem comissão em R$ calcula preço × taxa; sem taxa da loja não é extra', () => {
    const o = normalizeShopeeOffer(node({ commission: null, sellerCommissionRate: '0', shopType: [2], price: null, priceMin: '50' }));
    expect(o.commissionValue).toBe(6);
    expect(o.commissionExtra).toBe(false);
    expect(o.officialShop).toBe(false);
    expect(o.price).toBe(50);
  });
});

describe('filtros e ordenação', () => {
  const offers = [
    normalizeShopeeOffer(node({ itemId: 1, commission: '5' })),
    normalizeShopeeOffer(node({ itemId: 2, commission: '9' })),
    normalizeShopeeOffer(node({ itemId: 3, ratingStar: '4.5' })),
    normalizeShopeeOffer(node({ itemId: 4, sales: 40 })),
    normalizeShopeeOffer(node({ itemId: 5, productName: 'Caminha para Cão e Gato' })),
    normalizeShopeeOffer(node({ itemId: 6, productName: 'Vermífugo Drontal Gatos' })),
  ];

  it('aplica nota, vendas, cão e medicamento por padrão', () => {
    expect(filterOffers(offers).map((o) => o.itemId)).toEqual(['1', '2']);
  });

  it('filtros editáveis', () => {
    const loose = { ...DEFAULT_OFFER_FILTERS, minRating: 0, minSales: 0, hideDog: false };
    expect(filterOffers(offers, loose).map((o) => o.itemId)).toEqual(['1', '2', '3', '4', '5']);
  });

  it('ordena por comissão em R$', () => {
    expect(sortByCommissionValue(filterOffers(offers)).map((o) => o.itemId)).toEqual(['2', '1']);
  });

  it('cão/dog só como palavra inteira', () => {
    expect(isDogProduct('Brinquedo Dog Ball')).toBe(true);
    expect(isDogProduct('Petisco sabor cacau')).toBe(false);
    expect(isMedicineProduct('Antipulgas Bravecto')).toBe(true);
    expect(isMedicineProduct('Arranhador Torre')).toBe(false);
  });
});

describe('nome curto e slug', () => {
  it('limpa e corta em palavra inteira até 40', () => {
    const s = suggestShortName('[Envio Imediato] Fonte Bebedouro Para Gatos Inox 2L Silenciosa Com Filtro 🐱 (Frete Grátis)');
    expect(s.length).toBeLessThanOrEqual(40);
    expect(s).toBe('Fonte Bebedouro Para Gatos Inox 2L');
  });

  it('slug no padrão do subid', () => {
    expect(slugify('Fonte Bebedouro para Gatos Inox')).toBe('fonte_bebedouro_inox');
    expect(slugify('Petisco Churu')).toBe('petisco_churu');
    expect(slugify('!!!')).toBe('produto');
    expect(uniqueSlug('churu', new Set(['churu', 'churu_2']))).toBe('churu_3');
  });
});

describe('parseMlbCode', () => {
  it('reconhece código, anúncio e catálogo', () => {
    expect(parseMlbCode('MLB3449531237')).toEqual({ id: 'MLB3449531237', kind: 'item' });
    expect(parseMlbCode('https://produto.mercadolivre.com.br/MLB-3449531237-fonte-_JM')).toEqual({ id: 'MLB3449531237', kind: 'item' });
    expect(parseMlbCode('https://www.mercadolivre.com.br/fonte/p/MLB19615387')).toEqual({ id: 'MLB19615387', kind: 'product' });
    expect(parseMlbCode('https://meli.la/abc')).toBeNull();
  });
});

describe('evaluateSyncAlerts', () => {
  const prev = { price: 100, commissionPct: 12, commissionExtra: true };

  it('preço +15% é o limite', () => {
    expect(evaluateSyncAlerts(prev, { ...prev, price: 115 })).toEqual([]);
    expect(evaluateSyncAlerts(prev, { ...prev, price: 115.5 })).toEqual([{ type: 'price_up', from: 100, to: 115.5, pct: 15.5 }]);
  });

  it('fim da extra e queda de comissão', () => {
    expect(evaluateSyncAlerts(prev, { price: 100, commissionPct: 8, commissionExtra: false })).toEqual([
      { type: 'extra_ended' },
      { type: 'commission_down', from: 12, to: 8 },
    ]);
  });

  it('sumiu da API = fora do ar', () => {
    expect(evaluateSyncAlerts(prev, null)).toEqual([{ type: 'offline' }]);
  });
});

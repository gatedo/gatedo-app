import { describe, it, expect } from 'vitest';
import * as backend from './product-rules';
// @ts-ignore — espelho JS do front; os mesmos casos rodam nos dois.
import * as frontend from '../../../frontend/src/utils/productRules.js';

const CATEGORIES = [
  { id: 'cat-conforto', name: 'Conforto' },
  { id: 'cat-petisco', name: 'Petisco' },
  { id: 'cat-saude', name: 'Saúde' },
];

describe('normalizeImportItem (só backend)', () => {
  const { normalizeImportItem, MEDICINE_MESSAGE } = backend;

  it('recusa Medicamento com a mensagem da loja', () => {
    const r = normalizeImportItem({ name: 'Advocate', categoryName: 'Medicamento', price: '90' }, 0, CATEGORIES);
    expect(r).toMatchObject({ ok: false, error: MEDICINE_MESSAGE });
  });

  it('link vazio e preço 0 entram como rascunho, sem erro', () => {
    const r = normalizeImportItem({
      name: 'Petisco Cremoso Churu (kit de sachês)', categoryId: null, categoryName: 'Petisco',
      price: '0.00', externalLink: '', images: [], badge: 'Em teste nos gatos', tags: ['heroi', 'subid:grp_churu'],
    }, 0, CATEGORIES);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.status).toBe('draft');
    expect(r.data).toMatchObject({
      categoryId: 'cat-petisco', linkApp: null, subid: 'grp_churu', role: 'heroi',
      badge: 'Em teste nos gatos', tags: [], priceCheckedAt: null,
    });
  });

  it('mesmo pedindo published, sem link vira rascunho', () => {
    const r = normalizeImportItem({ name: 'X', categoryName: 'Petisco', price: 10, status: 'published' }, 0, CATEGORIES);
    expect(r.ok && r.status).toBe('draft');
  });

  it('publica quando tem link https, preço e imagem', () => {
    const r = normalizeImportItem({
      name: 'X', categoryName: 'Petisco', price: 10, status: 'published',
      linkApp: 'https://s.shopee.com.br/abc', images: ['https://down-br.img.susercontent.com/file/abc'],
    }, 0, CATEGORIES);
    expect(r.ok && r.status).toBe('published');
  });

  it('usa categoryId quando existe e recusa Saúde', () => {
    const byId = normalizeImportItem({ name: 'Cama', categoryId: 'cat-conforto', price: 1 }, 0, CATEGORIES);
    expect(byId.ok && byId.data.categoryId).toBe('cat-conforto');
    const saude = normalizeImportItem({ name: 'Y', categoryName: 'Saúde', price: 1 }, 0, CATEGORIES);
    expect(saude.ok).toBe(false);
  });
});

for (const [label, rules] of [['backend', backend], ['frontend', frontend]] as const) {
  describe(`regras compartilhadas (${label})`, () => {
    it('bloqueia Medicamento', () => {
      expect(rules.isBlockedCategory('Medicamento')).toBe(true);
      expect(rules.isBlockedCategory('medicamentos veterinários')).toBe(true);
      expect(rules.isBlockedCategory('Petisco')).toBe(false);
      expect(rules.isHiddenCategory('Saúde')).toBe(true);
    });

    it('separa URL colada e quebra por vírgula/linha', () => {
      const raw = 'https://a.com/1.webp.https://down-br.img.susercontent.com/file/xyz ,\n https://b.com/2.jpg';
      expect(rules.splitImageUrls(raw)).toEqual([
        'https://a.com/1.webp',
        'https://down-br.img.susercontent.com/file/xyz',
        'https://b.com/2.jpg',
      ]);
      const { valid, invalid } = rules.normalizeImages('http://a.com/x.jpg, https://a.com/pagina, https://a.com/ok.png');
      expect(valid).toEqual(['https://a.com/ok.png']);
      expect(invalid).toEqual(['http://a.com/x.jpg', 'https://a.com/pagina']);
    });

    it('acha promessa de saúde, sem falso positivo', () => {
      const text = 'Previne tártaro, melhora o hálito e ajuda o intestino.';
      const hits = rules.findHealthClaims(text);
      expect(hits.map((h: any) => text.slice(h.start, h.end))).toEqual(['Previne', 'hálito', 'intestino']);
      expect(rules.findHealthClaims('Cama segura e macia para curar o tédio')).toEqual([]);
      expect(rules.findHealthClaims('Saúde em 1º lugar').length).toBe(1);
      expect(rules.HEALTH_WARNING).toBe('Descreva o produto e o uso, não resultado de saúde.');
    });

    it('não deixa publicar sem link, preço e imagem', () => {
      expect(rules.publishBlockers({ linkApp: 'http://x.com', price: 0, images: [] })).toHaveLength(3);
      expect(rules.publishBlockers({
        linkApp: 'https://x.com', price: 1, images: ['https://x.com/a.jpg'], categoryName: 'Petisco',
      })).toEqual([]);
    });

    it('monta o texto do Copiar post', () => {
      const base = {
        name: 'Petisco Cremoso Churu (kit de sachês)', price: 39.9, platform: 'Shopee',
        linkApp: 'https://app.link', linkGroup: 'https://grupo.link',
        priceCheckedAt: '2026-10-08T17:05:00Z', // 14:05 em Brasília
      };
      expect(rules.buildGroupPost({ ...base, gancho: 'O Mingau larga tudo por isso.' })).toBe([
        'Publi · link de indicação',
        'Petisco Cremoso Churu — O Mingau larga tudo por isso.',
        '💰 R$ 39,90 na Shopee',
        '👉 https://grupo.link',
        'Preço visto em 08/10 14:05; pode mudar.',
      ].join('\n'));

      const semGancho = rules.buildGroupPost({ ...base, linkGroup: null, platform: 'Mercado Livre' });
      expect(semGancho.split('\n')[1]).toBe('Petisco Cremoso Churu');
      expect(semGancho).toContain('no Mercado Livre');
      expect(semGancho).toContain('👉 https://app.link');
    });

    it('preço com mais de 24h fica vencido', () => {
      const now = new Date('2026-10-08T12:00:00Z');
      expect(rules.isPriceStale('2026-10-07T11:59:00Z', now)).toBe(true);
      expect(rules.isPriceStale('2026-10-07T12:30:00Z', now)).toBe(false);
      expect(rules.isPriceStale(null, now)).toBe(true);
    });
  });
}

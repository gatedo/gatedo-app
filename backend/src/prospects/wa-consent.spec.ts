import { describe, expect, it } from 'vitest';
import { detectIntent, normalizeBrPhone, sanitizeSender, sendBlockReason, startOfDayBrt } from './wa-consent';

const now = new Date('2026-10-11T15:00:00Z');
const recentMenu = new Date('2026-10-11T14:00:00Z');
const oldMenu = new Date('2026-10-09T14:00:00Z');

describe('detectIntent', () => {
  it('palavras do menu, sem maiúsculas nem acento', () => {
    for (const msg of ['GATO', 'oi', 'Olá!', 'achados', 'App', 'oi, tudo bem?', 'quero ver os ACHADOS']) {
      expect(detectIntent(msg, null, now)).toBe('menu');
    }
    expect(detectIntent('bom dia', null, now)).toBeNull();
    expect(detectIntent('', null, now)).toBeNull();
  });

  it('SAIR/PARAR só como a mensagem inteira', () => {
    expect(detectIntent('SAIR', null, now)).toBe('optout');
    expect(detectIntent('parar!', recentMenu, now)).toBe('optout');
    expect(detectIntent('não quero parar de receber', null, now)).toBeNull();
  });

  it('1/2/3 só valem com menu nas últimas 24h', () => {
    expect(detectIntent('1', recentMenu, now)).toBe('option_app');
    expect(detectIntent(' 2 ', recentMenu, now)).toBe('option_group');
    expect(detectIntent('3', recentMenu, now)).toBe('option_human');
    expect(detectIntent('1', oldMenu, now)).toBeNull();
    expect(detectIntent('1', null, now)).toBeNull();
    expect(detectIntent('4', recentMenu, now)).toBeNull();
  });
});

describe('sendBlockReason', () => {
  const principal = { requireOptin: true };
  const publicidade = { requireOptin: false };

  it('opt-out bloqueia tudo, em qualquer número', () => {
    const lead = { optin: true, optoutAt: new Date() };
    expect(sendBlockReason(lead, 'campaign', publicidade)).toMatch(/opt-out/);
    expect(sendBlockReason(lead, 'reply', principal)).toMatch(/opt-out/);
  });

  it('disparo no principal exige opt-in; resposta não', () => {
    expect(sendBlockReason({ optin: false }, 'campaign', principal)).toMatch(/consentimento/);
    expect(sendBlockReason(null, 'campaign', principal)).toMatch(/consentimento/);
    expect(sendBlockReason({ optin: true }, 'campaign', principal)).toBeNull();
    expect(sendBlockReason({ optin: false }, 'reply', principal)).toBeNull();
  });

  it('número de publicidade sem trava de opt-in', () => {
    expect(sendBlockReason({ optin: false }, 'campaign', publicidade)).toBeNull();
  });
});

describe('sanitizeSender', () => {
  it('padrão seguro e segredo só por nome de variável', () => {
    const s = sanitizeSender({ id: 'Promo 1!', gatewayUrl: 'https://wa2.onrender.com/', secretEnv: 'wa_gateway_2_secret' }, 0);
    expect(s).toMatchObject({ id: 'promo1', gatewayUrl: 'https://wa2.onrender.com', secretEnv: 'WA_GATEWAY_2_SECRET', requireOptin: true, active: true });
    expect(sanitizeSender({ requireOptin: false }, 1).requireOptin).toBe(false);
    expect(() => sanitizeSender({ gatewayUrl: 'http://x.com' }, 0)).toThrow();
  });
});

describe('normalizeBrPhone', () => {
  it('aceita formatos comuns e completa o 9', () => {
    expect(normalizeBrPhone('+55 51 9350-9809')).toBe('5551993509809');
    expect(normalizeBrPhone('(51) 99350-9809')).toBe('5551993509809');
    expect(normalizeBrPhone('5551993509809')).toBe('5551993509809');
    expect(normalizeBrPhone('123')).toBeNull();
    expect(normalizeBrPhone('00 99999-9999')).toBeNull();
  });
});

it('início do dia em Brasília', () => {
  expect(startOfDayBrt(new Date('2026-10-11T02:00:00Z')).toISOString()).toBe('2026-10-10T03:00:00.000Z');
  expect(startOfDayBrt(new Date('2026-10-11T15:00:00Z')).toISOString()).toBe('2026-10-11T03:00:00.000Z');
});

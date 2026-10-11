import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProspectsService } from './prospects.service';

// Banco falso com um lead; o gateway (gPost) é espionado — nada sai de verdade.
function setup(lead: Record<string, any>, botEnabled = true) {
  const state = { ...lead };
  const prisma: any = {
    appSettings: {
      findUnique: vi.fn(async ({ where }: any) =>
        where.key === 'wa_bot_settings' ? { value: JSON.stringify({ enabled: botEnabled }) } : null),
    },
    prospect: {
      findUnique: vi.fn(async () => ({ ...state })),
      update: vi.fn(async ({ data }: any) => Object.assign(state, data)),
    },
    prospectMessage: { create: vi.fn(async () => ({})), findFirst: vi.fn(async () => null) },
    prospectEvent: { create: vi.fn(async () => ({})) },
  };
  const email: any = { sendWaHandoffAlert: vi.fn(async () => undefined) };
  const svc = new ProspectsService(prisma, email);
  const sent: any[] = [];
  vi.spyOn(svc as any, 'gPost').mockImplementation(async (path: any, data: any) => {
    sent.push({ path, data });
    return { messageId: `m${sent.length}` };
  });
  vi.spyOn(svc as any, 'findOrCreateInboundProspect').mockImplementation(async () => ({ ...state }));
  const inbound = (message: string) => svc.handleAutoReply({ phone: state.phone, message, timestamp: Date.now(), messageId: 'x' });
  return { svc, state, sent, prisma, email, inbound };
}

const baseLead = { id: 'p1', phone: '5551999990000', name: 'Ana', optin: false, optoutAt: null, humanHandoffAt: null, menuSentAt: null, tags: [] };

describe('bot de consentimento', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('palavra do menu manda o menu e marca o horário', async () => {
    const { state, sent, inbound } = setup(baseLead);
    const r = await inbound('Oi!');
    expect(r).toMatchObject({ ok: true, intent: 'menu' });
    expect(sent[0].data.text).toContain('1 – Acessar o app grátis');
    expect(state.menuSentAt).toBeInstanceOf(Date);
  });

  it('opções 1 e 2 mandam links rastreados; 2 avisa da comissão', async () => {
    const { sent, inbound } = setup({ ...baseLead, menuSentAt: new Date() });
    await inbound('1');
    await inbound('2');
    expect(sent[0].data.text).toContain('/api/wa/go/app?p=p1');
    expect(sent[1].data.text).toContain('/api/wa/go/grupo?p=p1');
    expect(sent[1].data.text).toContain('sem custo extra');
  });

  it('opção 3: atendimento humano, avisa por e-mail e o bot para', async () => {
    const { state, email, sent, inbound } = setup({ ...baseLead, menuSentAt: new Date() });
    await inbound('3');
    expect(state.humanHandoffAt).toBeInstanceOf(Date);
    expect(email.sendWaHandoffAlert).toHaveBeenCalledWith('gatedoapp@gmail.com', expect.objectContaining({ phone: baseLead.phone }));
    const before = sent.length;
    expect(await inbound('oi')).toMatchObject({ skipped: true, reason: 'human_handoff' });
    expect(sent.length).toBe(before);
  });

  it('SAIR marca opt-out e confirma mesmo com o bot desligado; depois, silêncio', async () => {
    const { state, sent, inbound } = setup({ ...baseLead, optin: true }, false);
    await inbound('SAIR');
    expect(state.optoutAt).toBeInstanceOf(Date);
    expect(state.optin).toBe(false);
    expect(sent.map((s) => s.data.text)).toEqual(['Pronto, não envio mais mensagens.']);
    expect(await inbound('oi')).toMatchObject({ skipped: true, reason: 'opted_out' });
  });
});

describe('trava de disparo', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('principal sem opt-in: bloqueado', async () => {
    const { svc, sent } = setup(baseLead);
    await expect(svc.sendOne({ phone: baseLead.phone, prospectId: 'p1', text: 'promo', purpose: 'campaign' }))
      .rejects.toMatchObject({ response: { code: 'NO_CONSENT' } });
    expect(sent).toHaveLength(0);
  });

  it('com opt-in: envia', async () => {
    const { svc, sent } = setup({ ...baseLead, optin: true });
    await svc.sendOne({ phone: baseLead.phone, prospectId: 'p1', text: 'promo', purpose: 'campaign' });
    expect(sent).toHaveLength(1);
  });

  it('opt-out bloqueia até resposta', async () => {
    const { svc } = setup({ ...baseLead, optin: true, optoutAt: new Date() });
    await expect(svc.sendOne({ phone: baseLead.phone, prospectId: 'p1', text: 'oi', purpose: 'reply' }))
      .rejects.toMatchObject({ response: { code: 'NO_CONSENT' } });
  });

  it('lote devolve os bloqueados e não os envia', async () => {
    const { svc, sent } = setup(baseLead);
    const r: any = await svc.sendBatch([{ phone: baseLead.phone, prospectId: 'p1', text: 'promo' }]);
    expect(r.total).toBe(0);
    expect(r.blocked[0].reason).toMatch(/consentimento/);
    expect(sent).toHaveLength(0);
  });
});

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import axios, { AxiosError } from 'axios';
import {
  DEFAULT_CONSENT_BOT_TEXTS, DEFAULT_LINKS, IMPORTED_TAG, INBOUND_TAG, OptinSource, SendPurpose, WaSender,
  detectIntent, fillLink, normalizeBrPhone, sanitizeSender, sendBlockReason, startOfDayBrt,
} from './wa-consent';

const GATEWAY_URL = (process.env.GATEWAY_URL || process.env.WA_GATEWAY_URL || 'https://gatedo-wa-gateway.onrender.com').replace(/\/+$/, '');
const GATEWAY_SECRET  = process.env.GATEWAY_SECRET || process.env.WA_GATEWAY_SECRET || 'change-me-in-render-env';
const GATEWAY_TIMEOUT = Number(process.env.WA_GATEWAY_TIMEOUT_MS || process.env.GATEWAY_TIMEOUT_MS || 45000);
const GATEWAY_STATUS_TIMEOUT = Number(process.env.WA_GATEWAY_STATUS_TIMEOUT_MS || 8000);
const WA_BOT_SETTINGS_KEY = 'wa_bot_settings';
const WA_SENDERS_KEY = 'wa_senders';
const PRINCIPAL_SENDER_ID = 'principal';
// Links das opções 1 e 2 passam por /api/wa/go/:alvo (conta o clique).
const PUBLIC_API_URL = (process.env.PUBLIC_API_URL || 'https://api.gatedo.com').replace(/\/+$/, '');
// Opção 3 (falar com o Diego) avisa por e-mail.
const HANDOFF_NOTIFY_EMAIL = process.env.WA_HANDOFF_NOTIFY_EMAIL || 'gatedoapp@gmail.com';
const META_WHATSAPP_ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN || '';
const META_WHATSAPP_PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID || '';
const META_WHATSAPP_TEMPLATE_INVITE = process.env.META_WHATSAPP_TEMPLATE_INVITE || '';
const META_WHATSAPP_TEMPLATE_LANG = process.env.META_WHATSAPP_TEMPLATE_LANG || 'pt_BR';
const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v20.0';
const META_WA_ENABLED = Boolean(META_WHATSAPP_ACCESS_TOKEN && META_WHATSAPP_PHONE_NUMBER_ID && META_WHATSAPP_TEMPLATE_INVITE);

const DEFAULT_PROSPECT_TEMPLATES = [
  {
    id: 'convite_fundador',
    name: 'Convite Fundador',
    category: 'Primeiro contato',
    color: '#8B4AFF',
    labelColor: '#8B4AFF',
    bubbleColor: '#ffffff',
    imageUrl: '',
    linkUrl: '',
    message: `Ola!

Sou tutor(a) de gato e descobri uma plataforma incrivel chamada *GATEDO* - o primeiro ecossistema digital criado exclusivamente para quem tem gato!

Com ele voce organiza vacinas, consultas e o historico completo do seu felino, conta com IA veterinaria que conhece seu gato pelo nome, e muito mais.

Estao abrindo as *primeiras vagas de Fundador(a)* - o menor valor que esse app vai ter, para sempre.

Tem interesse em conhecer? Me responde aqui`,
  },
  {
    id: 'followup_24h',
    name: 'Follow-up 24h',
    category: 'Sem resposta',
    color: '#f59e0b',
    labelColor: '#f59e0b',
    bubbleColor: '#ffffff',
    imageUrl: '',
    linkUrl: '',
    message: `Oi!

So passando para saber se voce viu minha mensagem sobre o *GATEDO*!

E uma oportunidade unica de entrar como Fundador(a) com o menor preco do app. As vagas sao limitadas!

Posso te mostrar como funciona em 2 minutinhos?`,
  },
  {
    id: 'interesse',
    name: 'Respondeu com Interesse',
    category: 'Lead quente',
    color: '#10b981',
    labelColor: '#10b981',
    bubbleColor: '#ffffff',
    imageUrl: '',
    linkUrl: '',
    message: `Que otimo!

Deixa eu te contar o que o *GATEDO* oferece:

- Historico de saude completo do seu gato
- IA vet que conhece seu felino pelo nome
- Vacinas, consultas e lembretes automaticos
- Studio de imagens AI exclusivo
- Comunidade gateira nacional

Como *Fundador(a)*, voce garante o menor preco que o app vai ter - para sempre.

Quer garantir sua vaga? Me fala que te passo o link direto`,
  },
  {
    id: 'objecao',
    name: 'Objecao de Preco',
    category: 'Hesitante',
    color: '#3b82f6',
    labelColor: '#3b82f6',
    bubbleColor: '#ffffff',
    imageUrl: '',
    linkUrl: '',
    message: `Entendo!

Mas olha so: o plano Fundador sai por menos de *R$ 1/dia* - e voce tem tudo isso:

- Saude do gatinho organizada
- App exclusivo de gatos no Brasil
- IA veterinaria 24h
- Studio de fotos AI exclusivo

E investimento no bem-estar do seu bichano! E o preco de Fundador nunca mais volta.

Quer garantir antes que as vagas acabem?`,
  },
];

const DEFAULT_WA_BOT_SETTINGS = {
  enabled: false,
  mode: 'assistive',
  // Bot de consentimento (menu 1/2/3, SAIR). Textos e links editáveis.
  consentTexts: DEFAULT_CONSENT_BOT_TEXTS,
  links: DEFAULT_LINKS,
  fallbackEnabled: false,
  fallbackText:
    'Oi! Recebemos sua mensagem pelo Gatedo. Em breve uma pessoa da equipe responde por aqui.',
  rules: [
    {
      id: 'greeting',
      label: 'Boas-vindas',
      enabled: true,
      keywords: ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite'],
      response:
        'Oi! Que bom falar com voce. Eu sou o assistente do Gatedo. Voce quer conhecer o app para organizar a saude e rotina do seu gato?',
    },
    {
      id: 'price',
      label: 'Preco e planos',
      enabled: true,
      keywords: ['preco', 'preço', 'valor', 'plano', 'assinatura', 'fundador'],
      response:
        'Temos condicoes especiais para fundadores do Gatedo. Posso te enviar o link com os detalhes e beneficios?',
    },
    {
      id: 'health',
      label: 'Saude do gato',
      enabled: true,
      keywords: ['vacina', 'veterinario', 'veterinário', 'remedio', 'remédio', 'saude', 'saúde'],
      response:
        'O Gatedo ajuda a organizar vacinas, historico de saude, documentos e lembretes do seu gato. Em caso de urgencia, procure um veterinario imediatamente.',
    },
  ],
};
const AUTO_SENT_STATUSES = new Set(['waiting', 'pending', 'sent']);

type InboundWaMessage = {
  phone: string;
  message: string;
  timestamp: number;
  messageId: string;
  remoteJid?: string;
  participantJid?: string;
  quotedMessageId?: string | null;
  quotedParticipant?: string | null;
};

export class ConsentBlockedError extends HttpException {
  constructor(reason: string) {
    super({ error: `Envio bloqueado: ${reason}`, code: 'NO_CONSENT' }, HttpStatus.FORBIDDEN);
  }
}

type ProspectSendData = {
  senderId?: string;
  purpose?: SendPurpose;
  phone: string;
  text: string;
  imageUrl?: string;
  prospectId: string;
  scriptId?: string;
  mode?: 'template' | 'text';
  templateName?: string;
  templateLang?: string;
};

function normalizeText(value: string) {
  return String(value || '')
    .replace(/Ã¡|Ã |Ã¢|Ã£/g, 'a')
    .replace(/Ã©|Ãª/g, 'e')
    .replace(/Ã­/g, 'i')
    .replace(/Ã³|Ã´|Ãµ/g, 'o')
    .replace(/Ãº/g, 'u')
    .replace(/Ã§/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function phoneLookupTokens(phone: string) {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  const tokens = new Set<string>();
  if (digits) tokens.add(digits);
  if (digits.length >= 11) tokens.add(digits.slice(-11));
  if (digits.length >= 10) tokens.add(digits.slice(-10));
  if (digits.startsWith('55') && digits.length === 13 && digits[4] === '9') {
    const withoutNine = digits.slice(0, 4) + digits.slice(5);
    tokens.add(withoutNine);
    tokens.add(withoutNine.slice(-10));
  }
  if (digits.startsWith('55') && digits.length === 12) {
    const withNine = digits.slice(0, 4) + '9' + digits.slice(4);
    tokens.add(withNine);
    tokens.add(withNine.slice(-11));
  }
  return [...tokens].filter(Boolean);
}

function canonicalPhone(phone: string) {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('55') && digits.length === 13 && digits[4] === '9') return digits;
  if (digits.startsWith('55') && digits.length === 12) return digits.slice(0, 4) + '9' + digits.slice(4);
  if (!digits.startsWith('55') && digits.length === 11) return `55${digits}`;
  if (!digits.startsWith('55') && digits.length === 10) return `55${digits.slice(0, 2)}9${digits.slice(2)}`;
  return digits;
}

function mergeBotSettings(raw: any) {
  const settings = raw && typeof raw === 'object' ? raw : {};
  const customRules = Array.isArray(settings.rules) ? settings.rules : [];
  return {
    ...DEFAULT_WA_BOT_SETTINGS,
    ...settings,
    consentTexts: { ...DEFAULT_CONSENT_BOT_TEXTS, ...(settings.consentTexts || {}) },
    links: { ...DEFAULT_LINKS, ...(settings.links || {}) },
    rules: customRules.length ? customRules : DEFAULT_WA_BOT_SETTINGS.rules,
  };
}

function toDateFromGatewayTimestamp(value: any) {
  const raw =
    typeof value === 'object' && value !== null
      ? Number(value.low ?? value.value ?? value.seconds ?? value.toString?.())
      : Number(value);
  if (!Number.isFinite(raw) || raw <= 0) return new Date();
  return new Date(raw > 10_000_000_000 ? raw : raw * 1000);
}

@Injectable()
export class ProspectsService {
  private readonly logger = new Logger(ProspectsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  private headers(sender?: WaSender) {
    return { 'x-gateway-secret': sender ? this.senderSecret(sender) : GATEWAY_SECRET };
  }

  // ── Números remetentes ────────────────────────────────────────────────────
  // O principal é o gateway que já existe (mesma URL e segredo de sempre —
  // nada muda na sessão conectada). Outros números = outro serviço do
  // wa-gateway, com URL e segredo próprios.
  private defaultSender(): WaSender {
    return {
      id: PRINCIPAL_SENDER_ID,
      label: 'Principal (com consentimento)',
      phone: '5551993509809',
      provider: META_WA_ENABLED ? 'meta' : 'gateway',
      gatewayUrl: GATEWAY_URL,
      secretEnv: process.env.GATEWAY_SECRET ? 'GATEWAY_SECRET' : 'WA_GATEWAY_SECRET',
      requireOptin: true,
      active: true,
    };
  }

  private senderSecret(sender: WaSender) {
    if (sender.id === PRINCIPAL_SENDER_ID) return GATEWAY_SECRET;
    return (sender.secretEnv && process.env[sender.secretEnv]) || '';
  }

  async getSenders(): Promise<WaSender[]> {
    const saved = await this.prisma.appSettings.findUnique({ where: { key: WA_SENDERS_KEY } }).catch(() => null);
    let list: WaSender[] = [];
    try {
      list = saved?.value ? (JSON.parse(saved.value) as any[]).map(sanitizeSender) : [];
    } catch {
      list = [];
    }
    const principal = { ...this.defaultSender(), ...(list.find((x) => x.id === PRINCIPAL_SENDER_ID) || {}) };
    // O principal sempre usa o gateway atual e sempre exige opt-in.
    principal.gatewayUrl = GATEWAY_URL;
    principal.requireOptin = true;
    principal.active = true;
    return [principal, ...list.filter((x) => x.id !== PRINCIPAL_SENDER_ID)];
  }

  /** Lista para o admin: sem segredo, só se a variável está definida. */
  async listSenders() {
    return (await this.getSenders()).map((sender) => ({ ...sender, secretConfigured: Boolean(this.senderSecret(sender)) }));
  }

  async saveSenders(raw: any[]) {
    let list: WaSender[];
    try {
      list = (Array.isArray(raw) ? raw : []).map(sanitizeSender);
    } catch (err: any) {
      throw new HttpException({ error: err.message }, HttpStatus.BAD_REQUEST);
    }
    const ids = new Set<string>();
    for (const sender of list) {
      if (ids.has(sender.id)) throw new HttpException({ error: `Número repetido: ${sender.id}` }, HttpStatus.BAD_REQUEST);
      ids.add(sender.id);
      if (sender.id !== PRINCIPAL_SENDER_ID && sender.provider === 'gateway' && (!sender.gatewayUrl || !sender.secretEnv)) {
        throw new HttpException({ error: `"${sender.label}" precisa de URL do gateway e da variável do segredo.` }, HttpStatus.BAD_REQUEST);
      }
    }
    const value = JSON.stringify(list);
    await this.prisma.appSettings.upsert({
      where: { key: WA_SENDERS_KEY },
      update: { value },
      create: { key: WA_SENDERS_KEY, value },
    });
    return this.listSenders();
  }

  private async getSender(id?: string | null): Promise<WaSender> {
    const senders = await this.getSenders();
    const sender = senders.find((x) => x.id === (id || PRINCIPAL_SENDER_ID));
    if (!sender || !sender.active) {
      throw new HttpException({ error: `Número remetente "${id}" não existe ou está desativado.` }, HttpStatus.BAD_REQUEST);
    }
    return sender;
  }

  /** Webhook do gateway: o segredo diz de qual número veio. null = segredo inválido. */
  async senderForSecret(secret: string): Promise<WaSender | null> {
    if (!secret) return null;
    const senders = await this.getSenders();
    return senders.find((sender) => this.senderSecret(sender) && this.senderSecret(sender) === secret) ?? null;
  }

  private sanitizeProspect(data: any) {
    const tags = Array.isArray(data?.tags)
      ? data.tags.filter(Boolean).map((item) => String(item))
      : [];

    const parsedScore = Number(data?.score ?? 0);

    return {
      phone: String(data?.phone || '').trim(),
      name: data?.name ? String(data.name) : null,
      note: data?.note ? String(data.note) : null,
      status: String(data?.status || data?.column || 'pending'),
      column: String(data?.column || data?.status || 'pending'),
      score: Number.isFinite(parsedScore) ? parsedScore : 0,
      tags,
      sentAt: data?.sentAt ? new Date(data.sentAt) : null,
      repliedAt: data?.repliedAt ? new Date(data.repliedAt) : null,
      lastReply: data?.lastReply ? String(data.lastReply) : null,
      lastMessageId: data?.lastMessageId ? String(data.lastMessageId) : null,
      scriptId: data?.scriptId ? String(data.scriptId) : null,
    };
  }

  private sanitizeTemplate(data: any, sortOrder = 0) {
    return {
      id: data?.id ? String(data.id) : undefined,
      name: String(data?.name || 'Novo template').trim() || 'Novo template',
      category: data?.category ? String(data.category) : null,
      color: data?.color ? String(data.color) : '#8B4AFF',
      labelColor: data?.labelColor ? String(data.labelColor) : data?.color ? String(data.color) : '#8B4AFF',
      bubbleColor: data?.bubbleColor ? String(data.bubbleColor) : '#ffffff',
      imageUrl: data?.imageUrl ? String(data.imageUrl) : null,
      linkUrl: data?.linkUrl ? String(data.linkUrl) : null,
      parentTheme: data?.parentTheme ? String(data.parentTheme).trim() : null,
      flowCategory: data?.flowCategory ? String(data.flowCategory).trim() : null,
      flowColor: data?.flowColor ? String(data.flowColor) : data?.color ? String(data.color) : '#8B4AFF',
      stepOrder: Math.max(1, Number(data?.stepOrder || sortOrder + 1) || 1),
      delaySeconds: Math.max(0, Number(data?.delaySeconds || 0) || 0),
      message: String(data?.message || ''),
      sortOrder,
      active: data?.active === false ? false : true,
    };
  }

  // ── Chamadas ao Gateway com erro robusto ───────────────────────────────────
  private async gGet(path: string, timeout = GATEWAY_TIMEOUT) {
    try {
      const r = await axios.get(`${GATEWAY_URL}${path}`, { headers: this.headers(), timeout });
      return r.data;
    } catch (err) {
      const e = err as AxiosError<any>;
      this.logger.warn({ path, status: e.response?.status, err: e.message, code: e.code }, 'Gateway GET falhou');
      if (['ECONNREFUSED','ECONNRESET','ERR_NETWORK','ENOTFOUND'].includes(e.code || '')) {
        throw new HttpException({ error: 'Gateway offline', code: 'GATEWAY_OFFLINE' }, HttpStatus.SERVICE_UNAVAILABLE);
      }
      if (e.code === 'ECONNABORTED') {
        throw new HttpException({ error: 'Gateway timeout', code: 'GATEWAY_TIMEOUT' }, HttpStatus.GATEWAY_TIMEOUT);
      }
      throw new HttpException({ error: e.message }, HttpStatus.BAD_GATEWAY);
    }
  }

  private async gPost(path: string, data: any, sender?: WaSender) {
    try {
      const baseUrl = sender?.gatewayUrl || GATEWAY_URL;
      const r = await axios.post(`${baseUrl}${path}`, data, { headers: this.headers(sender), timeout: GATEWAY_TIMEOUT });
      return r.data;
    } catch (err) {
      const e = err as AxiosError<any>;
      this.logger.warn({ path, status: e.response?.status, err: e.message, code: e.code }, 'Gateway POST falhou');
      if (['ECONNREFUSED','ECONNRESET','ERR_NETWORK','ENOTFOUND'].includes(e.code || '')) {
        throw new HttpException({ error: 'Gateway offline', code: 'GATEWAY_OFFLINE' }, HttpStatus.SERVICE_UNAVAILABLE);
      }
      if (e.response?.status === 503) {
        throw new HttpException({ error: 'WA desconectado — escaneie o QR', code: 'WA_DISCONNECTED' }, HttpStatus.SERVICE_UNAVAILABLE);
      }
      throw new HttpException({ error: (e.response?.data as any)?.error || e.message }, HttpStatus.BAD_GATEWAY);
    }
  }

  // ── Envio ─────────────────────────────────────────────────────────────────
  private async metaSendTemplate(data: ProspectSendData) {
    const to = String(data.phone || '').replace(/[^\d]/g, '');
    const templateName = data.templateName || META_WHATSAPP_TEMPLATE_INVITE;
    const lang = data.templateLang || META_WHATSAPP_TEMPLATE_LANG;
    if (!to) throw new HttpException({ error: 'phone obrigatorio' }, HttpStatus.BAD_REQUEST);
    if (!templateName) throw new HttpException({ error: 'template Meta nao configurado' }, HttpStatus.BAD_REQUEST);

    const r = await axios.post(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: lang },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${META_WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: GATEWAY_TIMEOUT,
      },
    );

    return {
      ok: true,
      provider: 'meta',
      type: 'template',
      messageId: r.data?.messages?.[0]?.id || null,
      raw: r.data,
    };
  }

  private async metaSendText(data: ProspectSendData) {
    const to = String(data.phone || '').replace(/[^\d]/g, '');
    if (!to) throw new HttpException({ error: 'phone obrigatorio' }, HttpStatus.BAD_REQUEST);

    const r = await axios.post(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body: data.text,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${META_WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: GATEWAY_TIMEOUT,
      },
    );

    return {
      ok: true,
      provider: 'meta',
      type: 'text',
      messageId: r.data?.messages?.[0]?.id || null,
      raw: r.data,
    };
  }

  /** Lead que vai receber: pelo id ou pelo telefone. */
  private async findLeadForSend(data: { prospectId?: string; phone?: string }) {
    if (data.prospectId) {
      const byId = await this.prisma.prospect.findUnique({ where: { id: data.prospectId } }).catch(() => null);
      if (byId) return byId;
    }
    return this.findProspectByPhoneNormalized(String(data.phone || ''));
  }

  /**
   * Trava central: vale para disparo individual, em lote e para o bot.
   * force = confirmação do próprio opt-out ("Pronto, não envio mais").
   */
  private async assertCanSend(data: ProspectSendData, sender: WaSender, force = false) {
    if (force) return;
    const lead = await this.findLeadForSend(data);
    const reason = sendBlockReason(lead, data.purpose || 'campaign', sender);
    if (reason) throw new ConsentBlockedError(reason);
  }

  async sendOne(data: ProspectSendData, options: { force?: boolean } = {}) {
    const sender = await this.getSender(data.senderId);
    await this.assertCanSend(data, sender, options.force);

    if (sender.provider === 'meta' && META_WA_ENABLED) {
      try {
        const mode = data.mode || 'template';
        const response = mode === 'text'
          ? await this.metaSendText(data)
          : await this.metaSendTemplate(data);
        this.logger.log({
          provider: 'meta',
          mode,
          to: String(data.phone || '').replace(/[^\d]/g, ''),
          template: mode === 'template' ? data.templateName || META_WHATSAPP_TEMPLATE_INVITE : undefined,
          messageId: response.messageId,
        }, 'Meta WhatsApp send aceito');

        await this.markMessageSent({
          phone: data.phone,
          prospectId: data.prospectId,
          scriptId: data.scriptId || data.templateName || META_WHATSAPP_TEMPLATE_INVITE,
          messageId: response.messageId || undefined,
          timestamp: Date.now(),
          text: mode === 'template' ? `[Template Meta] ${data.templateName || META_WHATSAPP_TEMPLATE_INVITE}` : data.text,
          imageUrl: data.imageUrl,
        });

        return response;
      } catch (err) {
        const e = err as AxiosError<any>;
        this.logger.warn({ status: e.response?.status, data: e.response?.data, err: e.message }, 'Meta WhatsApp send falhou');
        throw new HttpException(
          { error: e.response?.data?.error?.message || e.message, meta: e.response?.data?.error },
          e.response?.status || HttpStatus.BAD_GATEWAY,
        );
      }
    }

    return this.gPost('/send', data, sender);
  }

  /** Lote: quem não pode receber fica de fora e volta em `blocked`. */
  async sendBatch(messages: ProspectSendData[], senderId?: string) {
    const sender = await this.getSender(senderId);
    const allowed: ProspectSendData[] = [];
    const blocked: Array<{ phone: string; prospectId?: string; reason: string }> = [];
    for (const message of messages) {
      const withSender = { ...message, senderId: sender.id, purpose: message.purpose || 'campaign' as SendPurpose };
      const lead = await this.findLeadForSend(withSender);
      const reason = sendBlockReason(lead, withSender.purpose, sender);
      if (reason) blocked.push({ phone: message.phone, prospectId: message.prospectId, reason });
      else allowed.push(withSender);
    }
    if (!allowed.length) return { ok: true, total: 0, blocked };

    if (sender.provider === 'meta' && META_WA_ENABLED) {
      const results = [];
      for (const message of allowed) {
        results.push(await this.sendOne({ ...message, mode: message.mode || 'template' }));
      }
      return { ok: true, provider: 'meta', total: results.length, results, blocked };
    }

    const result = await this.gPost('/send-batch', { messages: allowed }, sender);
    return { ...result, blocked };
  }

  async getBotSettings() {
    const saved = await this.prisma.appSettings.findUnique({ where: { key: WA_BOT_SETTINGS_KEY } }).catch(() => null);
    if (!saved?.value) return DEFAULT_WA_BOT_SETTINGS;
    try {
      return mergeBotSettings(JSON.parse(saved.value));
    } catch {
      return DEFAULT_WA_BOT_SETTINGS;
    }
  }

  async updateBotSettings(data: any) {
    const settings = mergeBotSettings(data);
    await this.prisma.appSettings.upsert({
      where: { key: WA_BOT_SETTINGS_KEY },
      update: { value: JSON.stringify(settings), updatedAt: new Date() },
      create: { key: WA_BOT_SETTINGS_KEY, value: JSON.stringify(settings) },
    });
    return settings;
  }

  async listTemplates() {
    const count = await this.prisma.prospectTemplate.count();
    if (count === 0) {
      await this.replaceTemplates(DEFAULT_PROSPECT_TEMPLATES);
    }

    return this.prisma.prospectTemplate.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async replaceTemplates(data: any[]) {
    const templates = Array.isArray(data) ? data : [];
    if (!templates.length) {
      throw new HttpException({ error: 'templates obrigatorio' }, HttpStatus.BAD_REQUEST);
    }
    const sanitized = templates.map((item, index) => this.sanitizeTemplate(item, index));
    const ids = sanitized.map((item) => item.id).filter(Boolean) as string[];

    await this.prisma.$transaction(async (tx) => {
      await tx.prospectTemplate.deleteMany({
        where: ids.length ? { id: { notIn: ids } } : {},
      });

      for (const item of sanitized) {
        const { id, ...rest } = item;
        if (id) {
          await tx.prospectTemplate.upsert({
            where: { id },
            update: rest,
            create: { id, ...rest },
          });
        } else {
          await tx.prospectTemplate.create({ data: rest });
        }
      }
    });

    return this.prisma.prospectTemplate.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createTemplate(data: any) {
    const sortOrder = await this.prisma.prospectTemplate.count();
    const template = this.sanitizeTemplate(data, sortOrder);
    return this.prisma.prospectTemplate.create({ data: template });
  }

  async updateTemplate(id: string, data: any) {
    const template = this.sanitizeTemplate({ ...data, id }, Number(data?.sortOrder ?? 0));
    const { id: _id, ...rest } = template;
    return this.prisma.prospectTemplate.update({
      where: { id },
      data: rest,
    });
  }

  async deleteTemplate(id: string) {
    return this.prisma.prospectTemplate.delete({ where: { id } }).catch(() => ({ ok: true }));
  }

  /**
   * Bot de entrada (atendimento com consentimento):
   *  - SAIR/PARAR → opt-out (funciona mesmo com o bot desligado);
   *  - GATO/OI/OLÁ/ACHADOS/APP → menu; 1 app, 2 grupo, 3 humano;
   *  - atendimento humano: o bot para de responder esse contato;
   *  - sem palavra do menu → regras antigas por palavra-chave (se ligadas).
   */
  async handleAutoReply(data: InboundWaMessage, senderId?: string) {
    const settings = await this.getBotSettings();
    const prospect = await this.findOrCreateInboundProspect(data, senderId);
    if (!prospect) return { skipped: true, reason: 'unknown_inbound' };

    const intent = detectIntent(data.message, prospect.menuSentAt);
    const texts = settings.consentTexts;
    const reply = (text: string, scriptId: string, force = false) =>
      this.sendBotText(prospect, text, scriptId, senderId, force);

    if (intent === 'optout') {
      if (prospect.optoutAt) return { skipped: true, reason: 'already_opted_out', prospectId: prospect.id };
      await this.prisma.prospect.update({
        where: { id: prospect.id },
        data: { optoutAt: new Date(), optin: false, updatedAt: new Date() },
      });
      await this.recordEvent(prospect.id, 'optout', 'bot');
      await reply(texts.optout, 'wa_bot_optout', true);
      return { ok: true, intent, prospectId: prospect.id };
    }

    if (prospect.optoutAt) return { skipped: true, reason: 'opted_out', prospectId: prospect.id };
    if (prospect.humanHandoffAt) return { skipped: true, reason: 'human_handoff', prospectId: prospect.id };
    if (!settings.enabled) return { skipped: true, reason: 'bot_disabled' };

    if (intent === 'menu') {
      await reply(texts.menu, 'wa_bot_menu');
      await this.prisma.prospect.update({ where: { id: prospect.id }, data: { menuSentAt: new Date() } });
      return { ok: true, intent, prospectId: prospect.id };
    }
    if (intent === 'option_app') {
      await reply(fillLink(texts.app, this.trackedLink('app', prospect.id)), 'wa_bot_app');
      return { ok: true, intent, prospectId: prospect.id };
    }
    if (intent === 'option_group') {
      await reply(fillLink(texts.group, this.trackedLink('grupo', prospect.id)), 'wa_bot_group');
      return { ok: true, intent, prospectId: prospect.id };
    }
    if (intent === 'option_human') {
      await this.prisma.prospect.update({
        where: { id: prospect.id },
        data: { humanHandoffAt: new Date(), column: 'replied', status: 'replied', updatedAt: new Date() },
      });
      await this.recordEvent(prospect.id, 'handoff', 'bot');
      await reply(texts.human, 'wa_bot_human');
      this.email
        .sendWaHandoffAlert(HANDOFF_NOTIFY_EMAIL, { phone: prospect.phone, name: prospect.name, message: data.message })
        .catch((err) => this.logger.warn({ err: err?.message }, 'Aviso de atendimento humano falhou'));
      return { ok: true, intent, prospectId: prospect.id };
    }

    return this.legacyKeywordReply(data, prospect, settings, senderId);
  }

  private trackedLink(target: 'app' | 'grupo', prospectId: string) {
    return `${PUBLIC_API_URL}/api/wa/go/${target}?p=${encodeURIComponent(prospectId)}`;
  }

  private async sendBotText(prospect: any, text: string, scriptId: string, senderId?: string, force = false) {
    const response = await this.sendOne(
      { phone: prospect.phone, text, prospectId: prospect.id, scriptId, mode: 'text', senderId, purpose: 'reply' },
      { force },
    );
    await this.prisma.prospectMessage.create({
      data: {
        prospectId: prospect.id,
        direction: 'bot',
        body: text,
        waMessageId: response?.messageId || response?.id || null,
        sentAt: new Date(),
      },
    });
    await this.prisma.prospect.update({
      where: { id: prospect.id },
      data: { lastMessageId: response?.messageId || response?.id || null, updatedAt: new Date() },
    });
    return response;
  }

  // Regras antigas por palavra-chave (preço, saúde…), com intervalo de 5 min.
  private async legacyKeywordReply(data: InboundWaMessage, prospect: any, settings: any, senderId?: string) {
    const incoming = normalizeText(data.message);
    const matchedRule = (settings.rules || []).find((rule: any) => {
      if (!rule?.enabled || !rule?.response) return false;
      return (rule.keywords || []).some((keyword: string) => incoming.includes(normalizeText(keyword)));
    });
    const responseText = matchedRule?.response || (settings.fallbackEnabled ? settings.fallbackText : '');
    if (!responseText) return { skipped: true, reason: 'no_matching_rule' };

    const recentBotReply = await this.prisma.prospectMessage.findFirst({
      where: { prospectId: prospect.id, direction: 'bot', sentAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
      orderBy: { sentAt: 'desc' },
    });
    if (recentBotReply) return { skipped: true, reason: 'bot_cooldown', prospectId: prospect.id };

    await this.sendBotText(prospect, responseText, `wa_bot_${matchedRule?.id || 'fallback'}`, senderId);
    await this.prisma.prospect.update({
      where: { id: prospect.id },
      data: { status: 'replied', column: 'replied' },
    });
    return { ok: true, rule: matchedRule?.id || 'fallback', prospectId: prospect.id };
  }

  // ── Eventos, opt-in, métricas ─────────────────────────────────────────────
  private recordEvent(prospectId: string | null, type: string, source?: string) {
    return this.prisma.prospectEvent.create({ data: { prospectId, type, source: source || null } }).catch((err) => {
      this.logger.warn({ err: err?.message, type }, 'Evento de prospect não registrado');
    });
  }

  /** Clique no link do bot: registra e devolve o destino. */
  async trackClick(target: string, prospectId?: string) {
    const settings = await this.getBotSettings();
    const destination = target === 'grupo' ? settings.links.group : settings.links.app;
    const exists = prospectId
      ? await this.prisma.prospect.findUnique({ where: { id: prospectId }, select: { id: true } }).catch(() => null)
      : null;
    await this.recordEvent(exists?.id ?? null, target === 'grupo' ? 'click_group' : 'click_app', 'bot');
    return destination;
  }

  /**
   * Opt-in vindo do app, do gatedo.com/bio ou do bot. Opt-in explícito
   * desfaz um opt-out anterior e tira a etiqueta de importado.
   */
  async registerOptin(input: { phone: string; name?: string | null; source: OptinSource }) {
    const phone = normalizeBrPhone(input.phone);
    if (!phone) throw new HttpException({ error: 'Telefone inválido.' }, HttpStatus.BAD_REQUEST);
    const now = new Date();
    const existing = await this.findProspectByPhoneNormalized(phone);

    const prospect = existing
      ? await this.prisma.prospect.update({
          where: { id: existing.id },
          data: {
            optin: true,
            optinAt: now,
            optinSource: input.source,
            optoutAt: null,
            tags: (existing.tags || []).filter((t: string) => t !== IMPORTED_TAG),
            name: existing.name || input.name || null,
            updatedAt: now,
          },
        })
      : await this.prisma.prospect.create({
          data: {
            phone,
            name: input.name || null,
            origin: input.source,
            optin: true,
            optinAt: now,
            optinSource: input.source,
            status: 'pending',
            column: 'pending',
            tags: [],
            note: `Opt-in pelo ${input.source}`,
          },
        });
    await this.recordEvent(prospect.id, 'optin', input.source);
    return { ok: true };
  }

  async metrics(now = new Date()) {
    const today = startOfDayBrt(now);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [inboundToday, optins, optouts, clicksApp, clicksGroup, imported] = await Promise.all([
      this.prisma.prospectEvent.count({ where: { type: 'inbound', createdAt: { gte: today } } }),
      this.prisma.prospect.count({ where: { optin: true, optoutAt: null } }),
      this.prisma.prospect.count({ where: { optoutAt: { not: null } } }),
      this.prisma.prospectEvent.count({ where: { type: 'click_app', createdAt: { gte: weekAgo } } }),
      this.prisma.prospectEvent.count({ where: { type: 'click_group', createdAt: { gte: weekAgo } } }),
      this.prisma.prospect.count({ where: { tags: { has: IMPORTED_TAG } } }),
    ]);
    return { inboundToday, optins, optouts, clicksApp, clicksGroup, clicksPeriodDays: 7, imported };
  }

  async exportImported() {
    const rows = await this.prisma.prospect.findMany({
      where: { tags: { has: IMPORTED_TAG } },
      select: { phone: true, name: true, note: true, status: true, tags: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      'telefone,nome,nota,status,tags,criado_em',
      ...rows.map((r) => [r.phone, r.name, r.note, r.status, r.tags.join(' '), r.createdAt.toISOString()].map(esc).join(',')),
    ];
    return { count: rows.length, csv: lines.join('\n') };
  }

  async deleteImported() {
    const result = await this.prisma.prospect.deleteMany({ where: { tags: { has: IMPORTED_TAG } } });
    return { deleted: result.count };
  }

  async clearHandoff(id: string) {
    return this.prisma.prospect.update({ where: { id }, data: { humanHandoffAt: null, updatedAt: new Date() } });
  }

  // ── Status — NUNCA retorna 500, sempre retorna JSON seguro ────────────────
  async getGatewayStatus() {
    if (META_WA_ENABLED) {
      return {
        connected: true,
        hasQR: false,
        queueSize: 0,
        provider: 'meta',
        phoneNumberId: META_WHATSAPP_PHONE_NUMBER_ID,
        template: META_WHATSAPP_TEMPLATE_INVITE,
      };
    }

    try {
      return await this.gGet('/status', GATEWAY_STATUS_TIMEOUT);
    } catch {
      return { connected: false, hasQR: false, queueSize: 0, offline: true };
    }
  }

  async getQR() {
    try {
      return await this.gGet('/qr');
    } catch (e: any) {
      return { connected: false, qr: null, error: e?.response?.error || 'Gateway offline' };
    }
  }

  async reconnect() {
    try { return await this.gPost('/reconnect', {}); }
    catch { return { ok: false }; }
  }

  async disconnectGateway() {
    try { return await this.gPost('/disconnect', {}); }
    catch { return { ok: false, error: 'Gateway offline ou indisponivel' }; }
  }

  async clearGatewayQueue() {
    try { return await this.gPost('/clear-queue', {}); }
    catch { return { ok: false, error: 'Gateway offline ou indisponivel' }; }
  }

  // ── CRUD Prospects ────────────────────────────────────────────────────────
  async list() {
    await this.mergeDuplicateProspects().catch((err) => {
      this.logger.warn({ err: err?.message }, 'Falha ao unificar prospects duplicados');
    });
    return this.prisma.prospect.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { sentAt: 'asc' },
          take: 50,
        },
      },
    });
  }

  async mergeDuplicateProspects() {
    const prospects = await this.prisma.prospect.findMany({
      include: { _count: { select: { messages: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const groups = new Map<string, typeof prospects>();

    for (const prospect of prospects) {
      const key = canonicalPhone(prospect.phone);
      if (!key) continue;
      const list = groups.get(key) || [];
      list.push(prospect);
      groups.set(key, list);
    }

    let merged = 0;
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      const primary = [...group].sort((a: any, b: any) => {
        const scoreA = (a.name ? 1000 : 0) + (a.sentAt ? 500 : 0) + (a._count?.messages || 0) * 10 + new Date(a.createdAt).getTime() / 1e13;
        const scoreB = (b.name ? 1000 : 0) + (b.sentAt ? 500 : 0) + (b._count?.messages || 0) * 10 + new Date(b.createdAt).getTime() / 1e13;
        return scoreB - scoreA;
      })[0];
      const duplicates = group.filter((item) => item.id !== primary.id);
      await this.mergeProspectsInto(primary.id, duplicates.map((item) => item.id));
      merged += duplicates.length;
    }

    return { ok: true, merged };
  }

  private async mergeProspectsInto(primaryId: string, duplicateIds: string[]) {
    if (!duplicateIds.length) return null;
    const [primary, duplicates] = await Promise.all([
      this.prisma.prospect.findUnique({ where: { id: primaryId } }),
      this.prisma.prospect.findMany({ where: { id: { in: duplicateIds } } }),
    ]);
    if (!primary || !duplicates.length) return primary;

    const all = [primary, ...duplicates];
    const latestReply = all
      .filter((item) => item.lastReply || item.repliedAt)
      .sort((a, b) => Number(b.repliedAt || b.updatedAt) - Number(a.repliedAt || a.updatedAt))[0];
    const latestSent = all
      .filter((item) => item.sentAt)
      .sort((a, b) => Number(b.sentAt) - Number(a.sentAt))[0];
    const tags = [...new Set(all.flatMap((item) => Array.isArray(item.tags) ? item.tags : []))];
    const anyReplied = all.some((item) => (item.column || item.status) === 'replied' || item.repliedAt);

    return this.prisma.$transaction(async (tx) => {
      await tx.prospectMessage.updateMany({
        where: { prospectId: { in: duplicateIds } },
        data: { prospectId: primaryId },
      });
      const updated = await tx.prospect.update({
        where: { id: primaryId },
        data: {
          phone: primary.phone || duplicates.find((item) => item.phone)?.phone || '',
          name: primary.name || duplicates.find((item) => item.name)?.name || null,
          note: primary.note || duplicates.find((item) => item.note)?.note || null,
          score: Math.max(...all.map((item) => Number(item.score || 0))),
          tags,
          ...(anyReplied ? { status: 'replied', column: 'replied' } : {}),
          sentAt: latestSent?.sentAt || primary.sentAt || null,
          repliedAt: latestReply?.repliedAt || primary.repliedAt || null,
          lastReply: latestReply?.lastReply || primary.lastReply || null,
          lastMessageId: latestSent?.lastMessageId || primary.lastMessageId || null,
          scriptId: latestSent?.scriptId || primary.scriptId || null,
          updatedAt: new Date(),
        },
      });
      await tx.prospect.deleteMany({ where: { id: { in: duplicateIds } } });
      return updated;
    });
  }

  async upsert(data: any) {
    const id = data?.id ? String(data.id) : null;
    const rest = this.sanitizeProspect(data);
    if (!rest.phone) {
      throw new HttpException({ error: 'phone obrigatorio' }, HttpStatus.BAD_REQUEST);
    }
    // Criado pelo "Importar" do admin: lista sem consentimento.
    const importedCreate = {
      ...rest,
      origin: 'importado',
      tags: rest.tags.includes(IMPORTED_TAG) ? rest.tags : [...rest.tags, IMPORTED_TAG],
    };
    if (!id) return this.prisma.prospect.create({ data: importedCreate });
    return this.prisma.prospect.upsert({
      where:  { id },
      update: { ...rest, updatedAt: new Date() },
      create: { id, ...importedCreate },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.prospect.update({
      where: { id },
      data:  { status, column: status, updatedAt: new Date() },
    }).catch(() => ({ ok: true }));
  }

  async remove(id: string) {
    return this.prisma.prospect.delete({ where: { id } }).catch(() => ({ ok: true }));
  }

  async updateStatusByPhone(phone: string, status: string, extra: Record<string, any> = {}) {
    const tokens = phoneLookupTokens(phone);
    const n = tokens[tokens.length - 1] || '';
    if (!n) return { count: 0 };
    return this.prisma.prospect.updateMany({
      where: { phone: { contains: n } },
      data:  { status, column: status, ...extra, updatedAt: new Date() },
    });
  }

  async markMessageSent(data: { phone: string; prospectId?: string; scriptId?: string; messageId?: string; timestamp?: number; text?: string; imageUrl?: string }) {
    const sentAt = toDateFromGatewayTimestamp(data.timestamp || Date.now());
    const where = data.prospectId
      ? { id: data.prospectId }
      : { phone: { contains: String(data.phone || '').replace(/[^\d]/g, '').slice(-10) } };

    const prospect = data.prospectId
      ? await this.prisma.prospect.findUnique({ where: { id: data.prospectId } }).catch(() => null)
      : await this.prisma.prospect.findFirst({ where: where as any }).catch(() => null);

    if (!prospect) return { ok: false, reason: 'prospect_not_found' };
    const canMoveToSent = AUTO_SENT_STATUSES.has(prospect.column || prospect.status || '');

    if (data.text) {
      await this.prisma.prospectMessage.create({
        data: {
          prospectId: prospect.id,
          direction: 'outgoing',
          body: data.text,
          imageUrl: data.imageUrl || null,
          waMessageId: data.messageId || null,
          sentAt,
        },
      }).catch(() => null);
    }

    return this.prisma.prospect.update({
      where: { id: prospect.id },
      data: {
        ...(canMoveToSent ? { status: 'sent', column: 'sent' } : {}),
        sentAt,
        lastMessageId: data.messageId || null,
        scriptId: data.scriptId || prospect.scriptId || null,
        updatedAt: new Date(),
      },
    });
  }

  async saveIncomingMessage(data: InboundWaMessage, senderId?: string) {
    const p = await this.findOrCreateInboundProspect(data, senderId);
    if (!p) return { ok: true, skipped: true, reason: 'unknown_inbound' };
    return this.prisma.prospectMessage.create({
      data: {
        prospectId:  p.id,
        direction:   'incoming',
        body:        data.message,
        waMessageId: data.messageId,
        sentAt:      toDateFromGatewayTimestamp(data.timestamp),
      },
    });
  }

  async handleMetaWebhook(body: any) {
    const entries = Array.isArray(body?.entry) ? body.entry : [];
    let messages = 0;
    let statuses = 0;

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change?.value || {};
        const phoneNumberId = value?.metadata?.phone_number_id || null;

        for (const status of Array.isArray(value?.statuses) ? value.statuses : []) {
          statuses += 1;
          await this.handleMetaStatus(status, phoneNumberId);
        }

        for (const message of Array.isArray(value?.messages) ? value.messages : []) {
          messages += 1;
          await this.handleMetaIncomingMessage(message, phoneNumberId);
        }
      }
    }

    if (messages || statuses) {
      this.logger.log({ messages, statuses }, 'Meta WhatsApp webhook processado');
    }

    return { ok: true, messages, statuses };
  }

  private async handleMetaStatus(status: any, phoneNumberId?: string | null) {
    const messageId = String(status?.id || '');
    const state = String(status?.status || '');
    const recipientId = String(status?.recipient_id || '');
    const errors = Array.isArray(status?.errors) ? status.errors : [];

    if (state === 'failed' || errors.length) {
      this.logger.warn({ messageId, state, recipientId, phoneNumberId, errors }, 'Meta WhatsApp entrega falhou');
      return;
    }

    this.logger.log({ messageId, state, recipientId, phoneNumberId }, 'Meta WhatsApp status');
  }

  private async handleMetaIncomingMessage(message: any, phoneNumberId?: string | null) {
    const from = String(message?.from || '');
    if (!from) return;

    const inbound: InboundWaMessage = {
      phone: from,
      message: this.extractMetaMessageText(message),
      timestamp: Number(message?.timestamp || Date.now()),
      messageId: String(message?.id || ''),
      remoteJid: `${from}@meta`,
      quotedMessageId: message?.context?.id ? String(message.context.id) : null,
      quotedParticipant: message?.context?.from ? String(message.context.from) : null,
    };

    await this.saveIncomingMessage(inbound);
    await this.handleAutoReply(inbound).catch((err) => {
      this.logger.warn({ err: err?.message, phone: inbound.phone, phoneNumberId }, 'Meta WhatsApp bot nao respondeu');
    });
  }

  private extractMetaMessageText(message: any) {
    const type = String(message?.type || '');
    if (type === 'text') return String(message?.text?.body || '');
    if (type === 'button') return String(message?.button?.text || message?.button?.payload || '[botao]');
    if (type === 'interactive') {
      return String(
        message?.interactive?.button_reply?.title ||
        message?.interactive?.list_reply?.title ||
        message?.interactive?.button_reply?.id ||
        message?.interactive?.list_reply?.id ||
        '[interativo]',
      );
    }
    if (type === 'image') return String(message?.image?.caption || '[midia]');
    if (type === 'video') return String(message?.video?.caption || '[midia]');
    if (type === 'document') return String(message?.document?.caption || message?.document?.filename || '[documento]');
    if (type === 'audio') return '[audio]';
    if (type === 'sticker') return '[figurinha]';
    if (type === 'location') return '[localizacao]';
    if (type === 'contacts') return '[contato]';
    return type ? `[${type}]` : '[mensagem]';
  }

  private async findProspectByPhoneNormalized(phone: string) {
    const targetTokens = new Set(phoneLookupTokens(phone));
    const targetCanonical = canonicalPhone(phone);
    if (!targetCanonical && !targetTokens.size) return null;

    const prospects = await this.prisma.prospect.findMany({
      include: { _count: { select: { messages: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    const matches = prospects.filter((item) => {
      const itemCanonical = canonicalPhone(item.phone);
      if (itemCanonical && itemCanonical === targetCanonical) return true;
      const itemTokens = phoneLookupTokens(item.phone);
      return itemTokens.some((token) => targetTokens.has(token));
    });

    return matches.sort((a: any, b: any) => {
      const scoreA = (a.name ? 1000 : 0) + (a.sentAt ? 500 : 0) + (a._count?.messages || 0) * 10 + new Date(a.updatedAt).getTime() / 1e13;
      const scoreB = (b.name ? 1000 : 0) + (b.sentAt ? 500 : 0) + (b._count?.messages || 0) * 10 + new Date(b.updatedAt).getTime() / 1e13;
      return scoreB - scoreA;
    })[0] || null;
  }

  private async findDuplicateProspectIds(primaryId: string, phone: string) {
    const targetTokens = new Set(phoneLookupTokens(phone));
    const targetCanonical = canonicalPhone(phone);
    if (!targetCanonical && !targetTokens.size) return [];

    const prospects = await this.prisma.prospect.findMany({
      where: { id: { not: primaryId } },
      select: { id: true, phone: true },
    });

    return prospects
      .filter((item) => {
        const itemCanonical = canonicalPhone(item.phone);
        if (itemCanonical && itemCanonical === targetCanonical) return true;
        return phoneLookupTokens(item.phone).some((token) => targetTokens.has(token));
      })
      .map((item) => item.id);
  }

  private async findOrCreateInboundProspect(data: InboundWaMessage, senderId?: string) {
    const phone = String(data.phone || '').replace(/[^\d]/g, '');
    const message = data.message;
    let existing: any = null;

    if (data.quotedMessageId) {
      const quoted = await this.prisma.prospectMessage.findFirst({
        where: { waMessageId: data.quotedMessageId },
        include: { prospect: true },
        orderBy: { sentAt: 'desc' },
      });
      existing = quoted?.prospect || null;
    }

    if (!existing && data.quotedMessageId) {
      existing = await this.prisma.prospect.findFirst({
        where: { lastMessageId: data.quotedMessageId },
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (!existing) {
      const tokens = phoneLookupTokens(phone);
      if (tokens.length) {
        existing = await this.prisma.prospect.findFirst({
          where: { OR: tokens.map((token) => ({ phone: { contains: token } })) },
          orderBy: { updatedAt: 'desc' },
        });
      }
    }

    if (!existing) {
      existing = await this.findProspectByPhoneNormalized(phone);
    }

    if (existing) {
      existing = await this.mergeProspectsInto(existing.id, (await this.findDuplicateProspectIds(existing.id, phone))) || existing;
    }

    if (existing) {
      return this.prisma.prospect.update({
        where: { id: existing.id },
        data: {
          status: 'replied',
          column: 'replied',
          repliedAt: new Date(),
          lastReply: message,
          updatedAt: new Date(),
        },
      });
    }

    // Quem escreve primeiro sempre entra no CRM, com origem "inbound". O gateway
    // já descarta grupos, canais e mensagens do próprio número.
    if (!phone) return null;
    const created = await this.prisma.prospect.create({
      data: {
        phone,
        name: null,
        note: `Entrada pelo WhatsApp: ${String(message || '').slice(0, 140)}`,
        status: 'replied',
        column: 'replied',
        score: 40,
        tags: [INBOUND_TAG],
        origin: 'inbound',
        senderId: senderId || null,
        repliedAt: new Date(),
        lastReply: message,
      },
    });
    await this.recordEvent(created.id, 'inbound', senderId || PRINCIPAL_SENDER_ID);
    return created;
  }

  async saveDeliveryReceipt(data: any) {
    this.logger.debug({ data }, 'delivery receipt');
  }
}

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios, { AxiosError } from 'axios';

const GATEWAY_URL = (process.env.GATEWAY_URL || process.env.WA_GATEWAY_URL || 'https://gatedo-wa-gateway.onrender.com').replace(/\/+$/, '');
const GATEWAY_SECRET  = process.env.GATEWAY_SECRET || process.env.WA_GATEWAY_SECRET || 'change-me-in-render-env';
const GATEWAY_TIMEOUT = Number(process.env.WA_GATEWAY_TIMEOUT_MS || process.env.GATEWAY_TIMEOUT_MS || 45000);
const GATEWAY_STATUS_TIMEOUT = Number(process.env.WA_GATEWAY_STATUS_TIMEOUT_MS || 8000);
const WA_BOT_SETTINGS_KEY = 'wa_bot_settings';

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
const ALLOW_UNKNOWN_WA_INBOUND = process.env.ALLOW_UNKNOWN_WA_INBOUND === 'true';

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

function mergeBotSettings(raw: any) {
  const settings = raw && typeof raw === 'object' ? raw : {};
  const customRules = Array.isArray(settings.rules) ? settings.rules : [];
  return {
    ...DEFAULT_WA_BOT_SETTINGS,
    ...settings,
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
  constructor(private readonly prisma: PrismaService) {}

  private headers() {
    return { 'x-gateway-secret': GATEWAY_SECRET };
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

  private async gPost(path: string, data: any) {
    try {
      const r = await axios.post(`${GATEWAY_URL}${path}`, data, { headers: this.headers(), timeout: GATEWAY_TIMEOUT });
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
  async sendOne(data: { phone: string; text: string; imageUrl?: string; prospectId: string; scriptId?: string }) {
    return this.gPost('/send', data);
  }

  async sendBatch(messages: Array<{ phone: string; text: string; imageUrl?: string; prospectId: string; scriptId?: string }>) {
    return this.gPost('/send-batch', { messages });
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

  async handleAutoReply(data: InboundWaMessage) {
    const settings = await this.getBotSettings();
    if (!settings.enabled) return { skipped: true, reason: 'bot_disabled' };

    const phone = String(data.phone || '').replace(/[^\d]/g, '');
    const incoming = normalizeText(data.message);
    const matchedRule = (settings.rules || []).find((rule: any) => {
      if (!rule?.enabled || !rule?.response) return false;
      return (rule.keywords || []).some((keyword: string) => incoming.includes(normalizeText(keyword)));
    });

    const responseText = matchedRule?.response || (settings.fallbackEnabled ? settings.fallbackText : '');
    if (!phone || !responseText) {
      return {
        skipped: true,
        reason: 'no_matching_rule',
        enabled: settings.enabled,
        fallbackEnabled: settings.fallbackEnabled,
      };
    }

    const prospect = await this.findOrCreateInboundProspect(data);
    if (!prospect) return { skipped: true, reason: 'unknown_inbound' };
    const recentBotReply = await this.prisma.prospectMessage.findFirst({
      where: {
        prospectId: prospect.id,
        direction: 'bot',
        sentAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
      orderBy: { sentAt: 'desc' },
    });
    if (recentBotReply) return { skipped: true, reason: 'bot_cooldown', prospectId: prospect.id };

    const response = await this.sendOne({
      phone: prospect.phone || phone,
      text: responseText,
      prospectId: prospect.id,
      scriptId: `wa_bot_${matchedRule?.id || 'fallback'}`,
    });

    await this.prisma.prospectMessage.create({
      data: {
        prospectId: prospect.id,
        direction: 'bot',
        body: responseText,
        waMessageId: response?.messageId || response?.id || null,
        sentAt: new Date(),
      },
    });

    await this.prisma.prospect.update({
      where: { id: prospect.id },
      data: {
        status: 'replied',
        column: 'replied',
        lastMessageId: response?.messageId || response?.id || null,
        updatedAt: new Date(),
      },
    });

    return { ok: true, rule: matchedRule?.id || 'fallback', prospectId: prospect.id };
  }

  // ── Status — NUNCA retorna 500, sempre retorna JSON seguro ────────────────
  async getGatewayStatus() {
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

  async clearGatewayQueue() {
    try { return await this.gPost('/clear-queue', {}); }
    catch { return { ok: false, error: 'Gateway offline ou indisponivel' }; }
  }

  // ── CRUD Prospects ────────────────────────────────────────────────────────
  async list() {
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

  async upsert(data: any) {
    const id = data?.id ? String(data.id) : null;
    const rest = this.sanitizeProspect(data);
    if (!rest.phone) {
      throw new HttpException({ error: 'phone obrigatorio' }, HttpStatus.BAD_REQUEST);
    }
    if (!id) return this.prisma.prospect.create({ data: rest });
    return this.prisma.prospect.upsert({
      where:  { id },
      update: { ...rest, updatedAt: new Date() },
      create: { id, ...rest },
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

  async saveIncomingMessage(data: InboundWaMessage) {
    const p = await this.findOrCreateInboundProspect(data);
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

  private async findOrCreateInboundProspect(data: InboundWaMessage) {
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

    if (!ALLOW_UNKNOWN_WA_INBOUND) {
      this.logger.log({ phone, remoteJid: data.remoteJid }, 'Inbound WA desconhecido ignorado');
      return null;
    }

    return this.prisma.prospect.create({
      data: {
        phone,
        name: null,
        note: `Entrada pelo WhatsApp: ${String(message || '').slice(0, 140)}`,
        status: 'replied',
        column: 'replied',
        score: 40,
        tags: ['inbound'],
        repliedAt: new Date(),
        lastReply: message,
      },
    });
  }

  async saveDeliveryReceipt(data: any) {
    this.logger.debug({ data }, 'delivery receipt');
  }
}

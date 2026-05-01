import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios, { AxiosError } from 'axios';

const GATEWAY_URL = (process.env.GATEWAY_URL || process.env.WA_GATEWAY_URL || 'https://gatedo-wa-gateway.onrender.com').replace(/\/+$/, '');
const GATEWAY_SECRET  = process.env.GATEWAY_SECRET || process.env.WA_GATEWAY_SECRET || 'change-me-in-render-env';
const GATEWAY_TIMEOUT = 12000;
const WA_BOT_SETTINGS_KEY = 'wa_bot_settings';

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

function normalizeText(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
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

  // ── Chamadas ao Gateway com erro robusto ───────────────────────────────────
  private async gGet(path: string) {
    try {
      const r = await axios.get(`${GATEWAY_URL}${path}`, { headers: this.headers(), timeout: GATEWAY_TIMEOUT });
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

  async handleAutoReply(data: { phone: string; message: string; timestamp: number; messageId: string }) {
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

    const prospect = await this.findOrCreateInboundProspect(phone, data.message);
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
      phone,
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
      return await this.gGet('/status');
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

  // ── CRUD Prospects ────────────────────────────────────────────────────────
  async list() {
    return this.prisma.prospect.findMany({ orderBy: { createdAt: 'desc' } });
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
    const n = phone.replace(/[^\d]/g, '').slice(-10);
    return this.prisma.prospect.updateMany({
      where: { phone: { contains: n } },
      data:  { status, column: status, ...extra, updatedAt: new Date() },
    });
  }

  async saveIncomingMessage(data: { phone: string; message: string; timestamp: number; messageId: string }) {
    const p = await this.findOrCreateInboundProspect(data.phone, data.message);
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

  private async findOrCreateInboundProspect(phone: string, message: string) {
    const n = phone.replace(/[^\d]/g, '').slice(-10);
    const existing = await this.prisma.prospect.findFirst({ where: { phone: { contains: n } } });
    if (existing) return existing;

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

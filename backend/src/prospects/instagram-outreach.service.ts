import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { PrismaService } from '../prisma/prisma.service';

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v24.0';
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;
const IG_ACCESS_TOKEN =
  process.env.INSTAGRAM_ACCESS_TOKEN ||
  process.env.META_ACCESS_TOKEN ||
  process.env.FB_MARKETING_ACCESS_TOKEN ||
  '';
const IG_BUSINESS_ID = process.env.INSTAGRAM_BUSINESS_ID || process.env.META_IG_BUSINESS_ID || '';
const SEND_ENABLED = String(process.env.INSTAGRAM_SEND_ENABLED || '').toLowerCase() === 'true';
const MESSAGE_WINDOW_HOURS = Number(process.env.INSTAGRAM_MESSAGE_WINDOW_HOURS || 24);
const PRIVATE_REPLY_DAYS = Number(process.env.INSTAGRAM_PRIVATE_REPLY_DAYS || 7);

const DEFAULT_TEMPLATES = [
  {
    name: 'Resposta a comentario',
    category: 'comment_reply',
    body:
      'Oi, {firstName}! Vi seu comentario e achei que o Gatedo pode te ajudar a organizar a rotina de saude do seu gato. Posso te mostrar como funciona?',
  },
  {
    name: 'Boas-vindas DM',
    category: 'inbox',
    body:
      'Oi, {firstName}! Que bom te ver por aqui. O Gatedo e um app feito para tutores de gatos acompanharem saude, vacinas, historico e rotina felina.',
  },
  {
    name: 'Convite fundador',
    category: 'conversion',
    body:
      'Temos uma condicao de fundador para os primeiros tutores. Se fizer sentido para voce, posso te enviar o link com os detalhes.',
  },
];

function firstName(name?: string | null) {
  return String(name || '').trim().split(/\s+/)[0] || 'tudo bem';
}

function renderTemplate(body: string, lead: any) {
  return body
    .replaceAll('{firstName}', firstName(lead.fullName || lead.username))
    .replaceAll('{username}', lead.username || '')
    .replaceAll('{name}', lead.fullName || lead.username || '');
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

@Injectable()
export class InstagramOutreachService {
  private readonly logger = new Logger(InstagramOutreachService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma as any;
  }

  getConfig() {
    return {
      configured: Boolean(IG_ACCESS_TOKEN && IG_BUSINESS_ID),
      sendEnabled: SEND_ENABLED,
      businessId: IG_BUSINESS_ID || null,
      graphVersion: GRAPH_VERSION,
      guardrails: [
        'Nao enviar DM frio para perfis sem interacao ou consentimento.',
        'Responder apenas conversas abertas, comentarios elegiveis ou leads de campanhas de mensagem.',
        'Quando a janela oficial nao existir, registrar tarefa manual/campanha em vez de disparar mensagem.',
      ],
      requiredEnv: [
        'INSTAGRAM_ACCESS_TOKEN ou META_ACCESS_TOKEN',
        'INSTAGRAM_BUSINESS_ID ou META_IG_BUSINESS_ID',
        'INSTAGRAM_SEND_ENABLED=true apenas depois da revisao final',
      ],
    };
  }

  async getHealth() {
    if (!IG_ACCESS_TOKEN || !IG_BUSINESS_ID) {
      return { ok: false, status: 'not_configured', reason: 'Credenciais do Instagram nao configuradas' };
    }

    try {
      const response = await axios.get(`${GRAPH_URL}/${IG_BUSINESS_ID}`, {
        timeout: 12000,
        params: {
          fields: 'id,username,name,profile_picture_url',
          access_token: IG_ACCESS_TOKEN,
        },
      });
      return { ok: true, status: 'connected', account: response.data };
    } catch (err) {
      const e = err as AxiosError<any>;
      const metaError = e.response?.data?.error;
      this.logger.warn({ status: e.response?.status, message: metaError?.message || e.message }, 'Instagram API falhou');
      return {
        ok: false,
        status: 'error',
        reason: metaError?.message || e.message,
        code: metaError?.code,
      };
    }
  }

  async listLeads(query: any = {}) {
    const where: any = {};
    if (query.status && query.status !== 'all') where.status = String(query.status);
    if (query.source && query.source !== 'all') where.source = String(query.source);

    const take = Math.min(Number(query.limit) || 80, 200);
    const leads = await this.db.instagramLead.findMany({
      where,
      take,
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        messages: { take: 3, orderBy: { createdAt: 'desc' } },
        interactions: { take: 3, orderBy: { occurredAt: 'desc' } },
      },
    });

    return { data: leads.map((lead: any) => ({ ...lead, policy: this.evaluatePolicy(lead) })) };
  }

  async upsertLead(body: any) {
    const username = String(body.username || '').replace(/^@/, '').trim() || null;
    const instagramUserId = body.instagramUserId ? String(body.instagramUserId) : null;

    if (!username && !instagramUserId) {
      throw new BadRequestException('username ou instagramUserId obrigatorio');
    }

    const data = {
      instagramUserId,
      username,
      fullName: body.fullName || body.name || null,
      profileUrl: body.profileUrl || (username ? `https://instagram.com/${username}` : null),
      avatarUrl: body.avatarUrl || null,
      source: body.source || 'manual',
      status: body.status || 'new',
      score: Number(body.score || 0),
      tags: Array.isArray(body.tags) ? body.tags : [],
      notes: body.notes || null,
      consentStatus: body.consentStatus || 'unknown',
      lastInteractionAt: body.lastInteractionAt ? new Date(body.lastInteractionAt) : undefined,
      conversationWindowUntil: body.conversationWindowUntil ? new Date(body.conversationWindowUntil) : undefined,
    };

    const existing = instagramUserId
      ? await this.db.instagramLead.findUnique({ where: { instagramUserId } })
      : await this.db.instagramLead.findFirst({ where: { username } });

    if (existing) {
      return this.db.instagramLead.update({ where: { id: existing.id }, data });
    }

    return this.db.instagramLead.create({ data });
  }

  async updateLead(id: string, body: any) {
    return this.db.instagramLead.update({
      where: { id },
      data: {
        status: body.status,
        score: body.score === undefined ? undefined : Number(body.score),
        tags: Array.isArray(body.tags) ? body.tags : undefined,
        notes: body.notes,
        consentStatus: body.consentStatus,
      },
    });
  }

  async addInteraction(body: any) {
    if (!body.leadId && !body.username && !body.instagramUserId) {
      throw new BadRequestException('leadId, username ou instagramUserId obrigatorio');
    }

    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
    const lead = body.leadId
      ? await this.db.instagramLead.findUnique({ where: { id: String(body.leadId) } })
      : await this.upsertLead({
          username: body.username,
          instagramUserId: body.instagramUserId,
          fullName: body.fullName,
          source: body.source || 'interaction',
          lastInteractionAt: occurredAt,
        });

    if (!lead) throw new BadRequestException('lead nao encontrado');

    const type = String(body.type || 'comment');
    const privateReplyUntil = type === 'comment' ? addDays(occurredAt, PRIVATE_REPLY_DAYS) : null;
    const conversationWindowUntil = ['dm_received', 'ad_message', 'comment_reply'].includes(type)
      ? addHours(occurredAt, MESSAGE_WINDOW_HOURS)
      : undefined;

    const interaction = await this.db.instagramInteraction.create({
      data: {
        leadId: lead.id,
        type,
        mediaId: body.mediaId || null,
        commentId: body.commentId || null,
        permalink: body.permalink || null,
        text: body.text || null,
        occurredAt,
        privateReplyUntil,
        metadata: body.metadata || undefined,
      },
    });

    await this.db.instagramLead.update({
      where: { id: lead.id },
      data: {
        lastInteractionAt: occurredAt,
        conversationWindowUntil,
        source: body.source || lead.source,
      },
    });

    return interaction;
  }

  async listTemplates() {
    await this.ensureDefaultTemplates();
    return { data: await this.db.instagramTemplate.findMany({ orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }] }) };
  }

  async saveTemplate(body: any) {
    if (!body.name || !body.body) throw new BadRequestException('name e body obrigatorios');
    if (body.id) {
      return this.db.instagramTemplate.update({
        where: { id: String(body.id) },
        data: { name: body.name, category: body.category || 'outreach', body: body.body, active: body.active ?? true },
      });
    }
    return this.db.instagramTemplate.create({
      data: { name: body.name, category: body.category || 'outreach', body: body.body, active: body.active ?? true },
    });
  }

  async previewMessage(leadId: string, templateId: string) {
    const lead = await this.db.instagramLead.findUnique({ where: { id: leadId } });
    const template = await this.db.instagramTemplate.findUnique({ where: { id: templateId } });
    if (!lead || !template) throw new BadRequestException('lead/template invalido');
    return { text: renderTemplate(template.body, lead), policy: this.evaluatePolicy(lead) };
  }

  async sendMessage(body: any) {
    const lead = await this.db.instagramLead.findUnique({ where: { id: String(body.leadId) } });
    if (!lead) throw new BadRequestException('lead nao encontrado');

    const template = body.templateId
      ? await this.db.instagramTemplate.findUnique({ where: { id: String(body.templateId) } })
      : null;
    const text = String(body.text || (template ? renderTemplate(template.body, lead) : '')).trim();
    if (!text) throw new BadRequestException('texto obrigatorio');

    const policy = this.evaluatePolicy(lead);
    if (!policy.allowed) {
      await this.logCompliance('instagram_send', lead.id, false, policy.reason, { templateId: body.templateId });
      await this.db.instagramMessage.create({
        data: {
          leadId: lead.id,
          direction: 'out',
          body: text,
          templateId: body.templateId || null,
          status: 'blocked',
          blockedReason: policy.reason,
        },
      });
      throw new ConflictException({
        code: 'IG_POLICY_BLOCKED',
        error: policy.reason,
        recommendation: 'Use campanha de mensagem, responda publicamente ou aguarde o lead iniciar uma DM.',
      });
    }

    if (!SEND_ENABLED) {
      await this.logCompliance('instagram_send_dry_run', lead.id, true, 'Envio real desativado por configuracao', {
        templateId: body.templateId,
      });
      return this.db.instagramMessage.create({
        data: {
          leadId: lead.id,
          direction: 'out',
          body: text,
          templateId: body.templateId || null,
          status: 'ready_manual',
        },
      });
    }

    if (!lead.instagramUserId) {
      throw new ConflictException({
        code: 'IG_RECIPIENT_MISSING',
        error: 'Lead sem instagramUserId. Envio oficial exige recipient id recebido por webhook/interacao elegivel.',
      });
    }

    const response = await axios.post(
      `${GRAPH_URL}/${IG_BUSINESS_ID}/messages`,
      {
        recipient: { id: lead.instagramUserId },
        message: { text },
      },
      { timeout: 15000, params: { access_token: IG_ACCESS_TOKEN } },
    );

    await this.logCompliance('instagram_send', lead.id, true, 'Mensagem enviada dentro das regras', {
      templateId: body.templateId,
    });

    return this.db.instagramMessage.create({
      data: {
        leadId: lead.id,
        direction: 'out',
        body: text,
        templateId: body.templateId || null,
        metaMessageId: response.data?.message_id || response.data?.id || null,
        status: 'sent',
        sentAt: new Date(),
      },
    });
  }

  async getSummary() {
    const [total, newCount, warm, blocked, messages] = await Promise.all([
      this.db.instagramLead.count(),
      this.db.instagramLead.count({ where: { status: 'new' } }),
      this.db.instagramLead.count({ where: { status: { in: ['replied', 'interested', 'qualified'] } } }),
      this.db.instagramMessage.count({ where: { status: 'blocked' } }),
      this.db.instagramMessage.count({ where: { direction: 'out' } }),
    ]);

    return { total, new: newCount, warm, blocked, messages };
  }

  private evaluatePolicy(lead: any) {
    const now = new Date();
    const windowUntil = lead.conversationWindowUntil ? new Date(lead.conversationWindowUntil) : null;
    const hasConversationWindow = Boolean(windowUntil && windowUntil > now);
    const consent = ['opted_in', 'customer_care', 'ad_message'].includes(String(lead.consentStatus || ''));

    if (hasConversationWindow || consent) {
      return { allowed: true, mode: SEND_ENABLED ? 'api' : 'manual_ready', reason: 'Lead possui janela de conversa ou consentimento registrado' };
    }

    return {
      allowed: false,
      mode: 'manual_only',
      reason: 'Sem janela de conversa/consentimento. Nao enviar DM frio pela API.',
    };
  }

  private async ensureDefaultTemplates() {
    const count = await this.db.instagramTemplate.count();
    if (count > 0) return;
    await this.db.instagramTemplate.createMany({
      data: DEFAULT_TEMPLATES.map((template) => ({ ...template, active: true, isDefault: true })),
    });
  }

  private async logCompliance(action: string, leadId: string | null, allowed: boolean, reason: string, metadata?: any) {
    await this.db.instagramComplianceLog.create({ data: { action, leadId, allowed, reason, metadata } });
  }
}

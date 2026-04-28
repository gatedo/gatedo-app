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
const IG_WEBHOOK_VERIFY_TOKEN =
  process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ||
  process.env.META_IG_WEBHOOK_VERIFY_TOKEN ||
  'gatedo_instagram_webhook';

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
  private schemaReady = false;

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
        'INSTAGRAM_WEBHOOK_VERIFY_TOKEN',
        'INSTAGRAM_SEND_ENABLED=true apenas depois da revisao final',
      ],
    };
  }

  verifyWebhook(mode?: string, token?: string, challenge?: string) {
    if (mode === 'subscribe' && token === IG_WEBHOOK_VERIFY_TOKEN && challenge) {
      return challenge;
    }

    throw new BadRequestException('Webhook Instagram invalido');
  }

  async handleWebhook(payload: any) {
    await this.ensureSchema();

    const entries = Array.isArray(payload?.entry) ? payload.entry : [];
    let processed = 0;

    for (const entry of entries) {
      processed += await this.processMessagingEvents(entry);
      processed += await this.processChangeEvents(entry);
    }

    if (!processed) {
      this.logger.log({ object: payload?.object, entries: entries.length }, 'Webhook Instagram recebido sem eventos processaveis');
    }

    return { ok: true, processed };
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
    await this.ensureSchema();
    const take = Math.min(Number(query.limit) || 80, 200);
    const status = query.status && query.status !== 'all' ? String(query.status) : null;
    const source = query.source && query.source !== 'all' ? String(query.source) : null;

    const leads = await this.prisma.$queryRawUnsafe<any[]>(
      `
        SELECT *
        FROM "InstagramLead"
        WHERE ($1::text IS NULL OR "status" = $1)
          AND ($2::text IS NULL OR "source" = $2)
        ORDER BY "updatedAt" DESC
        LIMIT $3
      `,
      status,
      source,
      take,
    );

    return { data: leads.map((lead: any) => ({ ...lead, policy: this.evaluatePolicy(lead) })) };
  }

  async upsertLead(body: any) {
    await this.ensureSchema();
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
    await this.ensureSchema();
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
    await this.ensureSchema();
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

  private async processMessagingEvents(entry: any) {
    const events = Array.isArray(entry?.messaging) ? entry.messaging : [];
    let processed = 0;

    for (const event of events) {
      const senderId = event?.sender?.id ? String(event.sender.id) : null;
      const messageText = event?.message?.text || event?.postback?.title || event?.postback?.payload || '';
      const occurredAt = event?.timestamp ? new Date(Number(event.timestamp)) : new Date();

      if (!senderId || !messageText) continue;

      const lead = await this.upsertLead({
        instagramUserId: senderId,
        source: event?.postback ? 'ig_postback' : 'ig_dm',
        status: 'replied',
        consentStatus: 'customer_care',
        lastInteractionAt: occurredAt,
        conversationWindowUntil: addHours(occurredAt, MESSAGE_WINDOW_HOURS),
      });

      await this.addInteraction({
        leadId: lead.id,
        type: event?.postback ? 'postback' : 'dm_received',
        source: event?.postback ? 'ig_postback' : 'ig_dm',
        text: messageText,
        occurredAt,
        metadata: {
          mid: event?.message?.mid,
          quickReply: event?.message?.quick_reply,
          postback: event?.postback,
          recipient: event?.recipient,
        },
      });

      await this.db.instagramMessage.create({
        data: {
          leadId: lead.id,
          direction: 'in',
          body: messageText,
          metaMessageId: event?.message?.mid || null,
          status: 'received',
          sentAt: occurredAt,
        },
      });

      processed += 1;
    }

    return processed;
  }

  private async processChangeEvents(entry: any) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    let processed = 0;

    for (const change of changes) {
      const field = String(change?.field || '');
      const value = change?.value || {};

      if (!['comments', 'mentions', 'live_comments'].includes(field)) continue;

      const from = value.from || {};
      const username = from.username || value.username || null;
      const instagramUserId = from.id || value.user_id || null;
      const text = value.text || value.message || '';
      const occurredAt = value.created_time ? new Date(Number(value.created_time) * 1000) : new Date();

      if (!username && !instagramUserId) continue;

      const lead = await this.upsertLead({
        username,
        instagramUserId,
        fullName: from.name,
        source: `ig_${field}`,
        status: 'new',
        consentStatus: 'commented',
        lastInteractionAt: occurredAt,
      });

      await this.addInteraction({
        leadId: lead.id,
        type: field === 'comments' ? 'comment' : field,
        source: `ig_${field}`,
        text,
        occurredAt,
        mediaId: value.media?.id || value.media_id || null,
        commentId: value.id || value.comment_id || null,
        permalink: value.permalink || null,
        metadata: value,
      });

      processed += 1;
    }

    return processed;
  }

  async listTemplates() {
    await this.ensureSchema();
    await this.ensureDefaultTemplates();
    return { data: await this.db.instagramTemplate.findMany({ orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }] }) };
  }

  async saveTemplate(body: any) {
    await this.ensureSchema();
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
    await this.ensureSchema();
    const lead = await this.db.instagramLead.findUnique({ where: { id: leadId } });
    const template = await this.db.instagramTemplate.findUnique({ where: { id: templateId } });
    if (!lead || !template) throw new BadRequestException('lead/template invalido');
    return { text: renderTemplate(template.body, lead), policy: this.evaluatePolicy(lead) };
  }

  async sendMessage(body: any) {
    await this.ensureSchema();
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
    await this.ensureSchema();
    const [row] = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        (SELECT COUNT(*)::int FROM "InstagramLead") AS total,
        (SELECT COUNT(*)::int FROM "InstagramLead" WHERE "status" = 'new') AS new,
        (SELECT COUNT(*)::int FROM "InstagramLead" WHERE "status" IN ('replied', 'interested', 'qualified')) AS warm,
        (SELECT COUNT(*)::int FROM "InstagramMessage" WHERE "status" = 'blocked') AS blocked,
        (SELECT COUNT(*)::int FROM "InstagramMessage" WHERE "direction" = 'out') AS messages
    `);

    return {
      total: Number(row?.total || 0),
      new: Number(row?.new || 0),
      warm: Number(row?.warm || 0),
      blocked: Number(row?.blocked || 0),
      messages: Number(row?.messages || 0),
    };
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

  private async ensureSchema() {
    if (this.schemaReady) return;

    const createTableStatements = [
      `CREATE TABLE IF NOT EXISTS "InstagramLead" (
        "id" TEXT NOT NULL,
        "instagramUserId" TEXT,
        "username" TEXT,
        "fullName" TEXT,
        "profileUrl" TEXT,
        "avatarUrl" TEXT,
        "source" TEXT NOT NULL DEFAULT 'manual',
        "status" TEXT NOT NULL DEFAULT 'new',
        "score" INTEGER NOT NULL DEFAULT 0,
        "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "notes" TEXT,
        "consentStatus" TEXT NOT NULL DEFAULT 'unknown',
        "lastInteractionAt" TIMESTAMP(3),
        "conversationWindowUntil" TIMESTAMP(3),
        "lastMessageAt" TIMESTAMP(3),
        "lastReplyAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InstagramLead_pkey" PRIMARY KEY ("id")
      )`,

      `CREATE TABLE IF NOT EXISTS "InstagramInteraction" (
        "id" TEXT NOT NULL,
        "leadId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "mediaId" TEXT,
        "commentId" TEXT,
        "permalink" TEXT,
        "text" TEXT,
        "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "privateReplyUntil" TIMESTAMP(3),
        "metadata" JSONB,
        CONSTRAINT "InstagramInteraction_pkey" PRIMARY KEY ("id")
      )`,

      `CREATE TABLE IF NOT EXISTS "InstagramMessage" (
        "id" TEXT NOT NULL,
        "leadId" TEXT NOT NULL,
        "direction" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "templateId" TEXT,
        "metaMessageId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'draft',
        "blockedReason" TEXT,
        "sentAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InstagramMessage_pkey" PRIMARY KEY ("id")
      )`,

      `CREATE TABLE IF NOT EXISTS "InstagramTemplate" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'outreach',
        "body" TEXT NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InstagramTemplate_pkey" PRIMARY KEY ("id")
      )`,

      `CREATE TABLE IF NOT EXISTS "InstagramComplianceLog" (
        "id" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "leadId" TEXT,
        "allowed" BOOLEAN NOT NULL,
        "reason" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InstagramComplianceLog_pkey" PRIMARY KEY ("id")
      )`,
    ];

    for (const statement of createTableStatements) {
      await this.prisma.$executeRawUnsafe(statement);
    }

    const statements = [
      'CREATE UNIQUE INDEX IF NOT EXISTS "InstagramLead_instagramUserId_key" ON "InstagramLead"("instagramUserId")',
      'CREATE INDEX IF NOT EXISTS "InstagramLead_status_idx" ON "InstagramLead"("status")',
      'CREATE INDEX IF NOT EXISTS "InstagramLead_source_idx" ON "InstagramLead"("source")',
      'CREATE INDEX IF NOT EXISTS "InstagramLead_username_idx" ON "InstagramLead"("username")',
      'CREATE INDEX IF NOT EXISTS "InstagramLead_lastInteractionAt_idx" ON "InstagramLead"("lastInteractionAt")',
      'CREATE INDEX IF NOT EXISTS "InstagramInteraction_leadId_idx" ON "InstagramInteraction"("leadId")',
      'CREATE INDEX IF NOT EXISTS "InstagramInteraction_type_idx" ON "InstagramInteraction"("type")',
      'CREATE INDEX IF NOT EXISTS "InstagramInteraction_occurredAt_idx" ON "InstagramInteraction"("occurredAt")',
      'CREATE INDEX IF NOT EXISTS "InstagramMessage_leadId_idx" ON "InstagramMessage"("leadId")',
      'CREATE INDEX IF NOT EXISTS "InstagramMessage_status_idx" ON "InstagramMessage"("status")',
      'CREATE INDEX IF NOT EXISTS "InstagramTemplate_active_idx" ON "InstagramTemplate"("active")',
      'CREATE INDEX IF NOT EXISTS "InstagramTemplate_category_idx" ON "InstagramTemplate"("category")',
      'CREATE INDEX IF NOT EXISTS "InstagramComplianceLog_leadId_idx" ON "InstagramComplianceLog"("leadId")',
      'CREATE INDEX IF NOT EXISTS "InstagramComplianceLog_action_idx" ON "InstagramComplianceLog"("action")',
      'CREATE INDEX IF NOT EXISTS "InstagramComplianceLog_createdAt_idx" ON "InstagramComplianceLog"("createdAt")',
    ];

    for (const statement of statements) {
      await this.prisma.$executeRawUnsafe(statement);
    }

    this.schemaReady = true;
  }

  private async logCompliance(action: string, leadId: string | null, allowed: boolean, reason: string, metadata?: any) {
    await this.db.instagramComplianceLog.create({ data: { action, leadId, allowed, reason, metadata } });
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AuthUser = {
  id: string;
  role?: string;
};

const PLAN_MRR: Record<string, number> = {
  FOUNDER_EARLY_ANNUAL: 97 / 12,
  TUTOR_PLUS_SEMESTRAL: 69 / 6,
  TUTOR_PLUS_ANUAL: 129 / 12,
  TUTOR_PLUS_ANNUAL: 129 / 12,
  TUTOR_MASTER_SEMESTRAL: 119.9 / 6,
  TUTOR_MASTER_ANUAL: 199.9 / 12,
  TUTOR_MASTER_ANNUAL: 199.9 / 12,
};

const ARRAY_FIELDS = [
  'revenueLines',
  'kpis',
  'partners',
  'nextMoves',
  'channels',
  'audience',
  'formats',
  'assets',
];

@Injectable()
export class AdminIntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureAdmin(user: AuthUser) {
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito ao administrador.');
    }
  }

  private cleanStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  private cleanNumberArray(value: unknown): number[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  }

  private normalizeVenture(data: any) {
    if (!data?.id || !data?.title) {
      throw new BadRequestException('Venture precisa de id e titulo.');
    }

    return {
      id: String(data.id),
      title: String(data.title),
      subtitle: data.subtitle ? String(data.subtitle) : null,
      stage: data.stage ? String(data.stage) : null,
      pipelineStage: data.pipelineStage ? String(data.pipelineStage) : 'Ideia',
      horizon: data.horizon ? String(data.horizon) : null,
      owner: data.owner ? String(data.owner) : null,
      score: Number(data.score || 0),
      impact: Number(data.impact || 0),
      complexity: Number(data.complexity || 0),
      revenue: data.revenue ? String(data.revenue) : null,
      model: data.model ? String(data.model) : null,
      thesis: data.thesis ? String(data.thesis) : null,
      risk: data.risk ? String(data.risk) : null,
      revenueLines: this.cleanStringArray(data.revenueLines),
      kpis: this.cleanStringArray(data.kpis),
      partners: this.cleanStringArray(data.partners),
      nextMoves: this.cleanStringArray(data.nextMoves),
      doneMoves: this.cleanNumberArray(data.doneMoves),
      note: data.note ? String(data.note) : null,
      metadata: data.metadata || undefined,
    };
  }

  private normalizeCampaign(data: any) {
    if (!data?.id || !data?.name || !data?.type) {
      throw new BadRequestException('Campanha precisa de id, nome e tipo.');
    }

    return {
      id: String(data.id),
      name: String(data.name),
      type: String(data.type),
      status: data.status ? String(data.status) : 'Briefing',
      channels: this.cleanStringArray(data.channels),
      objective: data.objective ? String(data.objective) : null,
      audience: this.cleanStringArray(data.audience),
      budget: data.budget ? String(data.budget) : null,
      deadline: data.deadline ? String(data.deadline) : null,
      formats: this.cleanStringArray(data.formats),
      hook: data.hook ? String(data.hook) : null,
      headline: data.headline ? String(data.headline) : null,
      cta: data.cta ? String(data.cta) : null,
      caption: data.caption ? String(data.caption) : null,
      assets: this.cleanStringArray(data.assets),
      notes: data.notes ? String(data.notes) : null,
      results: data.results ? String(data.results) : null,
      owner: data.owner ? String(data.owner) : null,
      kpis: this.cleanStringArray(data.kpis),
      metadata: data.metadata || undefined,
    };
  }

  async listVentures(user: AuthUser) {
    this.ensureAdmin(user);
    return this.prisma.adminVenture.findMany({
      orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async upsertVentures(user: AuthUser, items: any[]) {
    this.ensureAdmin(user);
    if (!Array.isArray(items)) {
      throw new BadRequestException('Envie uma lista de ventures.');
    }

    const results = [];
    for (const item of items) {
      const data = this.normalizeVenture(item);
      results.push(
        await this.prisma.adminVenture.upsert({
          where: { id: data.id },
          create: data,
          update: data,
        }),
      );
    }

    return results;
  }

  async updateVenture(user: AuthUser, id: string, data: any) {
    this.ensureAdmin(user);

    const existing = await this.prisma.adminVenture.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Oportunidade nao encontrada.');
    }

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data || {})) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      if (ARRAY_FIELDS.includes(key)) clean[key] = this.cleanStringArray(value);
      else if (key === 'doneMoves') clean[key] = this.cleanNumberArray(value);
      else if (['score', 'impact', 'complexity'].includes(key)) clean[key] = Number(value || 0);
      else clean[key] = value === '' ? null : value;
    }

    return this.prisma.adminVenture.update({
      where: { id },
      data: clean,
    });
  }

  async listCampaigns(user: AuthUser) {
    this.ensureAdmin(user);
    return this.prisma.adminCampaign.findMany({
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async upsertCampaigns(user: AuthUser, items: any[]) {
    this.ensureAdmin(user);
    if (!Array.isArray(items)) {
      throw new BadRequestException('Envie uma lista de campanhas.');
    }

    const results = [];
    for (const item of items) {
      const data = this.normalizeCampaign(item);
      results.push(
        await this.prisma.adminCampaign.upsert({
          where: { id: data.id },
          create: data,
          update: data,
        }),
      );
    }

    return results;
  }

  async updateCampaign(user: AuthUser, id: string, data: any) {
    this.ensureAdmin(user);

    const existing = await this.prisma.adminCampaign.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Campanha nao encontrada.');
    }

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data || {})) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      if (ARRAY_FIELDS.includes(key) || key === 'kpis') clean[key] = this.cleanStringArray(value);
      else clean[key] = value === '' ? null : value;
    }

    return this.prisma.adminCampaign.update({
      where: { id },
      data: clean,
    });
  }

  private trend(current: number, previous: number) {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'flat';
  }

  private pctDelta(current: number, previous: number) {
    if (!previous && current) return '+100%';
    if (!previous) return '0%';
    const pct = ((current - previous) / previous) * 100;
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1).replace('.', ',')}%`;
  }

  private async countRows(query: string, ...params: any[]) {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ count: bigint | number | string }>>(
      query,
      ...params,
    );
    return Number(rows?.[0]?.count || 0);
  }

  async getOpsMetrics(user: AuthUser) {
    this.ensureAdmin(user);

    const now = new Date();
    const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const start30 = daysAgo(30);
    const prevStart30 = daysAgo(60);
    const start7 = daysAgo(7);
    const prevStart7 = daysAgo(14);

    const [
      usersTotal,
      users30,
      usersPrev30,
      petsTotal,
      pets30,
      petsPrev30,
      activeCats,
      memorialCats,
      studioWeek,
      studioPrevWeek,
      studioSharedWeek,
      activeSubscriptions,
      vetPartners,
      vetActive,
      prospects,
      prospectsReplied,
      founders,
      purchases,
      pointsBought,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: start30 } } }),
      this.prisma.user.count({ where: { createdAt: { gte: prevStart30, lt: start30 } } }),
      this.prisma.pet.count(),
      this.prisma.pet.count({ where: { createdAt: { gte: start30 } } }),
      this.prisma.pet.count({ where: { createdAt: { gte: prevStart30, lt: start30 } } }),
      this.prisma.pet.count({ where: { isArchived: false, isMemorial: false } }),
      this.prisma.pet.count({ where: { isMemorial: true } }),
      this.prisma.studioCreation.count({ where: { createdAt: { gte: start7 } } }),
      this.prisma.studioCreation.count({ where: { createdAt: { gte: prevStart7, lt: start7 } } }),
      this.prisma.studioCreation.count({ where: { publishedAt: { gte: start7 } } }),
      this.prisma.subscription.count({
        where: {
          status: { in: ['ACTIVE', 'active', 'PAID', 'paid'] },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      this.prisma.vetPartner.count(),
      this.prisma.vetPartner.count({ where: { status: 'ACTIVE' } }),
      this.prisma.prospect.count().catch(() => 0),
      this.prisma.prospect.count({ where: { repliedAt: { not: null } } }).catch(() => 0),
      this.prisma.founderInvite.count().catch(() => 0),
      this.countRows(`SELECT COUNT(*)::int AS count FROM "PurchaseInvite"`).catch(() => 0),
      this.prisma.userCredits.aggregate({ _sum: { totalBought: true } }).catch(() => ({ _sum: { totalBought: 0 } })),
    ]);

    const mau = await this.countRows(
      `
      SELECT COUNT(DISTINCT "userId")::int AS count
      FROM (
        SELECT "userId" FROM "RewardEvent" WHERE "createdAt" >= $1
        UNION
        SELECT "userId" FROM "StudioCreation" WHERE "createdAt" >= $1
        UNION
        SELECT "userId" FROM "Post" WHERE "createdAt" >= $1
        UNION
        SELECT "userId" FROM "notice_reads" WHERE "readAt" >= $1
      ) activity
      `,
      start30,
    ).catch(() => 0);

    const mauPrev = await this.countRows(
      `
      SELECT COUNT(DISTINCT "userId")::int AS count
      FROM (
        SELECT "userId" FROM "RewardEvent" WHERE "createdAt" >= $1 AND "createdAt" < $2
        UNION
        SELECT "userId" FROM "StudioCreation" WHERE "createdAt" >= $1 AND "createdAt" < $2
        UNION
        SELECT "userId" FROM "Post" WHERE "createdAt" >= $1 AND "createdAt" < $2
        UNION
        SELECT "userId" FROM "notice_reads" WHERE "readAt" >= $1 AND "readAt" < $2
      ) activity
      `,
      prevStart30,
      start30,
    ).catch(() => 0);

    const cohortUsers = await this.countRows(
      `SELECT COUNT(*)::int AS count FROM "User" WHERE "createdAt" >= $1 AND "createdAt" < $2`,
      prevStart30,
      start30,
    ).catch(() => 0);

    const retainedUsers = await this.countRows(
      `
      SELECT COUNT(DISTINCT u.id)::int AS count
      FROM "User" u
      JOIN (
        SELECT "userId" FROM "RewardEvent" WHERE "createdAt" >= $2
        UNION
        SELECT "userId" FROM "StudioCreation" WHERE "createdAt" >= $2
        UNION
        SELECT "userId" FROM "Post" WHERE "createdAt" >= $2
        UNION
        SELECT "userId" FROM "notice_reads" WHERE "readAt" >= $2
      ) activity ON activity."userId" = u.id
      WHERE u."createdAt" >= $1 AND u."createdAt" < $2
      `,
      prevStart30,
      start30,
    ).catch(() => 0);

    const d30Retention = cohortUsers > 0 ? Number(((retainedUsers / cohortUsers) * 100).toFixed(1)) : 0;

    const subscriptions = (await this.prisma.subscription
      .findMany({
        where: {
          status: { in: ['ACTIVE', 'active', 'PAID', 'paid'] },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { planType: true },
      })
      .catch(() => [])) as Array<{ planType: string | null }>;

    let mrrRaw = 0;
    for (const item of subscriptions) {
      mrrRaw += PLAN_MRR[String(item.planType || '').toUpperCase()] || 0;
    }
    const mrr = Number(mrrRaw.toFixed(2));

    const metrics = {
      catsRegistered: {
        current: petsTotal,
        previous: Math.max(0, petsTotal - pets30 + petsPrev30),
        delta: `+${pets30.toLocaleString('pt-BR')} em 30d`,
        trend: this.trend(pets30, petsPrev30),
      },
      mau: {
        current: mau,
        previous: mauPrev,
        delta: `${this.pctDelta(mau, mauPrev)} vs 30d ant.`,
        trend: this.trend(mau, mauPrev),
      },
      d30Retention: {
        current: d30Retention,
        previous: 0,
        delta: `${retainedUsers}/${cohortUsers} retidos`,
        trend: 'flat',
      },
      mrr: {
        current: mrr,
        previous: 0,
        delta: `${activeSubscriptions} assinaturas ativas`,
        trend: activeSubscriptions > 0 ? 'up' : 'flat',
      },
      vetClinics: {
        current: vetActive || vetPartners,
        previous: 0,
        delta: `${vetPartners} cadastradas`,
        trend: vetActive || vetPartners ? 'up' : 'flat',
      },
      studioOutputsWeek: {
        current: studioWeek,
        previous: studioPrevWeek,
        delta: `${this.pctDelta(studioWeek, studioPrevWeek)} vs sem. ant.`,
        trend: this.trend(studioWeek, studioPrevWeek),
      },
      viralCoefficient: {
        current: studioWeek > 0 ? Number((studioSharedWeek / studioWeek).toFixed(2)) : 0,
        previous: 0,
        delta: `${studioSharedWeek} outputs publicados`,
        trend: studioSharedWeek > 0 ? 'up' : 'flat',
      },
      prospects: {
        current: prospects,
        previous: 0,
        delta: `${prospectsReplied} com resposta`,
        trend: prospects > 0 ? 'up' : 'flat',
      },
    };

    return {
      generatedAt: now.toISOString(),
      source: 'database',
      metrics,
      monetization: {
        kiwifyWebhookUrl: '/api/kiwify/webhook',
        kiwifySignatureConfigured: Boolean(process.env.KIWIFY_TOKEN),
        appUrlConfigured: Boolean(process.env.APP_URL),
        founderInvites: founders,
        purchaseInvites: purchases,
        activeSubscriptions,
        mrr,
        pointsBought: Number((pointsBought as any)?._sum?.totalBought || 0),
      },
      inventory: {
        usersTotal,
        usersNew30d: users30,
        activeCats,
        memorialCats,
        petsTotal,
      },
    };
  }
}

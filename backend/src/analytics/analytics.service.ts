import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const WEIGHT_CHECKIN_RE = /check-in de peso/i;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Cadastros por dia e origem (parâmetro ?src= na URL de cadastro)
  async signupsByDayAndSource(days = 60) {
    const since = new Date(Date.now() - days * 86400000);
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, signupSource: true },
    });

    const map = new Map<string, Map<string, number>>();
    for (const u of users) {
      const date = u.createdAt.toISOString().slice(0, 10);
      const source = u.signupSource || 'organic';
      if (!map.has(date)) map.set(date, new Map());
      const sourceMap = map.get(date)!;
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    }

    const rows: { date: string; source: string; count: number }[] = [];
    for (const [date, sourceMap] of map) {
      for (const [source, count] of sourceMap) rows.push({ date, source, count });
    }
    return rows.sort((a, b) => a.date.localeCompare(b.date) || b.count - a.count);
  }

  // 2. Ativação: cadastrou o primeiro gato (sim/não, quanto tempo depois)
  async activation() {
    const users = await this.prisma.user.findMany({ select: { id: true, createdAt: true } });
    const firstPets = await this.prisma.pet.groupBy({ by: ['ownerId'], _min: { createdAt: true } });
    const firstPetMap = new Map(firstPets.map((p) => [p.ownerId, p._min.createdAt]));

    let activated = 0;
    let totalHours = 0;

    for (const u of users) {
      const firstPetAt = firstPetMap.get(u.id) || null;
      if (firstPetAt) {
        activated += 1;
        totalHours += (firstPetAt.getTime() - u.createdAt.getTime()) / 3600000;
      }
    }

    return {
      totalUsers: users.length,
      activated,
      notActivated: users.length - activated,
      activationRatePercent: users.length ? Math.round((activated / users.length) * 1000) / 10 : 0,
      avgHoursToActivate: activated ? Math.round((totalHours / activated) * 10) / 10 : null,
    };
  }

  /**
   * 3. Retenção D7/D30 por coorte (semana de cadastro).
   * Definição simples e sem tabela extra de eventos: um usuário conta como
   * "retido em D7" se o último login registrado aconteceu 7+ dias após o
   * cadastro (idem D30 com 30+ dias). Só entra no denominador quem já tem
   * idade de conta suficiente pra ser elegível.
   */
  async retention() {
    const users = await this.prisma.user.findMany({
      select: { createdAt: true, lastLoginAt: true },
    });
    const now = Date.now();

    const cohortWeekStart = (date: Date) => {
      const d = new Date(date);
      const day = d.getUTCDay();
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
      return start.toISOString().slice(0, 10);
    };

    const cohorts = new Map<
      string,
      { total: number; eligibleD7: number; retainedD7: number; eligibleD30: number; retainedD30: number }
    >();

    for (const u of users) {
      const key = cohortWeekStart(u.createdAt);
      if (!cohorts.has(key)) {
        cohorts.set(key, { total: 0, eligibleD7: 0, retainedD7: 0, eligibleD30: 0, retainedD30: 0 });
      }
      const c = cohorts.get(key)!;
      c.total += 1;

      const ageDays = (now - u.createdAt.getTime()) / 86400000;
      const lastLoginDays = u.lastLoginAt ? (u.lastLoginAt.getTime() - u.createdAt.getTime()) / 86400000 : null;

      if (ageDays >= 7) {
        c.eligibleD7 += 1;
        if (lastLoginDays !== null && lastLoginDays >= 7) c.retainedD7 += 1;
      }
      if (ageDays >= 30) {
        c.eligibleD30 += 1;
        if (lastLoginDays !== null && lastLoginDays >= 30) c.retainedD30 += 1;
      }
    }

    return Array.from(cohorts.entries())
      .map(([week, c]) => ({
        cohortWeekStart: week,
        totalUsers: c.total,
        d7Eligible: c.eligibleD7,
        d7RetentionPercent: c.eligibleD7 ? Math.round((c.retainedD7 / c.eligibleD7) * 1000) / 10 : null,
        d30Eligible: c.eligibleD30,
        d30RetentionPercent: c.eligibleD30 ? Math.round((c.retainedD30 / c.eligibleD30) * 1000) / 10 : null,
      }))
      .sort((a, b) => a.cohortWeekStart.localeCompare(b.cohortWeekStart));
  }

  // 4. Número de registros por tipo e por usuário (peso, vacina, consulta, diário...)
  async recordsByUserAndType() {
    const [users, healthRecords, pets, diaryCounts] = await Promise.all([
      this.prisma.user.findMany({ select: { id: true, name: true, email: true } }),
      this.prisma.healthRecord.findMany({
        select: { type: true, title: true, pet: { select: { ownerId: true } } },
      }),
      this.prisma.pet.findMany({ select: { id: true, ownerId: true } }),
      this.prisma.diaryEntry.groupBy({ by: ['petId'], _count: { _all: true } }),
    ]);

    const petOwnerMap = new Map(pets.map((p) => [p.id, p.ownerId]));
    const perUser = new Map<string, any>();

    const ensure = (userId: string) => {
      if (!perUser.has(userId)) {
        perUser.set(userId, {
          userId,
          peso: 0,
          vacina: 0,
          vermifugo: 0,
          antipulgas: 0,
          medicacao: 0,
          consulta: 0,
          cirurgia: 0,
          exame: 0,
          diario: 0,
        });
      }
      return perUser.get(userId);
    };

    for (const hr of healthRecords) {
      const ownerId = hr.pet?.ownerId;
      if (!ownerId) continue;
      const row = ensure(ownerId);

      if (hr.type === 'EXAM' && WEIGHT_CHECKIN_RE.test(hr.title || '')) row.peso += 1;
      else if (hr.type === 'VACCINE') row.vacina += 1;
      else if (hr.type === 'VERMIFUGE') row.vermifugo += 1;
      else if (hr.type === 'PARASITE') row.antipulgas += 1;
      else if (hr.type === 'MEDICATION' || hr.type === 'MEDICINE') row.medicacao += 1;
      else if (hr.type === 'CONSULTATION' || hr.type === 'IACONSULT') row.consulta += 1;
      else if (hr.type === 'SURGERY') row.cirurgia += 1;
      else if (hr.type === 'EXAM') row.exame += 1;
    }

    for (const d of diaryCounts) {
      const ownerId = petOwnerMap.get(d.petId);
      if (!ownerId) continue;
      ensure(ownerId).diario += d._count._all;
    }

    const userMap = new Map(users.map((u) => [u.id, u]));

    return Array.from(perUser.values())
      .map((row) => ({
        ...row,
        name: userMap.get(row.userId)?.name || '—',
        email: userMap.get(row.userId)?.email || '—',
        total:
          row.peso + row.vacina + row.vermifugo + row.antipulgas + row.medicacao + row.consulta + row.cirurgia + row.exame + row.diario,
      }))
      .sort((a, b) => b.total - a.total);
  }

  // 5. Perguntas ao iGentVet por usuário e custo estimado
  async igentUsageByUser() {
    const grouped = await this.prisma.igentUsageLog.groupBy({
      by: ['userId'],
      _count: { _all: true },
      _sum: { costEstimate: true, tokensUsed: true },
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return grouped
      .map((g) => ({
        userId: g.userId,
        name: userMap.get(g.userId)?.name || '—',
        email: userMap.get(g.userId)?.email || '—',
        questions: g._count._all,
        totalTokens: g._sum.tokensUsed || 0,
        estimatedCostUsd: Math.round((g._sum.costEstimate || 0) * 10000) / 10000,
      }))
      .sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd)
      .slice(0, 10);
  }

  // 7. Gasto do mês com IA, custo médio por pergunta e % do teto global.
  async aiBudget() {
    const budget = Number(process.env.AI_MONTHLY_BUDGET || '0');
    const start = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));

    const [spendAgg, countAgg] = await Promise.all([
      this.prisma.igentUsageLog.aggregate({ where: { createdAt: { gte: start } }, _sum: { costEstimate: true } }),
      this.prisma.igentUsageLog.count({ where: { createdAt: { gte: start } } }),
    ]);

    const spend = spendAgg._sum.costEstimate || 0;
    const questions = countAgg;
    const avgCostPerQuestion = questions ? spend / questions : 0;

    return {
      spend: Math.round(spend * 10000) / 10000,
      budget,
      ratioPercent: budget ? Math.round((spend / budget) * 1000) / 10 : null,
      questions,
      avgCostPerQuestion: Math.round(avgCostPerQuestion * 10000) / 10000,
    };
  }

  // 6. Conversão por produto — protocolos (inscritos → concluídos → resolvidos)
  async protocolConversion() {
    const protocols = await this.prisma.protocol.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        enrollments: { select: { status: true, resolved: true } },
      },
    });

    return protocols.map((p) => {
      const enrolled = p.enrollments.length;
      const completed = p.enrollments.filter((e) => e.status === 'CONCLUIDO').length;
      const resolved = p.enrollments.filter((e) => e.resolved === true).length;

      return {
        protocolId: p.id,
        title: p.title,
        slug: p.slug,
        enrolled,
        completed,
        resolved,
        completionRatePercent: enrolled ? Math.round((completed / enrolled) * 1000) / 10 : 0,
        resolvedRatePercent: completed ? Math.round((resolved / completed) * 1000) / 10 : 0,
      };
    });
  }

  /**
   * Visão geral do admin: tudo que a tela inicial precisa numa chamada só,
   * calculado no banco (counts/groupBy) em vez de baixar listas inteiras.
   */
  async overview() {
    const DAY = 86400000;
    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * DAY);
    const d14 = new Date(now.getTime() - 14 * DAY);
    const d30 = new Date(now.getTime() - 30 * DAY);
    const d60 = new Date(now.getTime() - 60 * DAY);

    const [
      totalUsers, usersThisWeek, usersPrevWeek,
      totalPets, petsThisWeek, petsPrevWeek,
      appOpens7d, logins7d,
      newUsers30d, signups30d,
      cohortUsers, appOpensMax,
      healthRecords7d, diary7d, igent7d, igentUrgent7d, reports7d,
      feedbackNew, ongPending, ongSuggestionsNew, guideDrafts, activeNotices,
      recentUsers, recentPets, recentSessions,
      aiBudget,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: d7 } } }),
      this.prisma.user.count({ where: { createdAt: { gte: d14, lt: d7 } } }),
      this.prisma.pet.count({ where: { isMemorial: false, isArchived: false } }),
      this.prisma.pet.count({ where: { createdAt: { gte: d7 } } }),
      this.prisma.pet.count({ where: { createdAt: { gte: d14, lt: d7 } } }),
      this.prisma.event.groupBy({ by: ['userId'], where: { name: 'app_open', createdAt: { gte: d7 }, userId: { not: null } } }),
      this.prisma.user.findMany({ where: { lastLoginAt: { gte: d7 } }, select: { id: true } }),
      this.prisma.user.findMany({ where: { createdAt: { gte: d30 } }, select: { id: true } }),
      this.prisma.user.findMany({ where: { createdAt: { gte: d30 } }, select: { createdAt: true } }),
      this.prisma.user.findMany({ where: { createdAt: { gte: d60, lt: d7 } }, select: { id: true, createdAt: true, lastLoginAt: true } }),
      this.prisma.event.groupBy({ by: ['userId'], where: { name: 'app_open', createdAt: { gte: d60 }, userId: { not: null } }, _max: { createdAt: true } }),
      this.prisma.healthRecord.count({ where: { date: { gte: d7, lte: now } } }),
      this.prisma.diaryEntry.count({ where: { date: { gte: d7, lte: now } } }),
      this.prisma.igentSession.count({ where: { createdAt: { gte: d7 } } }),
      this.prisma.igentSession.count({ where: { createdAt: { gte: d7 }, isUrgent: true } }),
      this.prisma.document.count({ where: { category: 'LAUDOS_IA', createdAt: { gte: d7 } } }),
      this.prisma.feedbackMessage.count({ where: { status: 'NOVO' } }),
      this.prisma.ongProfile.count({ where: { status: 'PENDING' } }),
      this.prisma.ongSuggestion.count({ where: { status: 'NEW' } }),
      this.prisma.guideEntry.count({ where: { status: 'DRAFT' } }),
      this.prisma.notice.count({ where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } }),
      this.prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, name: true, createdAt: true, signupSource: true } }),
      this.prisma.pet.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, name: true, createdAt: true, owner: { select: { name: true } } } }),
      this.prisma.igentSession.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, symptomLabel: true, isUrgent: true, createdAt: true, pet: { select: { name: true } } } }),
      this.aiBudget(),
    ]);

    // Ativos em 7 dias: abriu o app (evento) ou fez login.
    const active = new Set<string>([
      ...appOpens7d.map((e) => e.userId as string),
      ...logins7d.map((u) => u.id),
    ]);

    // Ativação dos cadastros dos últimos 30 dias.
    const newIds = newUsers30d.map((u) => u.id);
    const [withPet, withRecord] = newIds.length
      ? await Promise.all([
          this.prisma.pet.groupBy({ by: ['ownerId'], where: { ownerId: { in: newIds } } }),
          this.prisma.pet.findMany({
            where: {
              ownerId: { in: newIds },
              OR: [{ healthRecords: { some: {} } }, { diaryEntries: { some: {} } }],
            },
            select: { ownerId: true },
            distinct: ['ownerId'],
          }),
        ])
      : [[], []];
    const pct = (part: number, total: number) => (total ? Math.round((part / total) * 1000) / 10 : null);

    // Retenção semana 1: de quem tem 7+ dias de conta (até 60), quantos
    // voltaram a abrir o app 7 dias ou mais depois do cadastro.
    const lastOpen = new Map(appOpensMax.map((e) => [e.userId as string, e._max.createdAt]));
    let retained = 0;
    for (const u of cohortUsers) {
      const limit = u.createdAt.getTime() + 7 * DAY;
      const open = lastOpen.get(u.id);
      if ((open && open.getTime() >= limit) || (u.lastLoginAt && u.lastLoginAt.getTime() >= limit)) retained += 1;
    }

    // Cadastros por dia (30 dias, com zeros), no fuso de Brasília.
    const dayKey = (d: Date) => new Date(d.getTime() - 3 * 3600000).toISOString().slice(0, 10);
    const perDay = new Map<string, number>();
    for (let i = 29; i >= 0; i--) perDay.set(dayKey(new Date(now.getTime() - i * DAY)), 0);
    for (const u of signups30d) {
      const k = dayKey(u.createdAt);
      if (perDay.has(k)) perDay.set(k, (perDay.get(k) || 0) + 1);
    }

    const activity = [
      ...recentUsers.map((u) => ({
        type: 'user', at: u.createdAt,
        text: `${u.name || 'Novo tutor'} se cadastrou${u.signupSource ? ` · via ${u.signupSource}` : ''}`,
      })),
      ...recentPets.map((p) => ({
        type: 'pet', at: p.createdAt,
        text: `${p.name} foi cadastrado${p.owner?.name ? ` por ${p.owner.name}` : ''}`,
      })),
      ...recentSessions.map((s) => ({
        type: s.isUrgent ? 'igent_urgent' : 'igent', at: s.createdAt,
        text: `iGentVet: ${s.symptomLabel}${s.pet?.name ? ` · ${s.pet.name}` : ''}${s.isUrgent ? ' · urgente' : ''}`,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 10);

    return {
      generatedAt: now,
      kpis: {
        users: { total: totalUsers, thisWeek: usersThisWeek, prevWeek: usersPrevWeek },
        pets: { total: totalPets, thisWeek: petsThisWeek, prevWeek: petsPrevWeek },
        active7d: active.size,
        activation: {
          newUsers30d: newIds.length,
          withPetPercent: pct(withPet.length, newIds.length),
          withRecordPercent: pct(withRecord.length, newIds.length),
        },
        retentionW1: { eligible: cohortUsers.length, retained, percent: pct(retained, cohortUsers.length) },
      },
      signups30d: [...perDay.entries()].map(([date, count]) => ({ date, count })),
      product: {
        healthRecords7d,
        diary7d,
        igent7d,
        igentUrgent7d,
        reports7d,
        aiBudget,
      },
      pending: {
        feedbackNew,
        ongPending,
        ongSuggestionsNew,
        guideDrafts,
        activeNotices,
      },
      activity,
    };
  }
}

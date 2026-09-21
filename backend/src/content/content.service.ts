import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getUserEntitlements } from '../membership/membership.constants';

const DAY_GAP_MS = 24 * 60 * 60 * 1000; // "o próximo abre no dia seguinte"

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── GUIA (livre, sem trava, sem XP) ────────────────────────────────────

  async listGuideThemes() {
    const rows = await this.prisma.guideEntry.findMany({
      where: { status: 'PUBLISHED' },
      select: { theme: true },
      distinct: ['theme'],
      orderBy: { theme: 'asc' },
    });
    return rows.map((r) => r.theme);
  }

  // Índice da Biblioteca: as categorias com nome, descrição e contagem de verbetes.
  async listGuideCategories() {
    const categories = await this.prisma.guideCategory.findMany({
      orderBy: { nome: 'asc' },
      include: { _count: { select: { entries: { where: { status: 'PUBLISHED' } } } } },
    });

    return categories.map((c) => ({
      id: c.id,
      nome: c.nome,
      descricao: c.descricao,
      count: c._count.entries,
    }));
  }

  async listGuideEntries(params: { categoryId?: string; theme?: string; q?: string }) {
    const where: any = { status: 'PUBLISHED' };
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.theme) where.theme = params.theme;
    if (params.q?.trim()) {
      const q = params.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } },
        { tags: { has: q.toLowerCase() } },
      ];
    }
    return this.prisma.guideEntry.findMany({
      where,
      orderBy: { title: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        theme: true,
        excerpt: true,
        tags: true,
        urgency: true,
        category: { select: { id: true, nome: true } },
      },
    });
  }

  async getGuideEntry(slug: string) {
    const entry = await this.prisma.guideEntry.findUnique({
      where: { slug },
      include: { category: { select: { id: true, nome: true } } },
    });
    if (!entry || entry.status !== 'PUBLISHED') {
      throw new NotFoundException('Verbete não encontrado.');
    }

    const relatedEntries = entry.vejaTambem.length
      ? await this.prisma.guideEntry.findMany({
          where: { slug: { in: entry.vejaTambem }, status: 'PUBLISHED' },
          select: { slug: true, title: true, urgency: true },
        })
      : [];

    const globalNotice = await this.getGuideGlobalNotice();

    return { ...entry, relatedEntries, globalNotice };
  }

  async getGuideGlobalNotice(): Promise<string | null> {
    const setting = await this.prisma.appSettings.findUnique({ where: { key: 'almanaque_aviso_global' } });
    return setting?.value || null;
  }

  // ─── PROTOCOLO (requer entitlement) ─────────────────────────────────────

  private async getEntitlements(userId?: string) {
    if (!userId) return getUserEntitlements(null);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, badges: true, role: true },
    });
    return getUserEntitlements(user || {});
  }

  private async isProtocolLocked(
    protocol: { entitlementProductId: string | null; requiresFounder: boolean },
    userId?: string,
  ) {
    if (protocol.entitlementProductId) {
      if (!userId) return true;
      const found = await this.prisma.productEntitlement.findUnique({
        where: { userId_productId: { userId, productId: protocol.entitlementProductId } },
      });
      return !found;
    }
    const entitlements = await this.getEntitlements(userId);
    return protocol.requiresFounder && !entitlements.canAccessProtocols;
  }

  async listProtocols(userId?: string) {
    const protocols = await this.prisma.protocol.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { title: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        totalDays: true,
        requiresFounder: true,
        entitlementProductId: true,
        spec: true,
      },
    });

    return Promise.all(
      protocols.map(async (p) => ({
        ...p,
        isRich: p.spec != null,
        spec: undefined, // não manda o spec inteiro na listagem
        locked: await this.isProtocolLocked(p, userId),
      })),
    );
  }

  async getProtocol(slug: string, userId?: string) {
    const protocol = await this.prisma.protocol.findUnique({
      where: { slug },
      include: { steps: { orderBy: { dayNumber: 'asc' } } },
    });
    if (!protocol || protocol.status !== 'PUBLISHED') {
      throw new NotFoundException('Protocolo não encontrado.');
    }

    const locked = await this.isProtocolLocked(protocol, userId);
    const isRich = protocol.spec != null;
    const specAny: any = protocol.spec;

    return {
      ...protocol,
      isRich,
      spec: locked ? null : protocol.spec,
      // Prévia segura pra tela de apresentação mesmo trancado (promessa, preço, duração).
      preview: isRich
        ? {
            titulo: specAny.titulo,
            subtitulo: specAny.subtitulo,
            promessa: specAny.promessa,
            duracao_dias: specAny.duracao_dias,
            preco_centavos: specAny.preco_centavos,
            produto_externo_id: specAny.produto_externo_id,
          }
        : null,
      locked,
    };
  }

  async enroll(slug: string, userId: string, petId: string) {
    if (!userId || !petId) {
      throw new BadRequestException('userId e petId são obrigatórios.');
    }

    const protocol = await this.prisma.protocol.findUnique({ where: { slug } });
    if (!protocol || protocol.status !== 'PUBLISHED') {
      throw new NotFoundException('Protocolo não encontrado.');
    }

    const entitlements = await this.getEntitlements(userId);
    if (protocol.requiresFounder && !entitlements.canAccessProtocols) {
      throw new ForbiddenException('Este protocolo exige o selo founder/pro.');
    }

    const pet = await this.prisma.pet.findUnique({ where: { id: petId }, select: { ownerId: true } });
    if (!pet || pet.ownerId !== userId) {
      throw new BadRequestException('Gato não encontrado ou não pertence a este tutor.');
    }

    const existing = await this.prisma.protocolEnrollment.findFirst({
      where: { protocolId: protocol.id, petId, status: 'EM_ANDAMENTO' },
    });
    if (existing) return this.getEnrollment(existing.id);

    const enrollment = await this.prisma.protocolEnrollment.create({
      data: {
        protocolId: protocol.id,
        userId,
        petId,
        currentDay: 0,
        logs: {
          create: { dayNumber: 0, unlockedAt: new Date() },
        },
      },
    });

    return this.getEnrollment(enrollment.id);
  }

  async getEnrollment(id: string) {
    const enrollment = await this.prisma.protocolEnrollment.findUnique({
      where: { id },
      include: {
        protocol: { include: { steps: { orderBy: { dayNumber: 'asc' } } } },
        logs: { orderBy: { dayNumber: 'asc' } },
        pet: { select: { id: true, name: true, photoUrl: true } },
      },
    });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada.');

    const currentLog = enrollment.logs.find((l) => l.dayNumber === enrollment.currentDay) || null;
    const currentStep = enrollment.protocol.steps.find((s) => s.dayNumber === enrollment.currentDay) || null;
    const closingStep = enrollment.protocol.steps.find((s) => s.kind === 'CLOSING') || null;
    const triageLog = enrollment.logs.find((l) => l.dayNumber === 0) || null;
    const closingLog = closingStep ? enrollment.logs.find((l) => l.dayNumber === closingStep.dayNumber) : null;

    const now = Date.now();
    const currentUnlocked = currentLog ? new Date(currentLog.unlockedAt).getTime() <= now : false;

    return {
      ...enrollment,
      currentStep,
      currentLog,
      currentUnlocked,
      comparison:
        triageLog?.severityScore != null && closingLog?.severityScore != null
          ? {
              before: triageLog.severityScore,
              after: closingLog.severityScore,
              deltaPercent: Math.round(
                ((closingLog.severityScore - triageLog.severityScore) / triageLog.severityScore) * 100,
              ),
            }
          : null,
    };
  }

  async listMyEnrollments(userId: string, petId?: string) {
    return this.prisma.protocolEnrollment.findMany({
      where: { userId, ...(petId ? { petId } : {}) },
      include: {
        protocol: { select: { title: true, slug: true, totalDays: true } },
        // Seleção enxuta — só o suficiente pra saber se o dia atual já abriu
        // (usado pelo "O que precisa de você hoje" da Home).
        logs: { select: { dayNumber: true, unlockedAt: true, completedAt: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async completeDay(enrollmentId: string, body: { note?: string; severityScore?: number; resolved?: boolean }) {
    const enrollment = await this.prisma.protocolEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { protocol: { include: { steps: { orderBy: { dayNumber: 'asc' } } } }, logs: true },
    });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada.');
    if (enrollment.status !== 'EM_ANDAMENTO') {
      throw new BadRequestException('Este protocolo já foi encerrado.');
    }

    const currentLog = enrollment.logs.find((l) => l.dayNumber === enrollment.currentDay);
    if (!currentLog) throw new NotFoundException('Dia atual não encontrado.');
    if (new Date(currentLog.unlockedAt).getTime() > Date.now()) {
      throw new BadRequestException('Este dia ainda não abriu.');
    }
    if (currentLog.completedAt) {
      throw new BadRequestException('Este dia já foi marcado como feito.');
    }

    await this.prisma.protocolDayLog.update({
      where: { id: currentLog.id },
      data: {
        completedAt: new Date(),
        note: body.note ?? null,
        severityScore: body.severityScore ?? null,
      },
    });

    const steps = enrollment.protocol.steps;
    const currentStepIndex = steps.findIndex((s) => s.dayNumber === enrollment.currentDay);
    const nextStep = steps[currentStepIndex + 1] || null;

    if (!nextStep) {
      // Era o fechamento — encerra a inscrição.
      await this.prisma.protocolEnrollment.update({
        where: { id: enrollmentId },
        data: { status: 'CONCLUIDO', completedAt: new Date(), resolved: body.resolved ?? null },
      });
      return this.getEnrollment(enrollmentId);
    }

    await this.prisma.protocolDayLog.create({
      data: {
        enrollmentId,
        dayNumber: nextStep.dayNumber,
        unlockedAt: new Date(Date.now() + DAY_GAP_MS),
      },
    });

    await this.prisma.protocolEnrollment.update({
      where: { id: enrollmentId },
      data: { currentDay: nextStep.dayNumber },
    });

    return this.getEnrollment(enrollmentId);
  }

  async advanceDay(enrollmentId: string) {
    const enrollment = await this.prisma.protocolEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { logs: true },
    });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada.');

    const currentLog = enrollment.logs.find((l) => l.dayNumber === enrollment.currentDay);
    if (!currentLog) throw new NotFoundException('Dia atual não encontrado.');

    await this.prisma.protocolDayLog.update({
      where: { id: currentLog.id },
      data: { unlockedAt: new Date(), advancedEarly: true },
    });

    return this.getEnrollment(enrollmentId);
  }
}

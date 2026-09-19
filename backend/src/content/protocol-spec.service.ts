import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationIntegration } from '../gamification/gamification.integration';
import { evaluateCondition } from './condition-eval';

function startOfNextCalendarDayUTC(from: Date): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + 1));
}

@Injectable()
export class ProtocolSpecService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamif: GamificationIntegration,
  ) {}

  // ─── Acesso ──────────────────────────────────────────────────────────────

  private async hasProductEntitlement(userId: string | undefined, productId: string): Promise<boolean> {
    if (!userId) return false;
    const found = await this.prisma.productEntitlement.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return !!found;
  }

  private async getProtocolEntity(slug: string) {
    const protocol = await this.prisma.protocol.findUnique({ where: { slug } });
    if (!protocol || protocol.status !== 'PUBLISHED' || !protocol.spec) {
      throw new NotFoundException('Protocolo não encontrado.');
    }
    return protocol;
  }

  private async isLocked(protocol: { entitlementProductId: string | null; requiresFounder: boolean }, userId?: string) {
    if (protocol.entitlementProductId) {
      return !(await this.hasProductEntitlement(userId, protocol.entitlementProductId));
    }
    return protocol.requiresFounder;
  }

  // ─── Leitura: protocolo + estado do usuário/gato ────────────────────────

  async getProtocolAndState(slug: string, userId?: string, petId?: string) {
    const protocol = await this.getProtocolEntity(slug);
    const spec: any = protocol.spec;
    const locked = await this.isLocked(protocol, userId);

    const preview = {
      titulo: spec.titulo,
      subtitulo: spec.subtitulo,
      promessa: spec.promessa,
      duracao_dias: spec.duracao_dias,
      escopo_nota: spec.escopo_nota,
      preco_centavos: spec.preco_centavos,
      produto_externo_id: spec.produto_externo_id,
    };

    let enrollment: any = null;
    if (!locked && userId && petId) {
      const found = await this.prisma.protocolEnrollment.findFirst({
        where: { protocolId: protocol.id, userId, petId },
        include: { logs: { include: { entries: true }, orderBy: { dayNumber: 'asc' } } },
        orderBy: { startedAt: 'desc' },
      });
      if (found) enrollment = found;
    }

    return {
      protocol: { id: protocol.id, slug: protocol.slug, title: protocol.title },
      locked,
      preview,
      spec: locked ? null : spec,
      enrollment,
    };
  }

  // ─── Início / triagem ────────────────────────────────────────────────────

  async start(slug: string, userId: string, petId: string) {
    if (!userId || !petId) throw new BadRequestException('userId e petId são obrigatórios.');

    const protocol = await this.getProtocolEntity(slug);
    if (await this.isLocked(protocol, userId)) {
      throw new ForbiddenException('Este protocolo exige a liberação do produto.');
    }

    const pet = await this.prisma.pet.findUnique({ where: { id: petId }, select: { ownerId: true } });
    if (!pet || pet.ownerId !== userId) {
      throw new BadRequestException('Gato não encontrado ou não pertence a este tutor.');
    }

    const existingActive = await this.prisma.protocolEnrollment.findFirst({
      where: { protocolId: protocol.id, userId, petId, status: 'EM_ANDAMENTO' },
    });
    if (existingActive) return this.serializeEnrollment(existingActive.id);

    const enrollment = await this.prisma.protocolEnrollment.create({
      data: {
        protocolId: protocol.id,
        userId,
        petId,
        status: 'EM_ANDAMENTO',
        currentDay: 0,
      },
    });

    return this.serializeEnrollment(enrollment.id);
  }

  async submitTriage(
    slug: string,
    body: { enrollmentId: string; emergenciaMarcados?: string[]; veterinarioOpcaoId?: string },
  ) {
    const protocol = await this.getProtocolEntity(slug);
    const spec: any = protocol.spec;
    const enrollment = await this.prisma.protocolEnrollment.findUnique({ where: { id: body.enrollmentId } });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada.');
    if (enrollment.status !== 'EM_ANDAMENTO') throw new BadRequestException('Esta inscrição já foi encerrada.');

    const blocoEmergencia = (spec.triagem?.blocos || []).find((b: any) => b.id === 'emergencia');
    const blocoVet = (spec.triagem?.blocos || []).find((b: any) => b.id === 'veterinario');
    const marcados = body.emergenciaMarcados || [];

    const triageAnswers: any = { emergencia: marcados, veterinario: body.veterinarioOpcaoId || null };

    // Bloco emergência — QUALQUER item marcado interrompe, sem IA, sem XP.
    if (marcados.length > 0 && blocoEmergencia?.acao_se_algum_marcado === 'interromper') {
      await this.prisma.protocolEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'INTERROMPIDO_EMERGENCIA', triageAnswers },
      });
      return {
        interrupted: true,
        telaUrgencia: blocoEmergencia.tela_urgencia,
      };
    }

    // Bloco veterinário — pode criar tarefa fixa.
    const opcaoEscolhida = (blocoVet?.opcoes || []).find((o: any) => o.id === body.veterinarioOpcaoId);
    const criaTarefaFixa = opcaoEscolhida?.consequencia === 'seguir_com_tarefa_fixa';

    await this.prisma.$transaction(async (tx) => {
      await tx.protocolEnrollment.update({
        where: { id: enrollment.id },
        data: { triageAnswers, currentDay: 1, fixedTaskDone: false },
      });

      // Marco da triagem — dayNumber 0 representa a triagem em si.
      const triageLog = await tx.protocolDayLog.upsert({
        where: { enrollmentId_dayNumber: { enrollmentId: enrollment.id, dayNumber: 0 } },
        update: { completedAt: new Date() },
        create: { enrollmentId: enrollment.id, dayNumber: 0, unlockedAt: enrollment.startedAt, completedAt: new Date() },
      });
      if (spec.triagem?.marco_timeline) {
        await tx.protocolDayEntry.create({
          data: { dayLogId: triageLog.id, data: { marco: spec.triagem.marco_timeline.rotulo } },
        });
      }

      // Dia 1 abre imediatamente após a triagem.
      await tx.protocolDayLog.upsert({
        where: { enrollmentId_dayNumber: { enrollmentId: enrollment.id, dayNumber: 1 } },
        update: {},
        create: { enrollmentId: enrollment.id, dayNumber: 1, unlockedAt: new Date() },
      });
    });

    return { interrupted: false, criaTarefaFixa, opcaoEscolhida, ...(await this.serializeEnrollment(enrollment.id)) };
  }

  // ─── Dias ────────────────────────────────────────────────────────────────

  async toggleChecklist(slug: string, body: { enrollmentId: string; dayNumber: number; itemId: string; checked: boolean }) {
    const log = await this.findDayLog(body.enrollmentId, body.dayNumber);
    const checklist = { ...((log.checklist as any) || {}), [body.itemId]: body.checked };
    await this.prisma.protocolDayLog.update({ where: { id: log.id }, data: { checklist } });
    return { checklist };
  }

  async submitRegistro(slug: string, body: { enrollmentId: string; dayNumber: number; data: Record<string, any> }) {
    const protocol = await this.getProtocolEntity(slug);
    const spec: any = protocol.spec;
    const diaSpec = (spec.dias || []).find((d: any) => d.numero === body.dayNumber);
    const log = await this.findDayLog(body.enrollmentId, body.dayNumber);

    const repetivel = Boolean(diaSpec?.registro?.repetivel);
    // Guarda o rótulo do marco junto do registro — é o que a timeline do gato usa.
    const payload = diaSpec?.registro?.marco_timeline
      ? { ...body.data, __marco: diaSpec.registro.marco_timeline.rotulo }
      : body.data;

    let entry;
    if (!repetivel) {
      // Mescla em vez de substituir: o dia pode receber duas submissões
      // separadas (o registro do próprio dia + um hábito herdado de um dia
      // anterior) que precisam conviver na mesma entrada.
      const existing = await this.prisma.protocolDayEntry.findFirst({ where: { dayLogId: log.id } });
      entry = existing
        ? await this.prisma.protocolDayEntry.update({
            where: { id: existing.id },
            data: { data: { ...(existing.data as any), ...payload } },
          })
        : await this.prisma.protocolDayEntry.create({ data: { dayLogId: log.id, data: payload } });
    } else {
      entry = await this.prisma.protocolDayEntry.create({ data: { dayLogId: log.id, data: payload } });
    }

    return { entry };
  }

  async completeFixedTask(enrollmentId: string) {
    await this.prisma.protocolEnrollment.update({ where: { id: enrollmentId }, data: { fixedTaskDone: true } });
    return { ok: true };
  }

  async completeDay(slug: string, body: { enrollmentId: string; dayNumber: number }) {
    const protocol = await this.getProtocolEntity(slug);
    const spec: any = protocol.spec;
    const enrollment = await this.prisma.protocolEnrollment.findUnique({ where: { id: body.enrollmentId } });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada.');
    if (enrollment.status !== 'EM_ANDAMENTO') throw new BadRequestException('Esta inscrição já foi encerrada.');

    const log = await this.findDayLog(body.enrollmentId, body.dayNumber);
    if (log.completedAt) throw new BadRequestException('Este dia já foi concluído.');
    if (new Date(log.unlockedAt).getTime() > Date.now()) throw new BadRequestException('Este dia ainda não abriu.');

    await this.prisma.protocolDayLog.update({ where: { id: log.id }, data: { completedAt: new Date() } });

    // XP só na conclusão do dia — nunca na triagem/emergência.
    this.gamif.onProtocolDayComplete(enrollment.userId, enrollment.petId).catch(() => {});

    const totalDays = spec.duracao_dias || (spec.dias || []).length;

    if (body.dayNumber >= totalDays) {
      await this.prisma.protocolEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'CONCLUIDO', completedAt: new Date() },
      });
      return this.serializeEnrollment(enrollment.id);
    }

    const nextDay = body.dayNumber + 1;
    await this.prisma.protocolDayLog.upsert({
      where: { enrollmentId_dayNumber: { enrollmentId: enrollment.id, dayNumber: nextDay } },
      update: {},
      create: { enrollmentId: enrollment.id, dayNumber: nextDay, unlockedAt: startOfNextCalendarDayUTC(new Date()) },
    });
    await this.prisma.protocolEnrollment.update({ where: { id: enrollment.id }, data: { currentDay: nextDay } });

    return this.serializeEnrollment(enrollment.id);
  }

  /** Atalho de emergência disponível em todos os dias (lembrete_permanente). */
  async interruptForEmergency(slug: string, enrollmentId: string) {
    const protocol = await this.getProtocolEntity(slug);
    const spec: any = protocol.spec;
    const enrollment = await this.prisma.protocolEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada.');

    await this.prisma.protocolEnrollment.update({
      where: { id: enrollmentId },
      data: { status: 'INTERROMPIDO_EMERGENCIA' },
    });

    const blocoEmergencia = (spec.triagem?.blocos || []).find((b: any) => b.id === 'emergencia');
    return { interrupted: true, telaUrgencia: blocoEmergencia?.tela_urgencia || null };
  }

  async advance(enrollmentId: string) {
    const enrollment = await this.prisma.protocolEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada.');

    const log = await this.findDayLog(enrollmentId, enrollment.currentDay);
    await this.prisma.protocolDayLog.update({ where: { id: log.id }, data: { unlockedAt: new Date(), advancedEarly: true } });
    return this.serializeEnrollment(enrollmentId);
  }

  // ─── Fechamento ──────────────────────────────────────────────────────────

  async getClosing(slug: string, enrollmentId: string) {
    const protocol = await this.getProtocolEntity(slug);
    const spec: any = protocol.spec;

    const enrollment = await this.prisma.protocolEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        logs: { include: { entries: true }, orderBy: { dayNumber: 'asc' } },
        pet: true,
      },
    });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada.');

    // Comparativo: ocorrências com campo "local" no dia 1 x nos dias seguintes.
    const allEntries = enrollment.logs.flatMap((l) => l.entries.map((e) => ({ dayNumber: l.dayNumber, data: e.data as any })));
    const day1Occurrences = allEntries.filter((e) => e.dayNumber === 1 && e.data?.local);
    const laterOccurrences = allEntries.filter((e) => e.dayNumber > 1 && e.data?.local);
    const locationCounts = new Map<string, number>();
    [...day1Occurrences, ...laterOccurrences].forEach((e) => {
      const loc = String(e.data.local).trim().toLowerCase();
      locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
    });
    const repeatedLocations = [...locationCounts.entries()].filter(([, count]) => count > 1).map(([loc]) => loc);

    const comparativo = {
      dia1: day1Occurrences.length,
      ultimosDias: laterOccurrences.length,
      locaisRepetidos: repeatedLocations,
    };

    // Cenário aplicável — avalia "quando" contra a resposta do dia 7 (registro.campos "resultado").
    const day7Entry = allEntries.find((e) => e.dayNumber === 7);
    const cenarioContext = { resultado: day7Entry?.data?.resultado || null };
    const cenarioAplicavel = (spec.fechamento?.cenarios || []).find((c: any) => evaluateCondition(c.quando, cenarioContext));

    // Upsell — avalia contra dados do gato.
    const pet = enrollment.pet;
    const idadeMeses = pet.ageYears != null ? pet.ageYears * 12 + (pet.ageMonths || 0) : null;
    const cadastradoHaDias = pet.createdAt ? Math.floor((Date.now() - new Date(pet.createdAt).getTime()) / 86400000) : null;
    const upsellContext = { gato: { idade_meses: idadeMeses, cadastrado_ha_dias: cadastradoHaDias } };
    const upsell = spec.fechamento?.upsell;
    const showUpsell = upsell ? evaluateCondition(upsell.quando, upsellContext) : false;

    return {
      titulo: spec.fechamento?.titulo,
      comparativo,
      cenario: cenarioAplicavel || null,
      upsell: showUpsell ? upsell : null,
      geraPdf: spec.fechamento?.gera_pdf || null,
      avisoGlobal: spec.aviso_global,
      pet: { id: pet.id, name: pet.name, photoUrl: pet.photoUrl, weight: pet.weight },
      triageAnswers: enrollment.triageAnswers,
      logs: enrollment.logs,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async findDayLog(enrollmentId: string, dayNumber: number) {
    const log = await this.prisma.protocolDayLog.findUnique({
      where: { enrollmentId_dayNumber: { enrollmentId, dayNumber } },
    });
    if (!log) throw new NotFoundException('Dia não encontrado ou ainda não desbloqueado.');
    return log;
  }

  private async serializeEnrollment(enrollmentId: string) {
    const enrollment = await this.prisma.protocolEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { logs: { include: { entries: true }, orderBy: { dayNumber: 'asc' } } },
    });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada.');

    const currentLog = enrollment.logs.find((l) => l.dayNumber === enrollment.currentDay) || null;
    const currentUnlocked = currentLog ? new Date(currentLog.unlockedAt).getTime() <= Date.now() : false;

    return { enrollment, currentLog, currentUnlocked };
  }
}

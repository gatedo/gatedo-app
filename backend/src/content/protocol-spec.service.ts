import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationIntegration } from '../gamification/gamification.integration';
import { evaluateCondition } from './condition-eval';
import { canBypassPlanCosts, getUserEntitlements } from '../membership/membership.constants';

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
    const user = userId
      ? await this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true, badges: true, role: true } })
      : null;
    // ADMIN/TESTER_VIP testando o app nunca esbarra em trava — mesma
    // convenção usada em content.service.ts e gamification.service.ts.
    if (canBypassPlanCosts(user)) return false;

    if (protocol.entitlementProductId) {
      return !(await this.hasProductEntitlement(userId, protocol.entitlementProductId));
    }
    return protocol.requiresFounder && !getUserEntitlements(user || {}).canAccessProtocols;
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

  /** v1.1 — resposta de um único campo por toque (pergunta_final_toque, pergunta_areia_toque, habito_diario). */
  async submitDayAnswer(body: { enrollmentId: string; dayNumber: number; fieldId: string; value: any }) {
    const log = await this.findDayLog(body.enrollmentId, body.dayNumber);
    const existing = await this.prisma.protocolDayEntry.findFirst({ where: { dayLogId: log.id } });
    const entry = existing
      ? await this.prisma.protocolDayEntry.update({
          where: { id: existing.id },
          data: { data: { ...(existing.data as any), [body.fieldId]: body.value } },
        })
      : await this.prisma.protocolDayEntry.create({ data: { dayLogId: log.id, data: { [body.fieldId]: body.value } } });
    return { entry };
  }

  /**
   * "Aconteceu de novo" — disponível a qualquer momento durante os 7 dias,
   * de qualquer tela (card da home, botão + do app). Resolve o dia sozinho
   * (o dia corrente da inscrição) — quem chama não precisa saber em que dia
   * o protocolo está.
   */
  async submitRegistroAvulso(slug: string, body: { enrollmentId: string; onde: string; como: string }) {
    const protocol = await this.getProtocolEntity(slug);
    const spec: any = protocol.spec;
    const enrollment = await this.prisma.protocolEnrollment.findUnique({ where: { id: body.enrollmentId } });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada.');
    if (enrollment.status !== 'EM_ANDAMENTO') throw new BadRequestException('Este protocolo não está em andamento.');
    if (enrollment.currentDay < 1) throw new BadRequestException('A triagem ainda não foi concluída.');

    const log = await this.findDayLog(enrollment.id, enrollment.currentDay);
    const marco = spec.registro_avulso?.marco_timeline?.rotulo || null;
    const entry = await this.prisma.protocolDayEntry.create({
      data: {
        dayLogId: log.id,
        data: { tipo: 'registro_avulso', onde: body.onde, como: body.como, ...(marco ? { __marco: marco } : {}) },
      },
    });

    return { entry, confirmacao: spec.registro_avulso?.confirmacao || null };
  }

  /** Tela "Como funciona" — marca como vista, uma vez por inscrição. */
  async markPresentationSeen(enrollmentId: string) {
    const enrollment = await this.prisma.protocolEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada.');
    if (!enrollment.presentationSeenAt) {
      await this.prisma.protocolEnrollment.update({ where: { id: enrollmentId }, data: { presentationSeenAt: new Date() } });
    }
    return this.serializeEnrollment(enrollmentId);
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

  /**
   * "Marquei errado, quero reconsiderar" — pro tutor que clicou sem querer
   * num item de emergência. Não é um jeito de ignorar uma emergência real:
   * se a interrupção aconteceu ainda na triagem (currentDay 0, nunca abriu
   * o dia 1), manda de volta pra refazer a triagem do zero. Se aconteceu a
   * partir do atalho de emergência em pleno protocolo (currentDay >= 1), só
   * destrava de novo — nenhum progresso de dia é perdido.
   */
  async reconsiderEmergency(enrollmentId: string) {
    const enrollment = await this.prisma.protocolEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada.');
    if (enrollment.status !== 'INTERROMPIDO_EMERGENCIA') {
      throw new BadRequestException('Esta inscrição não está interrompida por emergência.');
    }

    const data: Prisma.ProtocolEnrollmentUpdateInput =
      enrollment.currentDay === 0
        ? { status: 'EM_ANDAMENTO', triageAnswers: Prisma.JsonNull }
        : { status: 'EM_ANDAMENTO' };

    await this.prisma.protocolEnrollment.update({ where: { id: enrollmentId }, data });
    return this.serializeEnrollment(enrollmentId);
  }

  async advance(enrollmentId: string) {
    const enrollment = await this.prisma.protocolEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada.');

    const log = await this.findDayLog(enrollmentId, enrollment.currentDay);
    await this.prisma.protocolDayLog.update({ where: { id: log.id }, data: { unlockedAt: new Date(), advancedEarly: true } });
    return this.serializeEnrollment(enrollmentId);
  }

  // ─── Fechamento ──────────────────────────────────────────────────────────

  /**
   * Comparativo início×fim — conta ocorrências reais, não autorrelato.
   * Reconhece dois formatos de entry porque a troca de versão do spec não
   * apaga histórico: v1.1 marca "Aconteceu de novo" com {tipo:'registro_avulso'},
   * v1.0 (quem começou antes da v1.1 existir) grava direto {local: '...'} no
   * dia 1. Início = dias 1-2, fim = dias 6-7 (janela fixa, o spec não define
   * uma diferente).
   */
  private async computeComparativo(enrollmentId: string) {
    const logs = await this.prisma.protocolDayLog.findMany({
      where: { enrollmentId },
      include: { entries: true },
      orderBy: { dayNumber: 'asc' },
    });

    const isOcorrencia = (data: any) => data?.tipo === 'registro_avulso' || Boolean(data?.local);
    const localDe = (data: any) => String(data.onde || data.local || '').trim().toLowerCase();

    const allOcorrencias = logs.flatMap((l) =>
      l.entries.filter((e) => isOcorrencia(e.data as any)).map((e) => ({ dayNumber: l.dayNumber, data: e.data as any })),
    );
    const inicio = allOcorrencias.filter((e) => e.dayNumber <= 2);
    const fim = allOcorrencias.filter((e) => e.dayNumber >= 6);

    const locationCounts = new Map<string, number>();
    allOcorrencias.forEach((e) => {
      const loc = localDe(e.data);
      if (!loc) return;
      locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
    });
    const locaisRepetidos = [...locationCounts.entries()].filter(([, count]) => count > 1).map(([loc]) => loc);

    return {
      ocorrenciasInicio: inicio.length,
      ocorrenciasFim: fim.length,
      // Nomes antigos mantidos por compatibilidade de quem já lia esse shape.
      dia1: inicio.length,
      ultimosDias: fim.length,
      locaisRepetidos,
    };
  }

  /** Prévia do comparativo pro próprio dia 7 (mostra_comparativo), antes do fechamento. */
  async getComparativoPreview(enrollmentId: string) {
    return this.computeComparativo(enrollmentId);
  }

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

    const comparativo = await this.computeComparativo(enrollmentId);

    // Cenário aplicável — avalia "quando" contra a resposta do dia 7 (fieldId "resultado").
    const allEntries = enrollment.logs.flatMap((l) => l.entries.map((e) => ({ dayNumber: l.dayNumber, data: e.data as any })));
    const day7Entry = allEntries.find((e) => e.dayNumber === 7 && e.data?.resultado);
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
      // resumo_pdf é o nome v1.1 (era gera_pdf na v1.0) — aceita os dois.
      geraPdf: spec.fechamento?.resumo_pdf || spec.fechamento?.gera_pdf || null,
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

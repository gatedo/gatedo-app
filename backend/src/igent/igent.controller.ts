import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common';
import { IgentService } from './igent.service';
import { IgentCreditsService, AskDecision, isAskBlocked } from './igent-credits.service';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationIntegration } from '../gamification/gamification.integration';
import { NotificationService } from '../notifications/notification.service';
import { hasClubeAccess } from '../membership/membership.constants';
import { EventsService } from '../events/events.service';
import { ContentService } from '../content/content.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { assertOwnsPet } from '../common/ownership.util';

// Palavras curtas demais/genéricas demais pra valer como palavra-chave de
// busca no Almanaque — filtra antes de tentar o desvio.
const ALMANAC_STOPWORDS = new Set([
  'que', 'com', 'para', 'por', 'uma', 'um', 'meu', 'minha', 'seu', 'sua',
  'ele', 'ela', 'isso', 'esse', 'essa', 'esta', 'está', 'pode', 'ser',
  'tem', 'muito', 'como', 'quando', 'onde', 'porque', 'gato', 'gata',
  'sobre', 'fazer', 'hoje', 'ontem', 'agora', 'ainda', 'mais', 'menos',
]);

function extractAlmanacKeywords(message: string): string[] {
  const normalized = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');

  return Array.from(
    new Set(normalized.split(/\s+/).filter((w) => w.length >= 4 && !ALMANAC_STOPWORDS.has(w))),
  ).slice(0, 5);
}

@Controller('igent')
@UseGuards(JwtAuthGuard)
export class IgentController {
  constructor(
    private readonly igentService: IgentService,
    private readonly igentCredits: IgentCreditsService,
    private readonly prisma: PrismaService,
    private readonly gamif: GamificationIntegration,
    private readonly notifService: NotificationService,
    private readonly events: EventsService,
    private readonly contentService: ContentService,
  ) {}

  private async searchAlmanac(message: string) {
    const keywords = extractAlmanacKeywords(message);
    if (keywords.length === 0) return [];

    const results = await Promise.all(
      keywords.map((q) => this.contentService.listGuideEntries({ q }).catch(() => [])),
    );

    const seen = new Map<string, any>();
    for (const batch of results) {
      for (const entry of batch) {
        if (!seen.has(entry.slug)) seen.set(entry.slug, entry);
      }
    }
    return Array.from(seen.values()).slice(0, 3);
  }

  @Get('credits')
  async getCredits(@Req() req: any) {
    return this.igentCredits.getStatus(req.user.id);
  }

  @Post('credits/notify-reset')
  async notifyOnReset(@Req() req: any) {
    const userId = req.user.id;
    const status = await this.igentCredits.getStatus(userId);
    const resetLabel = status.resetsAt
      ? new Date(status.resetsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
      : 'no início do próximo mês';

    await this.notifService.create({
      userId,
      type: 'SYSTEM',
      message: `⏳ Combinado! Vamos te avisar quando suas perguntas do iGentVet renovarem em ${resetLabel}.`,
    });

    return { ok: true, resetsAt: status.resetsAt };
  }

  @Post('analyze')
  async analyze(
    @Req() req: any,
    @Body() body: {
      petId: string;
      symptom: string;
      symptomId?: string;
      clinicalContext?: any;
    },
  ) {
    const userId = req.user.id;
    await assertOwnsPet(this.prisma, body.petId, req.user);

    const askDecision: AskDecision = await this.igentCredits.canAsk(userId, 'QUESTION');
    if (isAskBlocked(askDecision)) {
      if (askDecision.reason === 'MONTHLY_LIMIT' || askDecision.reason === 'DAILY_CAP') {
        this.events.track({ name: 'ai_limit_hit', userId, props: { reason: askDecision.reason } }).catch(() => {});
      }
      return { blocked: true, reason: askDecision.reason, ...(await this.igentCredits.getStatus(userId)) };
    }

    const result = await this.igentService.analyzeSymptom(
      body.petId,
      body.symptom,
      body.symptomId,
      body.clinicalContext,
    );

    if (result?.aiUsage) {
      await this.igentCredits.logUsage({
        userId,
        petId: body.petId,
        kind: 'QUESTION',
        source: askDecision.allowed ? askDecision.source : 'QUOTA',
        provider: result.aiUsage.provider,
        tokensUsed: result.aiUsage.tokensUsed,
      });
      return { ...result, credits: await this.igentCredits.getStatus(userId) };
    }

    return result;
  }

  @Post('chat')
  async chat(
    @Req() req: any,
    @Body() body: {
      petId?: string;
      message: string;
      symptom?: string;
      symptomId?: string;
      clinicalContext?: any;
      imageBase64?: string;
      imageMimeType?: string;
      imageContext?: string;
      referenceImages?: Array<{ url?: string; label?: string; notes?: string; patternTitle?: string; mimeType?: string }>;
      conversationContext?: Array<{ sender?: string; text?: string; type?: string }>;
      examMode?: boolean;
      examPdfBase64?: string;
      examPdfFilename?: string;
      skipDeflection?: boolean;
    },
  ) {
    const userId = req.user.id;
    if (body.petId) await assertOwnsPet(this.prisma, body.petId, req.user);
    const kind: 'QUESTION' | 'EXAM_EXPLANATION' = body.examMode || body.examPdfBase64 ? 'EXAM_EXPLANATION' : 'QUESTION';

    // Leitura de exame/laudo (PDF ou foto) é exclusiva Clube GATEDO.
    if (kind === 'EXAM_EXPLANATION') {
      const membershipUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, badges: true, planExpires: true, role: true },
      });
      if (!hasClubeAccess(membershipUser)) {
        return { blocked: true, reason: 'CLUBE_REQUIRED', feature: 'IGENT_EXAM_READING' };
      }
    }

    const askDecision: AskDecision = await this.igentCredits.canAsk(userId, kind);
    if (isAskBlocked(askDecision)) {
      if (askDecision.reason === 'MONTHLY_LIMIT' || askDecision.reason === 'DAILY_CAP') {
        this.events.track({ name: 'ai_limit_hit', userId, props: { reason: askDecision.reason, kind } }).catch(() => {});
      }
      return { blocked: true, reason: askDecision.reason, ...(await this.igentCredits.getStatus(userId)) };
    }

    // Desvio pelo Almanaque — só perguntas de texto puro, sem imagem/exame,
    // e só na primeira tentativa (não repete se a pessoa já disse "ainda
    // quero perguntar"). Não consome crédito nenhum. É exatamente aqui que
    // uma pergunta de conteúdo (sem gato) tem mais chance de nunca precisar
    // chamar a IA.
    if (kind === 'QUESTION' && !body.skipDeflection && !body.imageBase64 && body.message?.trim()) {
      const almanacEntries = await this.searchAlmanac(body.message);
      if (almanacEntries.length > 0) {
        this.events.track({ name: 'almanaque_deflect_shown', userId, props: { matches: almanacEntries.length } }).catch(() => {});
        return { deflected: true, entries: almanacEntries };
      }
    }

    // Usa chatWithVet — endpoint correto com contexto de chat. petId é
    // opcional: sem ele, chatWithVet monta uma resposta sem histórico
    // clínico de nenhum gato específico (pergunta de conteúdo genérico).
    const result = await this.igentService.chatWithVet(
      body.petId || null,
      body.message,
      body.symptom,
      body.symptomId,
      body.clinicalContext,
      {
        imageBase64: body.imageBase64,
        imageMimeType: body.imageMimeType,
        imageContext: body.imageContext,
        referenceImages: body.referenceImages,
        examMode: body.examMode,
        examPdfBase64: body.examPdfBase64,
        examPdfFilename: body.examPdfFilename,
      },
      body.conversationContext,
    );

    if (result?.aiUsage) {
      await this.igentCredits.logUsage({
        userId,
        petId: body.petId,
        kind,
        source: askDecision.allowed ? askDecision.source : 'QUOTA',
        provider: result.aiUsage.provider,
        tokensUsed: result.aiUsage.tokensUsed,
      });
      const credits = await this.igentCredits.getStatus(userId);
      this.events.track({ name: 'igentvet_question', userId, props: { credits_left: credits.questionRemaining, kind } }).catch(() => {});
      return { ...result, credits };
    }

    return result;
  }

  @Post('report')
  async report(
    @Req() req: any,
    @Body() body: {
      petId: string;
      symptomLabel: string;
      analysisText: string;
      care: string[];
      isUrgent: boolean;
      ownerResponse?: string;
      pdfBase64?: string;
      pdfFilename?: string;
      pdfMimeType?: string;
      saveToDocuments?: boolean;
    },
  ) {
    await assertOwnsPet(this.prisma, body.petId, req.user);
    return this.igentService.generateReport(
      body.petId,
      body.symptomLabel,
      body.analysisText,
      body.care,
      body.isUrgent,
      body.ownerResponse || '',
      {
        pdfBase64: body.pdfBase64,
        pdfFilename: body.pdfFilename,
        pdfMimeType: body.pdfMimeType,
        saveToDocuments: body.saveToDocuments,
      },
    );
  }

  @Post('sessions')
  async createSession(@Req() req: any, @Body() body: any) {
    await assertOwnsPet(this.prisma, body.petId, req.user);
    const session = await this.igentService.createSession(body);
    const totalSessions = await this.prisma.igentSession.count({
      where: { petId: body.petId },
    });
    this.gamif
      .onIgentConsult(req.user.id, body.petId, totalSessions === 1)
      .catch(() => {});
    return session;
  }

  @Get('sessions')
  async getSessions(@Req() req: any, @Query('petId') petId: string) {
    await assertOwnsPet(this.prisma, petId, req.user);
    return this.igentService.getSessions(petId);
  }

  @Post('record-update')
  async recordUpdate(@Req() req: any, @Body() body: any) {
    if (body?.petId) await assertOwnsPet(this.prisma, body.petId, req.user);
    return this.igentService.recordUpdate(body);
  }

  @Post('feedback')
  async feedback(@Req() req: any, @Body() body: any) {
    if (body?.petId) await assertOwnsPet(this.prisma, body.petId, req.user);
    return this.igentService.recordFeedback(body);
  }
}

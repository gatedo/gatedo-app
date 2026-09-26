import { Controller, Post, Get, Body, Query, BadRequestException } from '@nestjs/common';
import { IgentService } from './igent.service';
import { IgentCreditsService, AskDecision, isAskBlocked } from './igent-credits.service';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationIntegration } from '../gamification/gamification.integration';
import { NotificationService } from '../notifications/notification.service';
import { hasClubeAccess } from '../membership/membership.constants';
import { EventsService } from '../events/events.service';
import { ContentService } from '../content/content.service';

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
  async getCredits(@Query('userId') userId?: string, @Query('petId') petId?: string) {
    const resolvedUserId = userId || (petId ? await this.getPetOwnerId(petId) : null);
    if (!resolvedUserId) {
      throw new BadRequestException('userId ou petId é obrigatório.');
    }
    return this.igentCredits.getStatus(resolvedUserId);
  }

  @Post('credits/notify-reset')
  async notifyOnReset(@Body() body: { userId?: string; petId?: string }) {
    const resolvedUserId = body.userId || (body.petId ? await this.getPetOwnerId(body.petId) : null);
    if (!resolvedUserId) {
      throw new BadRequestException('userId ou petId é obrigatório.');
    }

    const status = await this.igentCredits.getStatus(resolvedUserId);
    const resetLabel = status.resetsAt
      ? new Date(status.resetsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
      : 'no início do próximo mês';

    await this.notifService.create({
      userId: resolvedUserId,
      type: 'SYSTEM',
      message: `⏳ Combinado! Vamos te avisar quando suas perguntas do iGentVet renovarem em ${resetLabel}.`,
    });

    return { ok: true, resetsAt: status.resetsAt };
  }

  private async getPetOwnerId(petId: string): Promise<string | null> {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      select: { ownerId: true },
    });
    return pet?.ownerId || null;
  }

  @Post('analyze')
  async analyze(
    @Body() body: {
      petId: string;
      symptom: string;
      symptomId?: string;
      clinicalContext?: any;
    },
  ) {
    const ownerId = await this.getPetOwnerId(body.petId);
    let askDecision: AskDecision | null = null;

    if (ownerId) {
      askDecision = await this.igentCredits.canAsk(ownerId, 'QUESTION');
      const decision = askDecision;
      if (isAskBlocked(decision)) {
        if (decision.reason === 'MONTHLY_LIMIT' || decision.reason === 'DAILY_CAP') {
          this.events.track({ name: 'ai_limit_hit', userId: ownerId, props: { reason: decision.reason } }).catch(() => {});
        }
        return { blocked: true, reason: decision.reason, ...(await this.igentCredits.getStatus(ownerId)) };
      }
    }

    const result = await this.igentService.analyzeSymptom(
      body.petId,
      body.symptom,
      body.symptomId,
      body.clinicalContext,
    );

    if (ownerId && result?.aiUsage) {
      await this.igentCredits.logUsage({
        userId: ownerId,
        petId: body.petId,
        kind: 'QUESTION',
        source: askDecision?.allowed ? askDecision.source : 'QUOTA',
        provider: result.aiUsage.provider,
        tokensUsed: result.aiUsage.tokensUsed,
      });
      return { ...result, credits: await this.igentCredits.getStatus(ownerId) };
    }

    return result;
  }

  @Post('chat')
  async chat(
    @Body() body: {
      petId: string;
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
    const ownerId = await this.getPetOwnerId(body.petId);
    const kind: 'QUESTION' | 'EXAM_EXPLANATION' = body.examMode || body.examPdfBase64 ? 'EXAM_EXPLANATION' : 'QUESTION';

    // Leitura de exame/laudo (PDF ou foto) é exclusiva Clube GATEDO.
    if (kind === 'EXAM_EXPLANATION' && ownerId) {
      const membershipUser = await this.prisma.user.findUnique({
        where: { id: ownerId },
        select: { plan: true, badges: true, planExpires: true, role: true },
      });
      if (!hasClubeAccess(membershipUser)) {
        return { blocked: true, reason: 'CLUBE_REQUIRED', feature: 'IGENT_EXAM_READING' };
      }
    }

    let askDecision: AskDecision | null = null;
    if (ownerId) {
      askDecision = await this.igentCredits.canAsk(ownerId, kind);
      const decision = askDecision;
      if (isAskBlocked(decision)) {
        if (decision.reason === 'MONTHLY_LIMIT' || decision.reason === 'DAILY_CAP') {
          this.events.track({ name: 'ai_limit_hit', userId: ownerId, props: { reason: decision.reason, kind } }).catch(() => {});
        }
        return { blocked: true, reason: decision.reason, ...(await this.igentCredits.getStatus(ownerId)) };
      }
    }

    // Desvio pelo Almanaque — só perguntas de texto puro, sem imagem/exame,
    // e só na primeira tentativa (não repete se a pessoa já disse "ainda
    // quero perguntar"). Não consome crédito nenhum.
    if (kind === 'QUESTION' && !body.skipDeflection && !body.imageBase64 && body.message?.trim()) {
      const almanacEntries = await this.searchAlmanac(body.message);
      if (almanacEntries.length > 0) {
        if (ownerId) {
          this.events.track({ name: 'almanaque_deflect_shown', userId: ownerId, props: { matches: almanacEntries.length } }).catch(() => {});
        }
        return { deflected: true, entries: almanacEntries };
      }
    }

    // Usa chatWithVet — endpoint correto com contexto de chat
    const result = await this.igentService.chatWithVet(
      body.petId,
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

    if (ownerId && result?.aiUsage) {
      await this.igentCredits.logUsage({
        userId: ownerId,
        petId: body.petId,
        kind,
        source: askDecision?.allowed ? askDecision.source : 'QUOTA',
        provider: result.aiUsage.provider,
        tokensUsed: result.aiUsage.tokensUsed,
      });
      const credits = await this.igentCredits.getStatus(ownerId);
      this.events.track({ name: 'igentvet_question', userId: ownerId, props: { credits_left: credits.questionRemaining, kind } }).catch(() => {});
      return { ...result, credits };
    }

    return result;
  }

  @Post('report')
  async report(
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
  async createSession(@Body() body: any) {
    const session = await this.igentService.createSession(body);
    const totalSessions = await this.prisma.igentSession.count({
      where: { petId: body.petId },
    });
    const pet = await this.prisma.pet.findUnique({
      where: { id: body.petId },
      select: { ownerId: true },
    });
    if (pet?.ownerId) {
      this.gamif
        .onIgentConsult(pet.ownerId, body.petId, totalSessions === 1)
        .catch(() => {});
    }
    return session;
  }

  @Get('sessions')
  async getSessions(@Query('petId') petId: string) {
    return this.igentService.getSessions(petId);
  }

  @Post('record-update')
  async recordUpdate(@Body() body: any) {
    return this.igentService.recordUpdate(body);
  }

  @Post('feedback')
  async feedback(@Body() body: any) {
    return this.igentService.recordFeedback(body);
  }
}

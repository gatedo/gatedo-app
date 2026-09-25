import { Controller, Post, Get, Body, Query, BadRequestException } from '@nestjs/common';
import { IgentService } from './igent.service';
import { IgentCreditsService } from './igent-credits.service';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationIntegration } from '../gamification/gamification.integration';
import { NotificationService } from '../notifications/notification.service';
import { hasClubeAccess } from '../membership/membership.constants';
import { EventsService } from '../events/events.service';

@Controller('igent')
export class IgentController {
  constructor(
    private readonly igentService: IgentService,
    private readonly igentCredits: IgentCreditsService,
    private readonly prisma: PrismaService,
    private readonly gamif: GamificationIntegration,
    private readonly notifService: NotificationService,
    private readonly events: EventsService,
  ) {}

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
    if (ownerId) {
      const status = await this.igentCredits.getStatus(ownerId);
      if (status.blocked) {
        return { blocked: true, reason: 'MONTHLY_LIMIT', ...status };
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
    },
  ) {
    const ownerId = await this.getPetOwnerId(body.petId);
    if (ownerId) {
      const status = await this.igentCredits.getStatus(ownerId);
      if (status.blocked) {
        return { blocked: true, reason: 'MONTHLY_LIMIT', ...status };
      }
    }

    // Leitura de exame/laudo (PDF ou foto) é exclusiva Clube GATEDO.
    if ((body.examMode || body.examPdfBase64) && ownerId) {
      const membershipUser = await this.prisma.user.findUnique({
        where: { id: ownerId },
        select: { plan: true, badges: true, planExpires: true, role: true },
      });
      if (!hasClubeAccess(membershipUser)) {
        return { blocked: true, reason: 'CLUBE_REQUIRED', feature: 'IGENT_EXAM_READING' };
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
        provider: result.aiUsage.provider,
        tokensUsed: result.aiUsage.tokensUsed,
      });
      const credits = await this.igentCredits.getStatus(ownerId);
      this.events.track({ name: 'igentvet_question', userId: ownerId, props: { credits_left: credits.remaining } }).catch(() => {});
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

import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { IgentService } from './igent.service';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationIntegration } from '../gamification/gamification.integration';

@Controller('igent')
export class IgentController {
  constructor(
    private readonly igentService: IgentService,
    private readonly prisma: PrismaService,
    private readonly gamif: GamificationIntegration,
  ) {}

  @Post('analyze')
  async analyze(
    @Body() body: {
      petId: string;
      symptom: string;
      symptomId?: string;
      clinicalContext?: any;
    },
  ) {
    return this.igentService.analyzeSymptom(
      body.petId,
      body.symptom,
      body.symptomId,
      body.clinicalContext,
    );
  }

  @Post('chat')
  async chat(
    @Body() body: {
      petId: string;
      message: string;
      symptom?: string;
      symptomId?: string;
      clinicalContext?: any;
    },
  ) {
    // Usa chatWithVet — endpoint correto com contexto de chat
    return this.igentService.chatWithVet(
      body.petId,
      body.message,
      body.symptom,
      body.symptomId,
      body.clinicalContext,
    );
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
}
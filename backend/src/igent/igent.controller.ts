import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { IgentService } from './igent.service';
import { PrismaService } from '../prisma.service';
import { GamificationIntegration } from '../notifications/gamification.integration';

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
    return this.igentService.analyzeSymptom(body.petId, body.symptom, body.symptomId, body.clinicalContext);
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
    return this.igentService.chatWithVet(body.petId, body.message, body.symptom, body.symptomId, body.clinicalContext);
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
    },
  ) {
    return this.igentService.generateReport(body.petId, body.symptomLabel, body.analysisText, body.care, body.isUrgent, body.ownerResponse || '');
  }

  @Post('sessions')
  async createSession(@Body() body: any) {
    const session = await this.igentService.createSession(body);

    // Verifica se é a primeira consulta do pet (bonus one-time)
    const totalSessions = await this.prisma.igentSession.count({
      where: { petId: body.petId },
    });

    // Busca ownerId do pet
    const pet = await this.prisma.pet.findUnique({
      where: { id: body.petId },
      select: { ownerId: true },
    });

    // Credita pontos do tutor + XP do gato (fire-and-forget)
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
  // POST /igent/record-update
  // Chamado pelo HealthForm ao salvar vacina/medicação — IA aprende imediatamente
  @Post('record-update')
  async recordUpdate(@Body() body: any) {
    return this.igentService.recordUpdate(body);
  }

}
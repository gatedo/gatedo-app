import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { TreatmentService } from './treatment.service';
import { NotificationService } from '../notifications/notification.service';

@Controller('treatments')
export class TreatmentController {
  constructor(
    private readonly treatmentService: TreatmentService,
    private readonly notifService: NotificationService,
  ) {}

  // POST /treatments — cria tratamento + doses
  @Post()
  async create(@Body() body: any) {
    const schedule = await this.treatmentService.createSchedule(body);

    // Notifica no sininho que o tratamento foi criado
    if (body?.userId && schedule) {
      this.notifService.create({
        userId:  body?.userId,
        type:    'MED_REMINDER',
        petId:   body.petId,
        message: `💊 Tratamento iniciado: ${body.title} — ${body.intervalHours}h de intervalo`,
        cta:     'Ver tratamento',
        metadata: { scheduleId: schedule.id },
      }).catch(() => {});
    }

    return schedule;
  }

  // GET /treatments?petId=xxx — lista tratamentos ativos
  @Get()
  async findByPet(@Query('petId') petId: string) {
    return this.treatmentService.getByPet(petId);
  }

  // GET /treatments/:id/doses — histórico de doses
  @Get(':id/doses')
  async getDoses(@Param('id') id: string) {
    return this.treatmentService.getDoseHistory(id);
  }

  // POST /treatments/doses/:doseId/take — marcar como tomada
  @Post('doses/:doseId/take')
 async takeDose(@Param('doseId') doseId: string, @Body() body?: { notes?: string; userId?: string; catName?: string; petId?: string }) {
    const dose = await this.treatmentService.takeDose(doseId, body?.notes);

    // Notifica confirmação no sininho
    if (body?.userId) {
      this.notifService.create({
        userId:   body?.userId,
        type:     'MED_REMINDER',
        petId:    dose.schedule?.petId || body?.petId || null,  // ← petId para roteamento
        catName:  body?.catName,
        message:  `✅ Dose de ${dose.schedule.title} registrada para ${body?.catName || 'seu gato'}`,
        cta:      'Ver tratamento',
        metadata: { doseId, takenAt: dose.takenAt, petId: dose.schedule?.petId },
      }).catch(() => {});
    }

    return dose;
  }

  // POST /treatments/doses/:doseId/skip — pular dose
  @Post('doses/:doseId/skip')
  async skipDose(@Param('doseId') doseId: string, @Body() body?: { notes?: string }) {
    return this.treatmentService.skipDose(doseId, body?.notes);
  }

  // PATCH /treatments/:id/deactivate — encerrar tratamento
  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    return this.treatmentService.deactivate(id);
  }

  // GET /treatments/pending — doses próximas (próx 15min) para push
  // Chamado pelo frontend em polling ou por cron job
  @Get('pending')
  async getPending() {
    return this.treatmentService.getPendingDoses();
  }
}
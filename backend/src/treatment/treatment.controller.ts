import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { TreatmentService } from './treatment.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { assertOwnsPet } from '../common/ownership.util';

@Controller('treatments')
export class TreatmentController {
  constructor(
    private readonly treatmentService: TreatmentService,
    private readonly notifService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertOwnsSchedule(scheduleId: string, user: { id: string; role?: string }) {
    if (user.role === 'ADMIN') return;
    const schedule = await this.prisma.treatmentSchedule.findUnique({ where: { id: scheduleId }, select: { petId: true } });
    if (!schedule) throw new ForbiddenException('Tratamento não encontrado.');
    await assertOwnsPet(this.prisma, schedule.petId, user);
  }

  private async assertOwnsDose(doseId: string, user: { id: string; role?: string }) {
    if (user.role === 'ADMIN') return;
    const dose = await this.prisma.treatmentDose.findUnique({
      where: { id: doseId },
      select: { schedule: { select: { petId: true } } },
    });
    if (!dose) throw new ForbiddenException('Dose não encontrada.');
    await assertOwnsPet(this.prisma, dose.schedule.petId, user);
  }

  // POST /treatments — cria tratamento + doses
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Body() body: any) {
    await assertOwnsPet(this.prisma, body.petId, req.user);
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
  @UseGuards(JwtAuthGuard)
  async findByPet(@Req() req: any, @Query('petId') petId: string) {
    await assertOwnsPet(this.prisma, petId, req.user);
    return this.treatmentService.getByPet(petId);
  }

  // GET /treatments/:id/doses — histórico de doses
  @Get(':id/doses')
  @UseGuards(JwtAuthGuard)
  async getDoses(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnsSchedule(id, req.user);
    return this.treatmentService.getDoseHistory(id);
  }

  // POST /treatments/doses/:doseId/take — marcar como tomada
  @Post('doses/:doseId/take')
  @UseGuards(JwtAuthGuard)
 async takeDose(@Req() req: any, @Param('doseId') doseId: string, @Body() body?: { notes?: string; userId?: string; catName?: string; petId?: string }) {
    await this.assertOwnsDose(doseId, req.user);
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
  @UseGuards(JwtAuthGuard)
  async skipDose(@Req() req: any, @Param('doseId') doseId: string, @Body() body?: { notes?: string }) {
    await this.assertOwnsDose(doseId, req.user);
    return this.treatmentService.skipDose(doseId, body?.notes);
  }

  // PATCH /treatments/:id/deactivate — encerrar tratamento
  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  async deactivate(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnsSchedule(id, req.user);
    return this.treatmentService.deactivate(id);
  }

  // GET /treatments/pending — doses próximas (próx 15min) para push.
  // Sem guard de proposito: o comentario original diz que tambem pode ser
  // chamado por um cron job (sem token de usuario), e nao da pra confirmar
  // isso com seguranca agora — guardar às cegas arrisca quebrar um job de
  // push em produção. Fica como pendencia pra confirmar com quem mantém o
  // cron antes de fechar esse ultimo.
  @Get('pending')
  async getPending() {
    return this.treatmentService.getPendingDoses();
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TreatmentService {
  constructor(private prisma: PrismaService) {}

  // ─── CRIAR TRATAMENTO + GERAR DOSES ──────────────────────────────────────
  async createSchedule(data: {
    petId:         string;
    userId:        string;
    title:         string;
    notes?:        string;
    intervalHours: number;
    startDate:     string;
    endDate?:      string;
  }) {
    const start = new Date(data.startDate);
    const end   = data.endDate ? new Date(data.endDate) : null;

    const schedule = await this.prisma.treatmentSchedule.create({
      data: {
        petId:         data.petId,
        userId:        data.userId,
        title:         data.title,
        notes:         data.notes || null,
        intervalHours: data.intervalHours,
        startDate:     start,
        endDate:       end,
        active:        true,
      },
    });

    // Gera doses futuras automaticamente (máx 30 dias ou até endDate)
    const doses = this._generateDoses(schedule.id, start, end, data.intervalHours);

    if (doses.length > 0) {
      await this.prisma.treatmentDose.createMany({ data: doses });
    }

    return this.prisma.treatmentSchedule.findUnique({
      where: { id: schedule.id },
      include: { doses: { orderBy: { scheduledAt: 'asc' }, take: 10 } },
    });
  }

  // ─── HELPER: gera datas das doses ────────────────────────────────────────
  private _generateDoses(
    scheduleId: string,
    start: Date,
    end: Date | null,
    intervalHours: number,
  ) {
    const doses: any[] = [];
    const maxDate = end || new Date(start.getTime() + 30 * 86400000); // 30 dias
    const intervalMs = intervalHours * 3600000;
    let current = new Date(start);

    while (current <= maxDate && doses.length < 200) {
      doses.push({
        scheduleId,
        scheduledAt: new Date(current),
        takenAt:     null,
        skipped:     false,
      });
      current = new Date(current.getTime() + intervalMs);
    }

    return doses;
  }

  // ─── LISTAR TRATAMENTOS ATIVOS DO PET ────────────────────────────────────
  async getByPet(petId: string) {
    const schedules = await this.prisma.treatmentSchedule.findMany({
      where: { petId, active: true },
      include: {
        doses: {
          orderBy: { scheduledAt: 'asc' },
          where: { scheduledAt: { gte: new Date(Date.now() - 86400000) } }, // últimas 24h + futuras
          take: 20,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enriquece com próxima dose e stats
    return schedules.map(s => this._enrich(s));
  }

  // ─── MARCAR DOSE COMO TOMADA ──────────────────────────────────────────────
  async takeDose(doseId: string, notes?: string) {
    const dose = await this.prisma.treatmentDose.update({
      where: { id: doseId },
      data: { takenAt: new Date(), notes: notes || null },
      include: { schedule: { select: { title: true, petId: true, userId: true } } },
    });

    // Gera notificação de confirmação
    // (integração com NotificationService é feita no controller)

    return dose;
  }

  // ─── PULAR DOSE ───────────────────────────────────────────────────────────
  async skipDose(doseId: string, notes?: string) {
    return this.prisma.treatmentDose.update({
      where: { id: doseId },
      data: { skipped: true, notes: notes || null },
    });
  }

  // ─── HISTÓRICO DE DOSES ───────────────────────────────────────────────────
  async getDoseHistory(scheduleId: string) {
    return this.prisma.treatmentDose.findMany({
      where: { scheduleId },
      orderBy: { scheduledAt: 'desc' },
      take: 50,
    });
  }

  // ─── ENCERRAR TRATAMENTO ──────────────────────────────────────────────────
  async deactivate(scheduleId: string) {
    return this.prisma.treatmentSchedule.update({
      where: { id: scheduleId },
      data: { active: false, endDate: new Date() },
    });
  }

  // ─── DOSES PENDENTES PARA NOTIFICAÇÃO (usado por cron/poll) ──────────────
  async getPendingDoses() {
    const now     = new Date();
    const in15min = new Date(now.getTime() + 15 * 60000);

    return this.prisma.treatmentDose.findMany({
      where: {
        takenAt:     null,
        skipped:     false,
        scheduledAt: { gte: now, lte: in15min },
        schedule:    { active: true },
      },
      include: {
        schedule: {
          include: {
            pet: { select: { name: true, photoUrl: true } },
          },
        },
      },
    });
  }

  // ─── HELPER: enriquece schedule com próxima dose e % de adesão ───────────
  private _enrich(schedule: any) {
    const now = new Date();
    const allDoses: any[] = schedule.doses || [];

    const nextDose = allDoses.find(
      d => !d.takenAt && !d.skipped && new Date(d.scheduledAt) >= now
    );

    const pastDoses = allDoses.filter(d => new Date(d.scheduledAt) < now);
    const takenCount = pastDoses.filter(d => d.takenAt).length;
    const adherencePct = pastDoses.length > 0
      ? Math.round((takenCount / pastDoses.length) * 100)
      : 100;

    const overdueCount = pastDoses.filter(d => !d.takenAt && !d.skipped).length;

    return {
      ...schedule,
      nextDose,
      adherencePct,
      overdueCount,
      takenCount,
      totalDoses: allDoses.length,
    };
  }
}
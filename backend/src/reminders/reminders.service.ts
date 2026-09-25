import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { EmailService } from '../email/email.service';
import { EventsService } from '../events/events.service';

const TYPE_LABEL: Record<string, string> = {
  VERMIFUGE: 'vermífugo',
  PARASITE: 'antipulgas',
  VACCINE: 'vacina',
  MEDICATION: 'medicação',
  WEIGHT: 'pesagem',
};

const VACCINE_ADVANCE_DAYS = 3;
const OVERDUE_MAX_NOTIFICATIONS = 3;
const OVERDUE_RENOTIFY_DAYS = 7;
const WINDOW_START_HOUR = 9;
const WINDOW_END_HOUR = 20;
const WEIGHT_REMINDER_DAYS = 30;

function brasiliaNow(): Date {
  // Brasília não observa horário de verão desde 2019 — UTC-3 fixo.
  return new Date(Date.now() - 3 * 60 * 60 * 1000);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function genderArticle(gender?: string | null): string {
  if (gender === 'MALE') return 'do';
  if (gender === 'FEMALE') return 'da';
  return 'de';
}

function urgencyFor(dueDate: Date, now: Date): 'atrasado' | 'esta_semana' | 'em_breve' {
  const today = startOfDay(now);
  const due = startOfDay(dueDate);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'atrasado';
  if (diffDays <= 7) return 'esta_semana';
  return 'em_breve';
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly email: EmailService,
    private readonly events: EventsService,
  ) {}

  // ── Criação a partir de um registro de cuidado ──────────────────────────
  async createFromCareRecord(params: { userId: string; petId: string; type: string; dueDate: Date; sourceRecordId: string }) {
    return this.prisma.reminder.create({
      data: {
        userId: params.userId,
        petId: params.petId,
        type: params.type,
        dueDate: params.dueDate,
        sourceRecordId: params.sourceRecordId,
      },
    });
  }

  // Pesagem: sempre um único lembrete "vivo" por gato — a pesagem mais
  // recente cancela o anterior e agenda +N dias a partir de hoje.
  async rescheduleWeightReminder(userId: string, petId: string, fromDate: Date) {
    await this.prisma.reminder.updateMany({
      where: { userId, petId, type: 'WEIGHT', status: { in: ['pendente', 'adiado'] } },
      data: { status: 'cancelado' },
    });

    const days = await this.getWeightReminderDays();
    return this.prisma.reminder.create({
      data: {
        userId,
        petId,
        type: 'WEIGHT',
        dueDate: addDays(fromDate, days),
      },
    });
  }

  private async getWeightReminderDays(): Promise<number> {
    const row = await this.prisma.appSettings.findUnique({ where: { key: 'WEIGHT_REMINDER_DAYS' } });
    const n = row?.value ? parseInt(row.value, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : WEIGHT_REMINDER_DAYS;
  }

  // ── "Próximos cuidados" ─────────────────────────────────────────────────
  async upcomingForOwner(userId: string) {
    const now = brasiliaNow();
    const reminders = await this.prisma.reminder.findMany({
      where: { userId, status: { in: ['pendente', 'adiado'] } },
      orderBy: { dueDate: 'asc' },
      include: { pet: { select: { id: true, name: true, photoUrl: true } } },
    });

    const byPet = new Map<string, typeof reminders>();
    for (const r of reminders) {
      if (!byPet.has(r.petId)) byPet.set(r.petId, [] as any);
      byPet.get(r.petId)!.push(r);
    }

    const result: Record<string, any> = {};
    for (const [petId, items] of byPet) {
      result[petId] = items.slice(0, 3).map((r) => ({
        id: r.id,
        type: r.type,
        typeLabel: TYPE_LABEL[r.type] || r.type,
        dueDate: r.dueDate,
        urgency: urgencyFor(r.dueDate, now),
        catId: r.pet.id,
        catName: r.pet.name,
        catPhotoUrl: r.pet.photoUrl,
      }));
    }
    return result;
  }

  async complete(id: string, userId: string) {
    return this.prisma.reminder.updateMany({ where: { id, userId }, data: { status: 'feito' } });
  }

  async postpone(id: string, userId: string, days: number) {
    const reminder = await this.prisma.reminder.findFirst({ where: { id, userId } });
    if (!reminder) return null;
    return this.prisma.reminder.update({
      where: { id },
      data: { dueDate: addDays(reminder.dueDate, days), status: 'adiado' },
    });
  }

  // ── Envio diário (push) ──────────────────────────────────────────────────
  // Pensado pra ser chamado por um cron externo (mesmo padrão de
  // vaccine-check/protocol-check) — idealmente algumas vezes ao dia entre
  // 9h e 20h de Brasília, pra respeitar a preferência manhã/tarde do tutor.
  // Seguro de chamar mais de uma vez: cada lembrete só conta 1 aviso/dia.
  async runDailyPush() {
    const now = brasiliaNow();
    const hour = now.getUTCHours();
    if (hour < WINDOW_START_HOUR || hour >= WINDOW_END_HOUR) {
      return { skipped: true, reason: 'outside_window', hour };
    }

    const today = startOfDay(now);
    const tomorrowStart = addDays(today, 1);
    const vaccineWarnStart = addDays(today, VACCINE_ADVANCE_DAYS);
    const vaccineWarnEnd = addDays(today, VACCINE_ADVANCE_DAYS + 1);

    const candidates = await this.prisma.reminder.findMany({
      where: {
        status: { in: ['pendente', 'adiado'] },
        dueDate: { lt: vaccineWarnEnd },
      },
      include: {
        pet: { select: { id: true, name: true, gender: true } },
        user: { select: { id: true, remindersPushEnabled: true, reminderPreferredTime: true } },
      },
    });

    const preferredWindowOk = (pref: string) => (pref === 'AFTERNOON' ? hour >= 13 : hour < 13);

    const byUser = new Map<string, typeof candidates>();
    for (const r of candidates) {
      if (!r.user.remindersPushEnabled) continue;
      if (!preferredWindowOk(r.user.reminderPreferredTime)) continue;

      const isOverdue = r.dueDate < today;
      const isDueToday = r.dueDate >= today && r.dueDate < tomorrowStart;
      const isVaccineWarning = r.type === 'VACCINE' && r.dueDate >= vaccineWarnStart && r.dueDate < vaccineWarnEnd;

      let eligible = false;
      if (isOverdue) {
        if (r.notifyCount === 0) eligible = true;
        else if (r.notifyCount < OVERDUE_MAX_NOTIFICATIONS && r.notifiedAt) {
          const daysSince = (now.getTime() - r.notifiedAt.getTime()) / 86400000;
          eligible = daysSince >= OVERDUE_RENOTIFY_DAYS;
        }
      } else if (isDueToday || isVaccineWarning) {
        const alreadyToday = r.notifiedAt && startOfDay(r.notifiedAt).getTime() === today.getTime();
        eligible = !alreadyToday;
      }
      if (!eligible) continue;

      if (!byUser.has(r.userId)) byUser.set(r.userId, [] as any);
      byUser.get(r.userId)!.push(r);
    }

    let usersNotified = 0;
    for (const [userId, items] of byUser) {
      const phrases = items.map((r) => `${TYPE_LABEL[r.type] || r.type} ${genderArticle(r.pet.gender)} ${r.pet.name}`);
      const body =
        phrases.length === 1
          ? `Hoje é dia do ${phrases[0]} 🐾 Toque para marcar como feito.`
          : `Hoje: ${phrases.slice(0, -1).join(', ')} e ${phrases[phrases.length - 1]} 🐾`;

      const { sent } = await this.push.sendToUser(userId, {
        title: 'Gatedo',
        body,
        url: '/health?src=push_reminder',
      });
      if (sent === 0) continue;

      usersNotified++;
      for (const r of items) {
        const isOverdue = r.dueDate < today;
        await this.prisma.reminder.update({
          where: { id: r.id },
          data: isOverdue ? { notifiedAt: now, notifyCount: { increment: 1 } } : { notifiedAt: now },
        });
      }
      this.events.track({ name: 'reminder_sent', userId, props: { channel: 'push', count: items.length } }).catch(() => {});
    }

    return { usersNotified, candidatesChecked: candidates.length };
  }

  // ── E-mail semanal de reserva (segunda de manhã) ─────────────────────────
  async runWeeklyEmail() {
    const now = brasiliaNow();
    const today = startOfDay(now);
    const weekEnd = addDays(today, 7);

    const users = await this.prisma.user.findMany({
      where: { remindersEmailEnabled: true },
      select: { id: true, name: true, email: true },
    });

    let emailsSent = 0;
    for (const user of users) {
      const reminders = await this.prisma.reminder.findMany({
        where: {
          userId: user.id,
          status: { in: ['pendente', 'adiado'] },
          dueDate: { lt: weekEnd },
        },
        orderBy: { dueDate: 'asc' },
        include: { pet: { select: { name: true, gender: true } } },
      });
      if (reminders.length === 0) continue;

      const items = reminders.map((r) => ({
        label: `${TYPE_LABEL[r.type] || r.type} ${genderArticle(r.pet.gender)} ${r.pet.name}`,
        overdue: r.dueDate < today,
      }));

      await this.email.sendReminderDigest(user.email, user.name || 'Tutor', items).catch((err) => {
        this.logger.warn(`Falha ao enviar e-mail de lembrete pra ${user.email}: ${err?.message}`);
      });

      await this.prisma.user.update({ where: { id: user.id }, data: { lastReminderEmailAt: now } });
      this.events.track({ name: 'reminder_sent', userId: user.id, props: { channel: 'email', count: items.length } }).catch(() => {});
      emailsSent++;
    }

    return { emailsSent, usersChecked: users.length };
  }
}

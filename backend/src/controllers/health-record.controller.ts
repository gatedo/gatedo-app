import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationIntegration } from '../gamification/gamification.integration';
import { EventsService } from '../events/events.service';
import { WEIGHT_CHECKIN_TITLE_RE } from '../gamification/xp.config';
import { RemindersService } from '../reminders/reminders.service';

const CARE_LOGGED_TYPE_MAP: Record<string, string> = {
  VACCINE: 'vacina',
  VERMIFUGE: 'vermifugo',
  PARASITE: 'antipulgas',
  CONSULTATION: 'consulta',
  IACONSULT: 'consulta',
  MEDICATION: 'medicacao',
  MEDICINE: 'medicacao',
};

// Tipos de cuidado que geram lembrete pra próxima data (vermífugo,
// antipulgas, vacina, medicação contínua) — pesagem é tratada à parte,
// sempre reagendada a partir da pesagem mais recente.
const REMINDER_TYPE_MAP: Record<string, string> = {
  VACCINE: 'VACCINE',
  VERMIFUGE: 'VERMIFUGE',
  PARASITE: 'PARASITE',
  MEDICATION: 'MEDICATION',
  MEDICINE: 'MEDICATION',
};

function toNullableString(value: any): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function toNullableDate(value: any): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toBoolean(value: any, fallback = false): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'sim'].includes(normalized)) return true;
    if (['false', '0', 'no', 'nao', 'não'].includes(normalized)) return false;
  }
  return Boolean(value);
}

@Controller('health-records')
export class HealthRecordController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamif: GamificationIntegration,
    private readonly events: EventsService,
    private readonly reminders: RemindersService,
  ) {}

  // SALVAR NOVO REGISTRO (POST /health-records)
  @Post()
  async create(@Body() data: any) {
    try {
      if (!data?.petId) {
        throw new HttpException('Pet ID obrigatório', HttpStatus.BAD_REQUEST);
      }

      if (!data?.type) {
        throw new HttpException('Tipo obrigatório', HttpStatus.BAD_REQUEST);
      }

      if (!data?.title?.trim?.()) {
        throw new HttpException('Título obrigatório', HttpStatus.BAD_REQUEST);
      }

      if (!data?.date) {
        throw new HttpException('Data obrigatória', HttpStatus.BAD_REQUEST);
      }

     const record = await this.prisma.healthRecord.create({
  data: {
    petId: data.petId,
    type: data.type,
    title: data.title.trim(),
    date: new Date(data.date),

    nextDueDate: toNullableDate(data.nextDueDate),

    veterinarian: toNullableString(data.veterinarian),

    clinic: toNullableString(data.clinicName) || toNullableString(data.clinic),

    clinicName: toNullableString(data.clinicName),
    clinicPhone: toNullableString(data.clinicPhone),
    clinicAddress: toNullableString(data.clinicAddress),

    notes: toNullableString(data.notes),
    batchNumber: toNullableString(data.batchNumber),
    attachmentUrl: toNullableString(data.attachmentUrl),

    ongoing: toBoolean(data.ongoing, false),
    active: toBoolean(data.active, false),
    prescription: toBoolean(data.prescription, false),
    isControlled: toBoolean(data.isControlled, false),

    reason: toNullableString(data.reason),
    appointmentMode: toNullableString(data.appointmentMode),
    specialty: toNullableString(data.specialty),
    recommendedRecheck: toBoolean(data.recommendedRecheck, false),
    recheckDate: toNullableDate(data.recheckDate),
    prescriptionDocId: toNullableString(data.prescriptionDocId),
  },
});

      // Busca ownerId do pet e credita gamificação (fire-and-forget)
      this.prisma.pet
        .findUnique({ where: { id: data.petId }, select: { ownerId: true } })
        .then(async (pet) => {
          if (!pet?.ownerId) return;
          this.gamif.onHealthRecord(pet.ownerId, data.petId, data.type, data.title).catch(() => {});

          const isWeightCheckin = data.type === 'EXAM' && WEIGHT_CHECKIN_TITLE_RE.test(data.title || '');
          if (isWeightCheckin) {
            const priorCount = await this.prisma.healthRecord.count({
              where: {
                petId: data.petId,
                type: 'EXAM',
                title: { contains: 'check-in de peso', mode: 'insensitive' },
                id: { not: record.id },
              },
            });
            this.events.track({
              name: 'weight_logged',
              userId: pet.ownerId,
              props: { is_first: priorCount === 0 },
            }).catch(() => {});
            this.reminders.rescheduleWeightReminder(pet.ownerId, data.petId, record.date).catch(() => {});
          } else if (CARE_LOGGED_TYPE_MAP[data.type]) {
            this.events.track({
              name: 'care_logged',
              userId: pet.ownerId,
              props: { type: CARE_LOGGED_TYPE_MAP[data.type] },
            }).catch(() => {});

            const reminderType = REMINDER_TYPE_MAP[data.type];
            if (reminderType && record.nextDueDate) {
              this.reminders
                .createFromCareRecord({
                  userId: pet.ownerId,
                  petId: data.petId,
                  type: reminderType,
                  dueDate: record.nextDueDate,
                  sourceRecordId: record.id,
                })
                .catch(() => {});
            }
          }
        })
        .catch(() => {});

      return record;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      console.error('Erro ao salvar saúde:', error);
      throw new HttpException(
        'Erro ao salvar registro',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // BUSCAR REGISTROS (GET /health-records?petId=...)
  @Get()
  async findAll(@Query('petId') petId: string) {
    if (!petId) {
      throw new HttpException('Pet ID obrigatório', HttpStatus.BAD_REQUEST);
    }

    return await this.prisma.healthRecord.findMany({
      where: { petId },
      orderBy: { date: 'desc' },
    });
  }
}
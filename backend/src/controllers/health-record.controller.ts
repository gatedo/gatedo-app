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
        .then((pet) => {
          if (pet?.ownerId) {
            this.gamif.onHealthRecord(pet.ownerId, data.petId, data.type).catch(() => {});
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
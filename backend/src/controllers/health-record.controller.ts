import { Controller, Get, Post, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GamificationIntegration } from '../notifications/gamification.integration';

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
      const record = await this.prisma.healthRecord.create({
        data: {
          petId:        data.petId,
          type:         data.type,
          title:        data.title,
          date:         new Date(data.date),
          nextDueDate:  data.nextDueDate ? new Date(data.nextDueDate) : null,
          veterinarian: data.veterinarian,
          notes:        data.notes,
          batchNumber:  data.batchNumber,
          attachmentUrl: data.attachmentUrl,
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
      console.error('Erro ao salvar saúde:', error);
      throw new HttpException('Erro ao salvar registro', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // BUSCAR REGISTROS (GET /health-records?petId=...)
  @Get()
  async findAll(@Query('petId') petId: string) {
    if (!petId) throw new HttpException('Pet ID obrigatório', HttpStatus.BAD_REQUEST);
    
    return await this.prisma.healthRecord.findMany({
      where: { petId },
      orderBy: { date: 'desc' }
    });
  }
}
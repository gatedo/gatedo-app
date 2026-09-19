import { Controller, Get, Post, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ajuste o caminho
import { GamificationIntegration } from '../gamification/gamification.integration';

@Controller('diary-entries')
export class DiaryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamif: GamificationIntegration,
  ) {}

  // SALVAR DIÁRIO (POST /diary-entries)
  @Post()
  async create(@Body() data: any) {
    try {
      const entry = await this.prisma.diaryEntry.create({
        data: {
          petId: data.petId,
          title: data.title,
          content: data.content,
          type: data.type, // 'happy', 'lazy', etc.
          date: new Date(data.date),
          photos: data.photos || []
        },
      });

      this.prisma.pet
        .findUnique({ where: { id: data.petId }, select: { ownerId: true } })
        .then((pet) => {
          if (pet?.ownerId) {
            this.gamif.onDiaryEntry(pet.ownerId, data.petId).catch(() => {});
          }
        })
        .catch(() => {});

      return entry;
    } catch (error) {
      console.error("Erro ao salvar diário:", error);
      throw new HttpException('Erro ao salvar diário', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // LISTAR DIÁRIO (GET /diary-entries?petId=...)
  @Get()
  async findAll(@Query('petId') petId: string) {
    if (!petId) throw new HttpException('Pet ID obrigatório', HttpStatus.BAD_REQUEST);

    return await this.prisma.diaryEntry.findMany({
      where: { petId },
      orderBy: { date: 'desc' }
    });
  }
}
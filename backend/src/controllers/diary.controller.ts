import { Controller, Get, Post, Body, Query, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ajuste o caminho
import { GamificationIntegration } from '../gamification/gamification.integration';
import { EventsService } from '../events/events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { assertOwnsPet } from '../common/ownership.util';

@Controller('diary-entries')
@UseGuards(JwtAuthGuard)
export class DiaryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamif: GamificationIntegration,
    private readonly events: EventsService,
  ) {}

  // SALVAR DIÁRIO (POST /diary-entries)
  @Post()
  async create(@Req() req: any, @Body() data: any) {
    try {
      await assertOwnsPet(this.prisma, data.petId, req.user);
      const entry = await this.prisma.diaryEntry.create({
        data: {
          petId: data.petId,
          title: data.title,
          content: data.content,
          type: data.type, // 'happy', 'lazy', etc.
          date: new Date(data.date),
          photos: data.photos || [],
          occurrences: Array.isArray(data.occurrences) ? data.occurrences : [],
        },
      });

      this.prisma.pet
        .findUnique({ where: { id: data.petId }, select: { ownerId: true } })
        .then((pet) => {
          if (pet?.ownerId) {
            this.gamif.onDiaryEntry(pet.ownerId, data.petId).catch(() => {});
            this.events.track({ name: 'care_logged', userId: pet.ownerId, props: { type: 'diario' } }).catch(() => {});
          }
        })
        .catch(() => {});

      return entry;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error("Erro ao salvar diário:", error);
      throw new HttpException('Erro ao salvar diário', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // LISTAR DIÁRIO (GET /diary-entries?petId=...)
  @Get()
  async findAll(@Req() req: any, @Query('petId') petId: string) {
    if (!petId) throw new HttpException('Pet ID obrigatório', HttpStatus.BAD_REQUEST);
    await assertOwnsPet(this.prisma, petId, req.user);

    return await this.prisma.diaryEntry.findMany({
      where: { petId },
      orderBy: { date: 'desc' }
    });
  }
}

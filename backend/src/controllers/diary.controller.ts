import { Controller, Get, Post, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ajuste o caminho

@Controller('diary-entries')
export class DiaryController {
  constructor(private readonly prisma: PrismaService) {}

  // SALVAR DIÁRIO (POST /diary-entries)
  @Post()
  async create(@Body() data: any) {
    try {
      return await this.prisma.diaryEntry.create({
        data: {
          petId: data.petId,
          title: data.title,
          content: data.content,
          type: data.type, // 'happy', 'lazy', etc.
          date: new Date(data.date),
          photos: data.photos || []
        },
      });
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
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddXpDto } from './dto/add-xp.dto';

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async addXp(dto: AddXpDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: {
        id: true,
        role: true as any,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.role === 'ADMIN') {
      return {
        success: true,
        userId: user.id,
        amountAdded: dto.amount,
        reason: dto.reason,
        newXp: 999999,
        bypass: true,
      };
    }

    const currentTutorPoints = await this.prisma.tutorPoints.findUnique({
      where: { userId: dto.userId },
      select: {
        points: true,
        totalEarned: true,
        lastActionAt: true,
      },
    });

    const updatedTutorPoints = await this.prisma.tutorPoints.upsert({
      where: { userId: dto.userId },
      update: {
        points: (currentTutorPoints?.points ?? 0) + Number(dto.amount),
        totalEarned: (currentTutorPoints?.totalEarned ?? 0) + Number(dto.amount),
        lastActionAt: new Date(),
      },
      create: {
        userId: dto.userId,
        points: Number(dto.amount),
        totalEarned: Number(dto.amount),
        lastActionAt: new Date(),
      },
      select: {
        userId: true,
        points: true,
        totalEarned: true,
        lastActionAt: true,
      },
    });

    return {
      success: true,
      userId: dto.userId,
      amountAdded: Number(dto.amount),
      reason: dto.reason,
      newXp: updatedTutorPoints.totalEarned,
      tutorPoints: updatedTutorPoints,
    };
  }
}
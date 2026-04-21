import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Req,
  Param,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { GamificationService } from './gamification.service';
import { AddXpDto } from './dto/add-xp.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { calcTutorLevelMeta } from './gamification.constants';

@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly gamificationService: GamificationService,
  ) {}

  @Get('me')
  async getMyGamification(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.gamificationService.getMyGamification(userId);
  }

  @Get('points/:userId')
  async getPoints(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId obrigatório');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        xpt: true,
        gatedoPoints: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    if (user.role === 'ADMIN') {
      return {
        xpt: 999999,
        gpts: 999999,
        level: 20,
      };
    }

    return {
      xpt: user.xpt ?? 0,
      gpts: user.gatedoPoints ?? 0,
      level: calcTutorLevelMeta(user.xpt ?? 0).rank,
    };
  }

  @Get('stats/:userId')
  async getStats(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId obrigatório');
    }

    return this.notificationService.getStats(userId);
  }

  @Patch()
  async updateGamification(
    @Req() req: any,
    @Body()
    body: {
      xpt?: number;
      gpts?: number;
      badges?: string[];
      streak?: number;
    },
  ) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException('Usuário não autenticado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        badges: true,
        role: true,
        xpt: true,
        gatedoPoints: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    if (user.role === 'ADMIN') {
      if (body.badges !== undefined) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { badges: body.badges },
        });
      }

      return {
        xpt: 999999,
        gpts: 999999,
        level: 20,
        levelMeta: calcTutorLevelMeta(999999),
        badges: body.badges ?? user.badges ?? [],
        streak: body.streak ?? 999,
      };
    }

    const updateData: any = {};

    if (body.badges !== undefined) {
      updateData.badges = body.badges;
    }

    if (body.xpt !== undefined) {
      updateData.xpt = Math.max(0, Number(body.xpt || 0));
      updateData.level = calcTutorLevelMeta(updateData.xpt).rank;
    }

    if (body.gpts !== undefined) {
      updateData.gatedoPoints = Math.max(0, Number(body.gpts || 0));
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    const refreshedUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        xpt: true,
        gatedoPoints: true,
        badges: true,
      },
    });

    const xpt = refreshedUser?.xpt ?? 0;
    const gpts = refreshedUser?.gatedoPoints ?? 0;
    const levelMeta = calcTutorLevelMeta(xpt);

    return {
      xpt,
      gpts,
      level: levelMeta.rank,
      levelMeta,
      badges: refreshedUser?.badges ?? [],
      streak: body.streak ?? 0,
    };
  }

  @Post('spend')
  async spendPoints(
    @Req() req: any,
    @Body() body: { amount: number },
  ) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException('Usuário não autenticado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        gatedoPoints: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    if (user.role === 'ADMIN') {
      return {
        success: true,
        gpts: 999999,
        spent: 0,
        bypass: true,
      };
    }

    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException('amount inválido');
    }

    const currentBalance = user.gatedoPoints ?? 0;

    if (currentBalance < body.amount) {
      throw new BadRequestException('Saldo insuficiente');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        gatedoPoints: currentBalance - body.amount,
      },
      select: {
        gatedoPoints: true,
      },
    });

    await this.prisma.rewardEvent.create({
      data: {
        userId,
        action: 'POINTS_SPENT_DIRECT',
        gptsDelta: -body.amount,
        metadata: {
          reason: 'POINTS_SPENT_DIRECT',
        },
      },
    });

    return {
      success: true,
      gpts: updatedUser.gatedoPoints,
      spent: body.amount,
    };
  }

  @Post('xp/add')
  async addXp(
    @Req() req: any,
    @Body() dto: AddXpDto,
  ) {
    const actorUserId = req.user?.id || req.user?.sub || null;

    if (!dto?.userId) {
      throw new BadRequestException('userId obrigatório');
    }

    if (!dto?.amount || Number(dto.amount) <= 0) {
      throw new BadRequestException('amount inválido');
    }

    if (!dto?.reason?.trim()) {
      throw new BadRequestException('reason obrigatório');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!targetUser) {
      throw new BadRequestException('Usuário alvo não encontrado');
    }

    if (targetUser.role === 'ADMIN') {
      return {
        success: true,
        userId: targetUser.id,
        amountAdded: Number(dto.amount),
        reason: dto.reason.trim(),
        newXp: 999999,
        bypass: true,
        actorUserId,
      };
    }

    const result = await this.gamificationService.addXp({
      userId: dto.userId,
      amount: Number(dto.amount),
      reason: dto.reason.trim(),
    });

    return {
      ...result,
      actorUserId,
    };
  }

  @Post('award-care')
  async awardCare(
    @Req() req: any,
    @Body()
    body: {
      userId: string;
      petId: string;
      tutorXp?: number;
      petXp?: number;
      reason: string;
      meta?: Record<string, any>;
    },
  ) {
    const actorUserId = req.user?.id || req.user?.sub || null;

    if (!body?.userId) {
      throw new BadRequestException('userId obrigatório');
    }

    if (!body?.petId) {
      throw new BadRequestException('petId obrigatório');
    }

    if (!body?.reason?.trim()) {
      throw new BadRequestException('reason obrigatório');
    }

    const tutorXp = Number(body?.tutorXp ?? 0);
    const petXp = Number(body?.petXp ?? 0);

    if (tutorXp <= 0 && petXp <= 0) {
      throw new BadRequestException('É necessário informar tutorXp ou petXp');
    }

    const result = await this.gamificationService.awardCare({
      userId: body.userId,
      petId: body.petId,
      tutorXp,
      petXp,
      reason: body.reason.trim(),
      meta: body.meta ?? {},
    });

    return {
      ...result,
      actorUserId,
    };
  }
}
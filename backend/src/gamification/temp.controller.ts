import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Req,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { GamificationService } from './gamification.service';
import { AddXpDto } from './dto/add-xp.dto';

@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly gamificationService: GamificationService,
  ) {}

  // ── GET /gamification/me ────────────────────────────────────────────────
  @Get('me')
  async getMyGamification(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      return this.buildDefaultResponse();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        badges: true,
        email: true,
        role: true as any,
      },
    });

    if (!user) {
      return this.buildDefaultResponse();
    }

    const isAdmin = user?.role === 'ADMIN';

    if (isAdmin) {
      return this.buildAdminResponse(user.badges || []);
    }

    let tutorPoints = await this.prisma.tutorPoints.findUnique({
      where: { userId },
      select: {
        points: true,
        totalEarned: true,
        lastActionAt: true,
      },
    });

    if (!tutorPoints) {
      tutorPoints = await this.prisma.tutorPoints.create({
        data: {
          userId,
          points: 0,
          totalEarned: 0,
          lastActionAt: new Date(),
        },
        select: {
          points: true,
          totalEarned: true,
          lastActionAt: true,
        },
      });
    }

    let userCredits = await this.prisma.userCredits.findUnique({
      where: { userId },
      select: {
        balance: true,
        totalBought: true,
        totalUsed: true,
      },
    });

    if (!userCredits) {
      userCredits = await this.prisma.userCredits.create({
        data: {
          userId,
          balance: 300,
          totalBought: 300,
          totalUsed: 0,
        },
        select: {
          balance: true,
          totalBought: true,
          totalUsed: true,
        },
      });
    }

    const xp = tutorPoints?.totalEarned ?? 0;
    const points = userCredits?.balance ?? 0;
    const balance = userCredits?.balance ?? 0;
    const level = calcLevel(xp);

    const diaryDates = await this.prisma.diaryEntry.findMany({
      where: { pet: { ownerId: userId } },
      select: { date: true },
      orderBy: { date: 'desc' },
      take: 60,
    });

    const uniqueDays = [...new Set(diaryDates.map((d) => d.date.toDateString()))]
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    let expected = new Date();
    expected.setHours(0, 0, 0, 0);

    for (const ds of uniqueDays) {
      const d = new Date(ds);
      const diff = Math.round((expected.getTime() - d.getTime()) / 86400000);
      if (diff <= 1) {
        streak++;
        expected = d;
      } else {
        break;
      }
    }

    const [consultCount, studioCount, petCount, postCount] = await Promise.all([
      this.prisma.igentSession.count({ where: { pet: { ownerId: userId } } }),
      this.prisma.studioCreation.count({ where: { userId } }),
      this.prisma.pet.count({ where: { ownerId: userId } }),
      this.prisma.post.count({ where: { userId } }),
    ]);

    return {
      xp,
      totalEarned: tutorPoints?.totalEarned ?? 0,

      points,
      balance,

      level,
      badges: user.badges || [],
      streak,

      tutorPoints: {
        points: tutorPoints?.points ?? 0,
        totalEarned: tutorPoints?.totalEarned ?? 0,
        lastActionAt: tutorPoints?.lastActionAt ?? null,
      },

      userCredits: {
        balance: userCredits?.balance ?? 0,
        totalBought: userCredits?.totalBought ?? 0,
        totalUsed: userCredits?.totalUsed ?? 0,
      },

      stats: {
        consultCount,
        studioCount,
        petCount,
        postCount,
        diaryCount: diaryDates.length,
        xp,
        points,
        totalEarned: tutorPoints?.totalEarned ?? 0,
        walletBalance: userCredits?.balance ?? 0,
      },
    };
  }

  // ── GET /gamification/points/:userId ────────────────────────────────────
  @Get('points/:userId')
  async getPoints(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId obrigatório');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true as any,
      },
    });

    if (user?.role === 'ADMIN') {
      return {
        xp: 999999,
        totalEarned: 999999,
        earnedPoints: 999999,
        points: 999999,
        balance: 999999,
        walletBalance: 999999,
        userCredits: {
          balance: 999999,
          totalBought: 999999,
          totalUsed: 0,
        },
      };
    }

    const [tp, credits] = await Promise.all([
      this.prisma.tutorPoints.findUnique({
        where: { userId },
        select: { points: true, totalEarned: true },
      }),
      this.prisma.userCredits.findUnique({
        where: { userId },
        select: { balance: true, totalBought: true, totalUsed: true },
      }),
    ]);

    return {
      xp: tp?.totalEarned ?? 0,
      totalEarned: tp?.totalEarned ?? 0,
      earnedPoints: tp?.points ?? 0,
      points: credits?.balance ?? 0,
      balance: credits?.balance ?? 0,
      walletBalance: credits?.balance ?? 0,
      userCredits: {
        balance: credits?.balance ?? 0,
        totalBought: credits?.totalBought ?? 0,
        totalUsed: credits?.totalUsed ?? 0,
      },
    };
  }

  // ── GET /gamification/stats/:userId ─────────────────────────────────────
  @Get('stats/:userId')
  async getStats(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId obrigatório');
    }

    return this.notificationService.getStats(userId);
  }

  // ── PATCH /gamification ─────────────────────────────────────────────────
  @Patch()
  async updateGamification(
    @Req() req: any,
    @Body() body: { xp?: number; points?: number; badges?: string[]; streak?: number },
  ) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException('Usuário não autenticado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        badges: true,
        role: true as any,
      },
    });

    if (user?.role === 'ADMIN') {
      if (body.badges !== undefined) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { badges: body.badges },
        });
      }

      return this.buildAdminResponse(body.badges ?? user?.badges ?? []);
    }

    if (body.badges !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { badges: body.badges },
      });
    }

    if (body.xp !== undefined) {
      const currentTutor = await this.prisma.tutorPoints.findUnique({
        where: { userId },
        select: { points: true, totalEarned: true },
      });

      const nextXp = Math.max(0, Number(body.xp || 0));
      const currentXp = currentTutor?.totalEarned ?? 0;
      const deltaXp = Math.max(0, nextXp - currentXp);

      await this.prisma.tutorPoints.upsert({
        where: { userId },
        update: {
          totalEarned: nextXp,
          points: (currentTutor?.points ?? 0) + deltaXp,
          lastActionAt: new Date(),
        },
        create: {
          userId,
          points: nextXp,
          totalEarned: nextXp,
          lastActionAt: new Date(),
        },
      });
    }

    if (body.points !== undefined) {
      const nextBalance = Math.max(0, Number(body.points || 0));
      const currentCredits = await this.prisma.userCredits.findUnique({
        where: { userId },
        select: { balance: true, totalBought: true, totalUsed: true },
      });

      const prevBalance = currentCredits?.balance ?? 0;
      const deltaPositive = Math.max(0, nextBalance - prevBalance);
      const deltaNegative = Math.max(0, prevBalance - nextBalance);

      await this.prisma.userCredits.upsert({
        where: { userId },
        update: {
          balance: nextBalance,
          totalBought: (currentCredits?.totalBought ?? 0) + deltaPositive,
          totalUsed: (currentCredits?.totalUsed ?? 0) + deltaNegative,
        },
        create: {
          userId,
          balance: nextBalance,
          totalBought: nextBalance,
          totalUsed: 0,
        },
      });
    }

    const [tp, credits, refreshedUser] = await Promise.all([
      this.prisma.tutorPoints.findUnique({
        where: { userId },
        select: { points: true, totalEarned: true },
      }),
      this.prisma.userCredits.findUnique({
        where: { userId },
        select: { balance: true, totalBought: true, totalUsed: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { badges: true },
      }),
    ]);

    const xp = tp?.totalEarned ?? 0;
    const points = credits?.balance ?? 0;

    return {
      xp,
      totalEarned: xp,
      points,
      balance: points,
      level: calcLevel(xp),
      badges: refreshedUser?.badges ?? body.badges ?? [],
      streak: body.streak ?? 0,
      tutorPoints: tp,
      userCredits: credits,
    };
  }

  // ── POST /gamification/spend ────────────────────────────────────────────
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
      select: { role: true as any },
    });

    if (user?.role === 'ADMIN') {
      return {
        success: true,
        balance: 999999,
        points: 999999,
        spent: 0,
        bypass: true,
      };
    }

    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException('amount inválido');
    }

    const current = await this.prisma.userCredits.findUnique({
      where: { userId },
      select: { balance: true, totalBought: true, totalUsed: true },
    });

    const balance = current?.balance ?? 0;

    if (balance < body.amount) {
      throw new BadRequestException('Saldo insuficiente');
    }

    const updated = await this.prisma.userCredits.upsert({
      where: { userId },
      update: {
        balance: balance - body.amount,
        totalUsed: (current?.totalUsed ?? 0) + body.amount,
      },
      create: {
        userId,
        balance: 0,
        totalBought: 0,
        totalUsed: body.amount,
      },
    });

    return {
      success: true,
      balance: updated.balance,
      points: updated.balance,
      spent: body.amount,
    };
  }

  // ── POST /gamification/xp/add ───────────────────────────────────────────
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
        role: true as any,
      },
    });

    if (!targetUser) {
      throw new BadRequestException('Usuário alvo não encontrado');
    }

    // Admin segue infinito e não precisa persistir XP real
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

  private buildDefaultResponse() {
    return {
      xp: 0,
      totalEarned: 0,
      points: 0,
      balance: 0,
      level: 1,
      badges: [],
      streak: 0,
      stats: {},
      tutorPoints: { points: 0, totalEarned: 0 },
      userCredits: { balance: 0, totalBought: 0, totalUsed: 0 },
    };
  }

  private buildAdminResponse(badges: string[] = []) {
    return {
      xp: 999999,
      totalEarned: 999999,

      points: 999999,
      balance: 999999,

      level: calcLevel(999999),
      badges,
      streak: 999,

      tutorPoints: {
        points: 999999,
        totalEarned: 999999,
        lastActionAt: new Date(),
      },

      userCredits: {
        balance: 999999,
        totalBought: 999999,
        totalUsed: 0,
      },

      stats: {
        consultCount: 999,
        studioCount: 999,
        petCount: 999,
        postCount: 999,
        diaryCount: 999,
        xp: 999999,
        points: 999999,
        totalEarned: 999999,
        walletBalance: 999999,
      },
    };
  }
}

function calcLevel(xp: number): number {
  const LEVELS = [
    { rank: 1, min: 0, max: 149 },
    { rank: 2, min: 150, max: 399 },
    { rank: 3, min: 400, max: 799 },
    { rank: 4, min: 800, max: 1499 },
    { rank: 5, min: 1500, max: 2999 },
    { rank: 6, min: 3000, max: 999999 },
  ];

  return LEVELS.find((l) => xp >= l.min && xp <= l.max)?.rank ?? 1;
}
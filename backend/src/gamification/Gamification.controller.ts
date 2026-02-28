/**
 * gamification.controller.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoints de gamificação do usuário.
 * Coloque este arquivo em: src/gamification/gamification.controller.ts
 *
 * IMPORTANTE: registrar no AppModule ou criar GamificationModule.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Controller, Get, Patch, Body, Req } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// TODO: adicionar @UseGuards(JwtAuthGuard) quando confirmar o caminho correto do guard
@Controller('gamification')
export class GamificationController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /gamification/me
   * Retorna XP, badges e streak do usuário logado.
   */
  @Get('me')
  async getMyGamification(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, badges: true, level: true },
    });

    if (!user) return { xp: 0, badges: [], streak: 0, stats: {} };

    // Busca TutorPoints para streak
    const tutorPoints = await this.prisma.tutorPoints.findUnique({
      where: { userId },
      select: { points: true, totalEarned: true, lastActionAt: true },
    });

    // Calcula streak baseado em DiaryEntries
    const diaryDates = await this.prisma.diaryEntry.findMany({
      where: { pet: { ownerId: userId } },
      select: { date: true },
      orderBy: { date: 'desc' },
      take: 60,
    });

    const uniqueDays = [...new Set(diaryDates.map(d => d.date.toDateString()))]
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    let expected = new Date();
    expected.setHours(0, 0, 0, 0);
    for (const ds of uniqueDays) {
      const d = new Date(ds);
      const diff = Math.round((expected.getTime() - d.getTime()) / 86400000);
      if (diff <= 1) { streak++; expected = d; }
      else break;
    }

    // Stats agregados
    const [consultCount, studioCount, petCount] = await Promise.all([
      this.prisma.igentSession.count({ where: { pet: { ownerId: userId } } }),
      this.prisma.studioCreation.count({ where: { userId } }),
      this.prisma.pet.count({ where: { ownerId: userId } }),
    ]);

    return {
      xp:     user.xp,
      level:  user.level,
      badges: user.badges,
      streak,
      stats: {
        consultCount,
        studioCount,
        petCount,
        diaryCount: diaryDates.length,
        points:      tutorPoints?.points ?? 0,
        totalEarned: tutorPoints?.totalEarned ?? 0,
      },
    };
  }

  /**
   * PATCH /gamification
   * Atualiza XP e badges do usuário logado.
   */
  @Patch()
  async updateGamification(
    @Req() req: any,
    @Body() body: { xp?: number; badges?: string[]; streak?: number },
  ) {
    const userId = req.user?.id || req.user?.sub;

    const updateData: any = {};
    if (body.xp !== undefined)     updateData.xp = body.xp;
    if (body.badges !== undefined)  updateData.badges = body.badges;
    if (body.xp !== undefined) {
      // Recalcula o level baseado no XP
      const LEVELS = [
        { rank: 1, min: 0,    max: 149   },
        { rank: 2, min: 150,  max: 399   },
        { rank: 3, min: 400,  max: 799   },
        { rank: 4, min: 800,  max: 1499  },
        { rank: 5, min: 1500, max: 2999  },
        { rank: 6, min: 3000, max: 999999},
      ];
      const level = LEVELS.find(l => body.xp >= l.min && body.xp <= l.max)?.rank ?? 1;
      updateData.level = level;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { xp: true, level: true, badges: true },
    });

    // Atualiza TutorPoints também
    if (body.xp !== undefined) {
      await this.prisma.tutorPoints.upsert({
        where: { userId },
        update: { points: body.xp, lastActionAt: new Date() },
        create: { userId, points: body.xp, totalEarned: body.xp },
      });
    }

    return updated;
  }
}
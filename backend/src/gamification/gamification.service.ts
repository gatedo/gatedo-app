import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddXpDto } from './dto/add-xp.dto';
import {
  SPECIAL_TIERS,
  calcTutorLevelMeta,
  calcCatLevelMeta,
} from './gamification.constants';
import { canBypassPlanCosts } from '../membership/membership.constants';

@Injectable()
export class GamificationService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async addXp(dto: AddXpDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: {
        id: true,
        role: true,
        plan: true,
        badges: true,
        xpt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isBypassUser = canBypassPlanCosts(user);

    if (isBypassUser) {
      return {
        success: true,
        userId: user.id,
        amountAdded: dto.amount,
        reason: dto.reason,
        newXp: 999999,
        bypass: true,
        tier: user.plan ?? user.role,
      };
    }

    const nextXp = (user.xpt ?? 0) + dto.amount;

    const updatedUser = await this.prisma.user.update({
      where: { id: dto.userId },
      data: {
        xpt: nextXp,
        level: calcTutorLevelMeta(nextXp).rank,
      },
      select: {
        id: true,
        xpt: true,
      },
    });

    await this.prisma.rewardEvent.create({
      data: {
        userId: dto.userId,
        action: 'MANUAL_XP_ADJUST',
        xptDelta: dto.amount,
        metadata: {
          reason: dto.reason,
        },
      },
    });

    return {
      success: true,
      userId: dto.userId,
      amountAdded: dto.amount,
      reason: dto.reason,
      newXp: updatedUser.xpt,
      bypass: false,
    };
  }

  async awardCare(params: {
    userId: string;
    petId: string;
    tutorXp: number;
    petXp: number;
    reason: string;
    meta?: Record<string, any>;
  }) {
    const tutorXp = Math.max(0, Number(params.tutorXp || 0));
    const petXp = Math.max(0, Number(params.petXp || 0));

    if (!params.userId) {
      throw new NotFoundException('Usuário não informado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        role: true,
        plan: true,
        badges: true,
        xpt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const pet = await this.prisma.pet.findUnique({
      where: { id: params.petId },
      select: {
        id: true,
        ownerId: true,
        xpg: true,
        level: true,
        name: true,
      },
    });

    if (!pet) {
      throw new NotFoundException('Gato não encontrado');
    }

    if (pet.ownerId !== params.userId) {
      throw new NotFoundException('O gato não pertence ao usuário informado');
    }

    const isBypassUser = canBypassPlanCosts(user);

    if (isBypassUser) {
      return {
        success: true,
        userId: user.id,
        petId: pet.id,
        tutorXpAdded: tutorXp,
        petXpAdded: petXp,
        tutorXpTotal: 999999,
        petXpTotal: 999999,
        tutorLevel: 20,
        petLevel: 20,
        bypass: true,
        reason: params.reason,
      };
    }

    const nextTutorXp = (user.xpt ?? 0) + tutorXp;
    const nextPetXp = (pet.xpg ?? 0) + petXp;

    const tutorLevelMeta = calcTutorLevelMeta(nextTutorXp);
    const petLevelMeta = calcCatLevelMeta(nextPetXp);

    const [updatedUser, updatedPet] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          xpt: nextTutorXp,
          level: tutorLevelMeta.rank,
        },
        select: {
          id: true,
          xpt: true,
          level: true,
        },
      }),
      this.prisma.pet.update({
        where: { id: pet.id },
        data: {
          xpg: nextPetXp,
          level: petLevelMeta.rank,
        },
        select: {
          id: true,
          xpg: true,
          level: true,
        },
      }),
    ]);

    await this.prisma.rewardEvent.create({
      data: {
        userId: user.id,
        petId: pet.id,
        action: params.reason,
        xptDelta: tutorXp,
        xpgDelta: petXp,
        metadata: params.meta ?? {},
      },
    });

    return {
      success: true,
      userId: updatedUser.id,
      petId: updatedPet.id,
      tutorXpAdded: tutorXp,
      petXpAdded: petXp,
      tutorXpTotal: updatedUser.xpt,
      petXpTotal: updatedPet.xpg,
      tutorLevel: updatedUser.level,
      petLevel: updatedPet.level,
      tutorLevelMeta,
      petLevelMeta,
      bypass: false,
      reason: params.reason,
    };
  }

  async getMyGamification(userId?: string | null) {
    if (!userId) {
      return this.buildDefaultResponse();
    }

    let user = await this.getFullUser(userId);

    if (!user) {
      return this.buildDefaultResponse();
    }

    if (user.role === 'ADMIN') {
      return this.buildAdminResponse(user.badges || []);
    }

    user = await this.applySpecialTierUnlockIfNeeded(user);

    const xpt = user.xpt ?? 0;
    const gpts = user.gatedoPoints ?? 0;
    const tutorLevelMeta = calcTutorLevelMeta(xpt);

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
      tutor: {
        id: user.id,
        name: user.name,
        xpt,
        gpts,
        level: tutorLevelMeta.rank,
        levelMeta: tutorLevelMeta,
        badges: Array.isArray(user.badges) ? user.badges : [],
        achievements: user.achievements.map((item) => ({
          id: item.achievement.id,
          code: item.achievement.code,
          title: item.achievement.title,
          description: item.achievement.description,
          rarity: item.achievement.rarity,
          category: item.achievement.category,
          unlockedAt: item.unlockedAt,
        })),
      },

      cats: user.pets.map((pet) => {
        const catLevelMeta = calcCatLevelMeta(pet.xpg ?? 0);

        return {
          id: pet.id,
          name: pet.name,
          photoUrl: pet.photoUrl,
          xpg: pet.xpg ?? 0,
          level: catLevelMeta.rank,
          levelMeta: catLevelMeta,
          badges: pet.badges || [],
          achievements: pet.achievements.map((item) => ({
            id: item.achievement.id,
            code: item.achievement.code,
            title: item.achievement.title,
            description: item.achievement.description,
            rarity: item.achievement.rarity,
            category: item.achievement.category,
            unlockedAt: item.unlockedAt,
          })),
        };
      }),

      streak,

      recentEvents: user.rewardEvents.map((event) => ({
        id: event.id,
        action: event.action,
        gptsDelta: event.gptsDelta,
        xptDelta: event.xptDelta,
        xpgDelta: event.xpgDelta,
        petId: event.petId,
        badgeGranted: event.badgeGranted,
        createdAt: event.createdAt,
        metadata: event.metadata,
      })),

      stats: {
        consultCount,
        studioCount,
        petCount,
        postCount,
        diaryCount: diaryDates.length,
        xpt,
        gpts,
      },
    };
  }

  private async applySpecialTierUnlockIfNeeded(user: any) {
    const badges = Array.isArray(user.badges) ? user.badges : [];
    const tierEntries = Object.values(SPECIAL_TIERS);

    for (const tier of tierEntries) {
      const userPlan = String(user.plan ?? '');

      const matchesTier =
        tier.matchPlans.some((plan) => plan === userPlan) ||
        tier.matchBadges.some((badge) => badges.includes(badge));

      if (!matchesTier) continue;

      const alreadyCredited = user.rewardEvents.some(
        (event: any) => event.action === tier.unlockAction,
      );

      if (alreadyCredited) continue;

      const nextBadges = badges.includes(tier.badgeGranted)
        ? badges
        : [...badges, tier.badgeGranted];

      const nextXpt = (user.xpt ?? 0) + tier.xpt;
      const nextGpts = (user.gatedoPoints ?? 0) + tier.gpts;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          xpt: nextXpt,
          gatedoPoints: nextGpts,
          level: calcTutorLevelMeta(nextXpt).rank,
          badges: nextBadges,
        },
      });

      await this.prisma.rewardEvent.create({
        data: {
          userId: user.id,
          action: tier.unlockAction,
          xptDelta: tier.xpt,
          gptsDelta: tier.gpts,
          badgeGranted: tier.badgeGranted,
          metadata: {
            source: tier.source,
          },
        },
      });

      user = await this.getFullUser(user.id);
      if (!user) {
        throw new NotFoundException('Usuário não encontrado após aplicar tier');
      }
    }

    return user;
  }

  private async getFullUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: {
          include: {
            achievement: true,
          },
          orderBy: { unlockedAt: 'desc' },
        },
        pets: {
          include: {
            achievements: {
              include: {
                achievement: true,
              },
              orderBy: { unlockedAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        rewardEvents: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  private buildDefaultResponse() {
    return {
      tutor: {
        xpt: 0,
        gpts: 0,
        level: 1,
        levelMeta: calcTutorLevelMeta(0),
        badges: [],
        achievements: [],
      },
      cats: [],
      streak: 0,
      recentEvents: [],
      stats: {
        consultCount: 0,
        studioCount: 0,
        petCount: 0,
        postCount: 0,
        diaryCount: 0,
        xpt: 0,
        gpts: 0,
      },
    };
  }

  private buildAdminResponse(badges: string[] = []) {
    return {
      tutor: {
        xpt: 999999,
        gpts: 999999,
        level: 20,
        levelMeta: calcTutorLevelMeta(999999),
        badges,
        achievements: [],
      },
      cats: [],
      streak: 999,
      recentEvents: [],
      stats: {
        consultCount: 999,
        studioCount: 999,
        petCount: 999,
        postCount: 999,
        diaryCount: 999,
        xpt: 999999,
        gpts: 999999,
      },
    };
  }
}

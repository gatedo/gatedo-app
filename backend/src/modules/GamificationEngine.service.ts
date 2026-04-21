import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RewardMatrix, RewardAction } from "../gamification/RewardMatrix";
import { getTutorLevelFromXpt, getCatLevelFromXpg } from "../gamification/level.utils";

@Injectable()
export class GamificationEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async applyReward(
    action: RewardAction,
    userId: string,
    petId?: string | null,
    metadata?: Record<string, any>,
  ) {
    const reward = RewardMatrix[action];

    if (!reward) {
      throw new BadRequestException(`Reward action not found: ${action}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          gatedoPoints: true,
          xpt: true,
          level: true,
        },
      });

      if (!user) {
        throw new BadRequestException("User not found");
      }

      if (reward.gpts < 0 && user.gatedoPoints < Math.abs(reward.gpts)) {
        throw new BadRequestException("Insufficient GATEDO Points");
      }

      let pet = null;

      if (petId) {
        pet = await tx.pet.findUnique({
          where: { id: petId },
          select: {
            id: true,
            xpg: true,
            level: true,
            ownerId: true,
            name: true,
          },
        });

        if (!pet) {
          throw new BadRequestException("Pet not found");
        }

        if (pet.ownerId !== userId) {
          throw new BadRequestException("Pet does not belong to user");
        }
      }

      const nextUserXpt = user.xpt + reward.xpt;
      const nextUserGpts = user.gatedoPoints + reward.gpts;
      const nextUserLevel = getTutorLevelFromXpt(nextUserXpt);

      await tx.user.update({
        where: { id: userId },
        data: {
          xpt: nextUserXpt,
          gatedoPoints: nextUserGpts,
          level: nextUserLevel,
        },
      });

      let nextPetState = null;

      if (pet && reward.xpg !== 0) {
        const nextPetXpg = pet.xpg + reward.xpg;
        const nextPetLevel = getCatLevelFromXpg(nextPetXpg);

        nextPetState = await tx.pet.update({
          where: { id: pet.id },
          data: {
            xpg: nextPetXpg,
            level: nextPetLevel,
          },
          select: {
            id: true,
            name: true,
            xpg: true,
            level: true,
          },
        });
      }

    const event = await tx.rewardEvent.create({
  data: {
    userId,
    petId: petId ?? null,
    action,
    gptsDelta: reward.gpts,
    xptDelta: reward.xpt,
    xpgDelta: reward.xpg,
    badgeGranted: 'badge' in reward ? reward.badge : null,
    metadata: metadata ?? undefined,
  },
});

      return {
        event,
        tutor: {
          id: userId,
          gpts: nextUserGpts,
          xpt: nextUserXpt,
          level: nextUserLevel,
        },
        pet: nextPetState,
      };
    });
  }
}
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

const CAT_XP = {
  IGENT_CONSULT: 10,
  VACCINE: 5,
  MEDICATION: 5,
  MEDICINE: 5,
  VERMIFUGE: 4,
  PARASITE: 4,
  EXAM: 3,
  SURGERY: 3,
  HEALTH_RECORD: 2,
  DIARY_ENTRY: 1,

  STUDIO_CREATION: 6,
  STUDIO_STYLE: 8,
  STUDIO_MIND: 7,
  STUDIO_DANCE: 10,
  STUDIO_TUTOR_CAT: 8,
};

const CAT_LEVELS = [
  { min: 0, level: 1, label: 'Filhote' },
  { min: 50, level: 2, label: 'Explorador' },
  { min: 150, level: 3, label: 'Aventureiro' },
  { min: 300, level: 4, label: 'Veterano' },
  { min: 500, level: 5, label: 'Lendário' },
];

function getCatLevel(xp: number) {
  for (let i = CAT_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= CAT_LEVELS[i].min) return CAT_LEVELS[i];
  }
  return CAT_LEVELS[0];
}

const TUTOR_POINTS = {
  IGENT_CONSULT: 10,
  FIRST_CONSULT: 30,
  VACCINE_REGISTERED: 5,
  MED_REGISTERED: 5,
  HEALTH_RECORD: 3,
  COMMUNITY_POST: 15,
  COMMUNITY_IGENT_TIP: 20,
  PROFILE_COMPLETE: 25,
  MEMORIAL_REGISTERED: 15,

  STUDIO_CREATION: 8,
  STUDIO_STYLE: 10,
  STUDIO_MIND: 12,
  STUDIO_DANCE: 15,
  STUDIO_TUTOR_CAT: 12,
};

type TutorAction = keyof typeof TUTOR_POINTS;
type CatAction = keyof typeof CAT_XP;

@Injectable()
export class GamificationIntegration {
  constructor(
    private prisma: PrismaService,
    private notifService: NotificationService,
  ) {}

  async credit(data: {
    userId: string;
    petId?: string;
    action: TutorAction;
    catXpAction?: CatAction;
  }) {
    const tutorResult = await this._creditTutor(data.userId, data.action);
    const catResult = data.petId
      ? await this._creditCat(data.petId, data.catXpAction || 'HEALTH_RECORD')
      : null;

    return { tutor: tutorResult, cat: catResult };
  }

  async spendPoints(userId: string, amount: number) {
    if (!amount || amount <= 0) {
      return { success: false, balance: 0, reason: 'INVALID_AMOUNT' };
    }

    const wallet = await this.prisma.userCredits.findUnique({
      where: { userId },
      select: { balance: true, totalBought: true, totalUsed: true },
    });

    const current = wallet?.balance ?? 0;

    if (current < amount) {
      return {
        success: false,
        balance: current,
        reason: 'INSUFFICIENT_POINTS',
      };
    }

    const updated = await this.prisma.userCredits.upsert({
      where: { userId },
      update: {
        balance: current - amount,
        totalUsed: (wallet?.totalUsed ?? 0) + amount,
      },
      create: {
        userId,
        balance: 0,
        totalBought: 0,
        totalUsed: amount,
      },
    });

    return {
      success: true,
      balance: updated.balance,
      spent: amount,
    };
  }

  async refundPoints(userId: string, amount: number) {
    if (!amount || amount <= 0) return null;

    const wallet = await this.prisma.userCredits.findUnique({
      where: { userId },
      select: { balance: true, totalBought: true, totalUsed: true },
    });

    const updated = await this.prisma.userCredits.upsert({
      where: { userId },
      update: {
        balance: (wallet?.balance ?? 0) + amount,
        totalBought: (wallet?.totalBought ?? 0) + amount,
      },
      create: {
        userId,
        balance: amount,
        totalBought: amount,
        totalUsed: 0,
      },
    });

    await this.notifService.create({
      userId,
      type: 'GAMIFICATION',
      message: `↩️ ${amount} Gatedo Points estornados automaticamente.`,
      cta: 'Ver Studio',
      metadata: { refunded: amount },
    });

    return updated;
  }

  async onStudioCreation(data: {
    userId: string;
    petId: string;
    toolSlug: string;
    publishToFeed?: boolean;
  }) {
    const tutorAction = this.resolveStudioTutorAction(data.toolSlug);
    const catAction = this.resolveStudioCatAction(data.toolSlug);

    const [tutor, cat] = await Promise.all([
      this._creditTutor(data.userId, tutorAction),
      this._creditCat(data.petId, catAction),
    ]);

    const pet = await this.prisma.pet.findUnique({
      where: { id: data.petId },
      select: { id: true, name: true, photoUrl: true },
    });

    await this.notifService.create({
      userId: data.userId,
      type: 'GAMIFICATION',
      petId: pet?.id,
      catName: pet?.name,
      catPhotoUrl: pet?.photoUrl,
      message: data.publishToFeed
        ? `✨ Criação do Studio concluída e publicada com sucesso.`
        : `✨ Criação do Studio concluída com sucesso.`,
      cta: data.publishToFeed ? 'Ver no Comunigato' : 'Ver Studio',
      metadata: {
        toolSlug: data.toolSlug,
        tutorReward: tutor,
        catReward: cat,
        published: !!data.publishToFeed,
      },
    });

    return { tutor, cat };
  }

  private async _creditTutor(userId: string, action: TutorAction) {
    const pts = TUTOR_POINTS[action];
    if (!pts) return null;

    const oneTimeActions = ['FIRST_CONSULT', 'PROFILE_COMPLETE', 'MEMORIAL_REGISTERED'];

    if (oneTimeActions.includes(action)) {
      const existing = await this.prisma.tutorPoints.findUnique({ where: { userId } });
      const alreadyEarned = (existing as any)?.[`earned_${action}`];
      if (alreadyEarned) return null;
    }

    let tutorMeta = await this.prisma.tutorPoints.findUnique({
      where: { userId },
      select: { points: true, totalEarned: true },
    });

    if (!tutorMeta) {
      tutorMeta = await this.prisma.tutorPoints.create({
        data: { userId, points: 0, totalEarned: 0, lastActionAt: new Date() },
        select: { points: true, totalEarned: true },
      });
    }

    const updatedTutor = await this.prisma.tutorPoints.update({
      where: { userId },
      data: {
        points: (tutorMeta.points ?? 0) + pts,
        totalEarned: (tutorMeta.totalEarned ?? 0) + pts,
        lastActionAt: new Date(),
      },
      select: { points: true, totalEarned: true },
    });

    let credits = await this.prisma.userCredits.findUnique({
      where: { userId },
      select: { balance: true, totalBought: true, totalUsed: true },
    });

    if (!credits) {
      credits = await this.prisma.userCredits.create({
        data: {
          userId,
          balance: 0,
          totalBought: 0,
          totalUsed: 0,
        },
        select: { balance: true, totalBought: true, totalUsed: true },
      });
    }

    const updatedCredits = await this.prisma.userCredits.update({
      where: { userId },
      data: {
        balance: (credits.balance ?? 0) + pts,
        totalBought: (credits.totalBought ?? 0) + pts,
      },
      select: { balance: true, totalBought: true, totalUsed: true },
    });

    await this.notifService.create({
      userId,
      type: 'GAMIFICATION',
      message: `⚡ +${pts} XP e +${pts} Gatedo Points.`,
      cta: 'Ver progresso',
      metadata: {
        action,
        xpGained: pts,
        pointsGained: pts,
        xpAfter: updatedTutor.totalEarned,
        pointsAfter: updatedCredits.balance,
      },
    });

    return {
      xp: updatedTutor.totalEarned,
      earnedPoints: updatedTutor.points,
      points: updatedCredits.balance,
      gained: pts,
    };
  }

  private async _creditCat(petId: string, action: CatAction) {
    const xpGain = CAT_XP[action];
    if (!xpGain || !petId) return null;

    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      select: { id: true, xp: true, level: true, name: true, ownerId: true },
    });

    if (!pet) return null;

    const oldXp = pet.xp || 0;
    const newXp = oldXp + xpGain;
    const oldLevel = getCatLevel(oldXp);
    const newLevel = getCatLevel(newXp);

    await this.prisma.pet.update({
      where: { id: petId },
      data: { xp: newXp, level: newLevel.level },
    });

    if (newLevel.level > oldLevel.level) {
      const user = await this.prisma.user.findFirst({
        where: { pets: { some: { id: petId } } },
        select: { id: true },
      });

      if (user) {
        await this.notifService.create({
          userId: user.id,
          type: 'GAMIFICATION',
          petId,
          catName: pet.name,
          message: `🎉 ${pet.name} subiu para o nível ${newLevel.level} — ${newLevel.label}!`,
          cta: 'Ver perfil',
          metadata: { oldLevel: oldLevel.level, newLevel: newLevel.level, xp: newXp },
        });
      }
    }

    return {
      xp: newXp,
      level: newLevel.level,
      gained: xpGain,
      leveledUp: newLevel.level > oldLevel.level,
    };
  }

  async onIgentConsult(userId: string, petId: string, isFirstEver: boolean) {
    await this.credit({
      userId,
      petId,
      action: 'IGENT_CONSULT',
      catXpAction: 'IGENT_CONSULT',
    });

    if (isFirstEver) {
      await this._creditTutor(userId, 'FIRST_CONSULT');
    }
  }

  async onHealthRecord(userId: string, petId: string, recordType: string) {
    const typeUpper = recordType.toUpperCase();

    const tutorAction = ['VACCINE'].includes(typeUpper)
      ? 'VACCINE_REGISTERED'
      : ['MEDICATION', 'MEDICINE', 'VERMIFUGE', 'PARASITE'].includes(typeUpper)
        ? 'MED_REGISTERED'
        : 'HEALTH_RECORD';

    const catAction = (CAT_XP[typeUpper as keyof typeof CAT_XP] !== undefined)
      ? typeUpper as CatAction
      : 'HEALTH_RECORD';

    await this.credit({
      userId,
      petId,
      action: tutorAction as TutorAction,
      catXpAction: catAction,
    });
  }

  async onCommunityPost(userId: string, isIgentTip: boolean) {
    const action: TutorAction = isIgentTip ? 'COMMUNITY_IGENT_TIP' : 'COMMUNITY_POST';
    await this._creditTutor(userId, action);
  }

  async onProfileComplete(userId: string) {
    await this._creditTutor(userId, 'PROFILE_COMPLETE');
  }

  async onMemorialRegistered(userId: string) {
    await this._creditTutor(userId, 'MEMORIAL_REGISTERED');
  }

  private resolveStudioTutorAction(toolSlug: string): TutorAction {
    switch (toolSlug) {
      case 'tutor-cat-montage':
        return 'STUDIO_TUTOR_CAT';
      case 'read-cat-mind':
        return 'STUDIO_MIND';
      case 'cat-dance':
        return 'STUDIO_DANCE';
      case 'cat-style-portrait':
        return 'STUDIO_STYLE';
      default:
        return 'STUDIO_CREATION';
    }
  }

  private resolveStudioCatAction(toolSlug: string): CatAction {
    switch (toolSlug) {
      case 'tutor-cat-montage':
        return 'STUDIO_TUTOR_CAT';
      case 'read-cat-mind':
        return 'STUDIO_MIND';
      case 'cat-dance':
        return 'STUDIO_DANCE';
      case 'cat-style-portrait':
        return 'STUDIO_STYLE';
      default:
        return 'STUDIO_CREATION';
    }
  }
}
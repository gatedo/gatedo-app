import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notifications/notification.service';

// ─── XP DOS GATOS ─────────────────────────────────────────────────────────────
const CAT_XP = {
  IGENT_CONSULT:   10,
  VACCINE:          5,
  MEDICATION:       5,
  MEDICINE:         5,
  VERMIFUGE:        4,
  PARASITE:         4,
  EXAM:             3,
  SURGERY:          3,
  HEALTH_RECORD:    2,
  DIARY_ENTRY:      1,
};

// ─── NÍVEIS DO GATO ───────────────────────────────────────────────────────────
const CAT_LEVELS = [
  { min: 0,   level: 1, label: 'Filhote'     },
  { min: 50,  level: 2, label: 'Explorador'  },
  { min: 150, level: 3, label: 'Aventureiro' },
  { min: 300, level: 4, label: 'Veterano'    },
  { min: 500, level: 5, label: 'Lendário'    },
];

function getCatLevel(xp: number) {
  for (let i = CAT_LEVELS.length - 1; i >= 0; i--)
    if (xp >= CAT_LEVELS[i].min) return CAT_LEVELS[i];
  return CAT_LEVELS[0];
}

// ─── PONTOS DO TUTOR ──────────────────────────────────────────────────────────
const TUTOR_POINTS = {
  IGENT_CONSULT:        10,
  FIRST_CONSULT:        30,  // one-time bonus
  VACCINE_REGISTERED:    5,
  MED_REGISTERED:        5,
  HEALTH_RECORD:         3,
  COMMUNITY_POST:       15,
  COMMUNITY_IGENT_TIP:  20,
  PROFILE_COMPLETE:     25,  // one-time
  MEMORIAL_REGISTERED:  15,  // one-time
};

@Injectable()
export class GamificationIntegration {
  constructor(
    private prisma: PrismaService,
    private notifService: NotificationService,
  ) {}

  // ─── MÉTODO PRINCIPAL: credita tutor + gato simultaneamente ──────────────
  async credit(data: {
    userId:  string;
    petId:   string;
    action:  keyof typeof TUTOR_POINTS;
    catXpAction?: keyof typeof CAT_XP;
  }) {
    const [tutorResult, catResult] = await Promise.all([
      this._creditTutor(data.userId, data.action),
      this._creditCat(data.petId, data.catXpAction || data.action as any),
    ]);

    return { tutor: tutorResult, cat: catResult };
  }

  // ─── CRÉDITO DO TUTOR ─────────────────────────────────────────────────────
  private async _creditTutor(userId: string, action: keyof typeof TUTOR_POINTS) {
    const pts = TUTOR_POINTS[action];
    if (!pts) return null;

    // One-time bonuses — verifica se já ganhou antes
    const oneTimeActions = ['FIRST_CONSULT', 'PROFILE_COMPLETE', 'MEMORIAL_REGISTERED'];
    if (oneTimeActions.includes(action)) {
      const existing = await this.prisma.tutorPoints.findUnique({ where: { userId } });
      const alreadyEarned = (existing as any)?.[`earned_${action}`];
      if (alreadyEarned) return null;
    }

    return this.notifService.addPoints(userId, action as any);
  }

  // ─── CRÉDITO DO GATO (XP) ────────────────────────────────────────────────
  private async _creditCat(petId: string, action: keyof typeof CAT_XP) {
    const xpGain = CAT_XP[action];
    if (!xpGain || !petId) return null;

    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      select: { id: true, xp: true, level: true, name: true, ownerId: true },
    });

    if (!pet) return null;

    const oldXp     = pet.xp || 0;
    const newXp     = oldXp + xpGain;
    const oldLevel  = getCatLevel(oldXp);
    const newLevel  = getCatLevel(newXp);

    await this.prisma.pet.update({
      where: { id: petId },
      data: { xp: newXp, level: newLevel.level },
    });

    // Level up do gato — notifica tutor
    if (newLevel.level > oldLevel.level) {
      const user = await this.prisma.user.findFirst({
        where: { pets: { some: { id: petId } } },
        select: { id: true },
      });

      if (user) {
        await this.notifService.create({
          userId:  user.id,
          type:    'GAMIFICATION',
          petId,
          catName: pet.name,
          message: `🎉 ${pet.name} subiu para o nível ${newLevel.level} — ${newLevel.label}!`,
          cta:     'Ver perfil',
          metadata: { oldLevel: oldLevel.level, newLevel: newLevel.level, xp: newXp },
        });
      }
    }

    return { xp: newXp, level: newLevel.level, gained: xpGain, leveledUp: newLevel.level > oldLevel.level };
  }

  // ─── HELPERS PRONTOS PARA CADA CONTROLLER ────────────────────────────────

  // Chamado pelo igent.controller após createSession
  async onIgentConsult(userId: string, petId: string, isFirstEver: boolean) {
    await this.credit({ userId, petId, action: 'IGENT_CONSULT', catXpAction: 'IGENT_CONSULT' });
    if (isFirstEver) {
      await this._creditTutor(userId, 'FIRST_CONSULT');
    }
  }

  // Chamado pelo health-record.controller após POST
  async onHealthRecord(userId: string, petId: string, recordType: string) {
    const typeUpper = recordType.toUpperCase();

    const tutorAction = ['VACCINE'].includes(typeUpper)
      ? 'VACCINE_REGISTERED'
      : ['MEDICATION','MEDICINE','VERMIFUGE','PARASITE'].includes(typeUpper)
      ? 'MED_REGISTERED'
      : 'HEALTH_RECORD';

    const catAction = (CAT_XP[typeUpper as keyof typeof CAT_XP] !== undefined)
      ? typeUpper as keyof typeof CAT_XP
      : 'HEALTH_RECORD';

    await this.credit({ userId, petId, action: tutorAction as any, catXpAction: catAction });
  }

  // Chamado pelo posts.controller após criar post
  async onCommunityPost(userId: string, isIgentTip: boolean) {
    const action = isIgentTip ? 'COMMUNITY_IGENT_TIP' : 'COMMUNITY_POST';
    await this._creditTutor(userId, action as any);
  }

  // Chamado pelo pets.controller quando perfil está completo
  async onProfileComplete(userId: string) {
    await this._creditTutor(userId, 'PROFILE_COMPLETE');
  }

  // Chamado pelo pets.controller quando deathCause é registrado
  async onMemorialRegistered(userId: string) {
    await this._creditTutor(userId, 'MEMORIAL_REGISTERED');
  }
}
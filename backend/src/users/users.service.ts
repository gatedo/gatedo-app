import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt'; // <--- Importante para criptografar a senha
import { getPlanFromUser, normalizeBadges } from '../membership/membership.constants';
import { awardUserBadge, ONBOARDING_TOUR_BADGE } from '../gamification/badge.utils';
import { EventsService } from '../events/events.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private events: EventsService) {}

  // --- ESTATÍSTICAS ---
  async getDashboardStats() {
    const totalUsers = await this.prisma.user.count();
    const today = new Date();
    today.setHours(0,0,0,0);
    const newUsersToday = await this.prisma.user.count({ where: { createdAt: { gte: today } } });
    const totalPets = await this.prisma.pet.count();
    return { totalUsers, newUsersToday, totalPets, activeUsers: totalUsers };
  }

  // --- CRUD ---

  // CRIAR USUÁRIO (Agora com Hash de Senha)
  async create(data: Prisma.UserCreateInput) {
    // Se vier senha, criptografa antes de salvar
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.prisma.user.create({ data });
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        tutorTitle: true,
        role: true,
        status: true,
        createdAt: true,
        photoUrl: true,
        plan: true,
        planExpires: true,
        badges: true,
        xpt: true,
        gatedoPoints: true,
        level: true,
        pets: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
        subscription: {
          select: {
            id: true,
            provider: true,
            planType: true,
            status: true,
            startedAt: true,
            expiresAt: true,
            autoRenew: true,
            updatedAt: true,
          },
        },
      },
    });

    return users.map((user) => ({
      ...user,
      plan: getPlanFromUser(user),
      badges: normalizeBadges(user.badges),
    }));
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { pets: true } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, data: any) {
    // Se o Admin estiver alterando a senha, precisamos criptografar de novo
    if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
    } else {
        delete data.password; // Se não mandou senha, remove o campo pra não salvar vazio
    }
    delete data.id;
    delete data.pets;

    return this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: string) {
    const deletePets = this.prisma.pet.deleteMany({ where: { ownerId: id } });
    const deleteUser = this.prisma.user.delete({ where: { id } });
    return this.prisma.$transaction([deletePets, deleteUser]);
  }

  // ─── Bloco "Apoie o GATEDO" ────────────────────────────────────────────
  // Sem contrapartida — só controla timing: uma vez pós-PDF, 90 dias de
  // silêncio depois de dispensado (vale pros dois lugares onde aparece).
  private static readonly DONATION_SUPPRESS_MS = 90 * 24 * 60 * 60 * 1000;

  async getDonationState(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { donationPromptSeenAt: true, donationDismissedAt: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const suppressed = user.donationDismissedAt
      ? Date.now() - new Date(user.donationDismissedAt).getTime() < UsersService.DONATION_SUPPRESS_MS
      : false;

    return { seenPostPdf: Boolean(user.donationPromptSeenAt), suppressed };
  }

  /**
   * Gatilho do "momento de valor" — gerar o PDF pro veterinário. Não mostra
   * nada na aba Saúde (regra dura, mesma do motor de ofertas): cria uma
   * notificação chamando pro Perfil, onde o bloco de fato mora. Só dispara
   * uma vez na vida do usuário, e nunca durante os 90 dias após dispensado.
   */
  async notifyDonationAfterPdf(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { donationPromptSeenAt: true, donationDismissedAt: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    if (user.donationPromptSeenAt) return { notified: false };

    const suppressed = user.donationDismissedAt
      ? Date.now() - new Date(user.donationDismissedAt).getTime() < UsersService.DONATION_SUPPRESS_MS
      : false;
    if (suppressed) return { notified: false };

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { donationPromptSeenAt: new Date() } }),
      this.prisma.notification.create({
        data: {
          userId,
          type: 'SUPPORT_GATEDO',
          message: 'Gerou o PDF pro veterinário — se quiser, tem um jeito simples de apoiar o GATEDO no seu perfil.',
          cta: 'Ver perfil',
          metadata: {},
        },
      }),
    ]);
    return { notified: true };
  }

  async dismissDonationPrompt(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { donationDismissedAt: new Date() } });
    return { ok: true };
  }

  // ─── Tour de boas-vindas ─────────────────────────────────────────────────
  // 0 nunca começou · 1 boas-vindas vista · 2 gato cadastrado · 3 peso
  // registrado · 4 Saúde mostrada · 5 concluído (selo dado). Avança só pra
  // frente — nunca regride um passo já confirmado.
  async getOnboardingState(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingStep: true, onboardingCompletedAt: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // Contas que já têm gato cadastrado (inclusive de antes desse campo
    // existir) nunca devem ver o convite de onboarding de novo — completa
    // retroativamente em vez de ficar pedindo pra sempre.
    if (!user.onboardingCompletedAt) {
      const hasActivePet = await this.prisma.pet.findFirst({
        where: { ownerId: userId, isMemorial: false, isArchived: false },
        select: { id: true },
      });
      if (hasActivePet) {
        const result = await this.completeOnboarding(userId);
        return { step: 5, completedAt: new Date(), badge: result.badge };
      }
    }

    return { step: user.onboardingStep, completedAt: user.onboardingCompletedAt };
  }

  async advanceOnboarding(userId: string, step: number) {
    const safeStep = Math.max(0, Math.min(5, Math.trunc(Number(step) || 0)));
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { onboardingStep: true } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    if (safeStep <= user.onboardingStep) return { step: user.onboardingStep };

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingStep: safeStep },
      select: { onboardingStep: true },
    });
    return { step: updated.onboardingStep };
  }

  async completeOnboarding(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompletedAt: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    if (user.onboardingCompletedAt) return { alreadyCompleted: true, badge: ONBOARDING_TOUR_BADGE };

    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingStep: 5, onboardingCompletedAt: new Date() },
    });
    const badgeResult = await awardUserBadge(this.prisma, userId, ONBOARDING_TOUR_BADGE);
    if (badgeResult.awarded) {
      this.events.track({ name: 'badge_earned', userId, props: { badge_id: ONBOARDING_TOUR_BADGE } }).catch(() => {});
    }

    return { alreadyCompleted: false, badge: ONBOARDING_TOUR_BADGE, ...badgeResult };
  }

  async updateReminderPreferences(
    userId: string,
    prefs: { remindersPushEnabled?: boolean; remindersEmailEnabled?: boolean; reminderPreferredTime?: 'MORNING' | 'AFTERNOON' },
  ) {
    const data: any = {};
    if (typeof prefs.remindersPushEnabled === 'boolean') data.remindersPushEnabled = prefs.remindersPushEnabled;
    if (typeof prefs.remindersEmailEnabled === 'boolean') data.remindersEmailEnabled = prefs.remindersEmailEnabled;
    if (prefs.reminderPreferredTime === 'MORNING' || prefs.reminderPreferredTime === 'AFTERNOON') {
      data.reminderPreferredTime = prefs.reminderPreferredTime;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: { remindersPushEnabled: true, remindersEmailEnabled: true, reminderPreferredTime: true },
    });
    return updated;
  }
}

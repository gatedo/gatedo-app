import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// ─── TIPOS DE NOTIFICAÇÃO ─────────────────────────────────────────────────────
export type NotifType =
  | 'MED_REMINDER'
  | 'VACCINE_DUE'
  | 'VACCINE_OVERDUE'
  | 'IGENT_ALERT'
  | 'IGENT_PREDICTIVE'
  | 'COMMUNITY_REPLY'
  | 'COMMUNITY_LIKE'
  | 'VET_CONFIRM'
  | 'GAMIFICATION'
  | 'SYSTEM';

// ─── SISTEMA DE NÍVEIS (GAMIFICAÇÃO) ─────────────────────────────────────────
export const LEVELS = [
  { min: 0,    max: 99,   label: 'Gateiro Curioso',  emoji: '🐾', color: '#9CA3AF' },
  { min: 100,  max: 299,  label: 'Gateiro Raiz',     emoji: '😺', color: '#6158ca' },
  { min: 300,  max: 599,  label: 'Guardião Felino',  emoji: '🛡️', color: '#0EA5E9' },
  { min: 600,  max: 999,  label: 'Especialista IA',  emoji: '🤖', color: '#8B5CF6' },
  { min: 1000, max: 1999, label: 'Embaixador Gatedo',emoji: '👑', color: '#F59E0B' },
  { min: 2000, max: Infinity, label: 'Lenda Felina', emoji: '✨', color: '#EC4899' },
];

// Pontos por ação
export const POINTS = {
  IGENT_CONSULT:        10,  // consulta com iGentVet
  VACCINE_REGISTERED:    5,  // vacina registrada
  MED_REGISTERED:        5,  // medicação registrada
  HEALTH_RECORD:         3,  // qualquer registro de saúde
  COMMUNITY_POST:       15,  // post no Comunigato
  COMMUNITY_IGENT_TIP:  20,  // post com dica do iGentVet (maior valor)
  COMMUNITY_LIKE_GOT:    2,  // recebeu curtida
  PROFILE_COMPLETE:     25,  // completou perfil do gato (foto, raça, etc)
  FIRST_CONSULT:        30,  // primeira consulta com iGentVet (one-time)
  MEMORIAL_REGISTERED:  15,  // registrou causa mortis (contribuição para IA)
};

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  // ─── BUSCA NOTIFICAÇÕES DO USUÁRIO ────────────────────────────────────────
  async getNotifications(userId: string, limit = 30) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ─── CRIA NOTIFICAÇÃO ─────────────────────────────────────────────────────
  async create(data: {
    userId: string;
    type: NotifType;
    message: string;
    petId?: string;
    catName?: string;
    catBreed?: string;
    catPhotoUrl?: string;
    cta?: string;
    metadata?: any;
  }) {
    return this.prisma.notification.create({
      data: {
        userId:      data.userId,
        type:        data.type,
        message:     data.message,
        petId:       data.petId       || null,
        catName:     data.catName     || null,
        catBreed:    data.catBreed    || null,
        catPhotoUrl: data.catPhotoUrl || null,
        cta:         data.cta         || null,
        metadata:    data.metadata    || {},
        read:        false,
      },
    });
  }

  // ─── MARCAR COMO LIDA ─────────────────────────────────────────────────────
  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  // ─── DELETAR ──────────────────────────────────────────────────────────────
  async delete(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }

  // ─── CALENDÁRIO DE VACINAS — gera notifs automáticas ──────────────────────
  // Chamado por cron job (ex: @Cron('0 9 * * *') — todo dia às 9h)
  async generateVaccineReminders() {
    const today    = new Date();
    const in7days  = new Date(today); in7days.setDate(today.getDate() + 7);
    const in30days = new Date(today); in30days.setDate(today.getDate() + 30);

    const dueSoon = await this.prisma.healthRecord.findMany({
      where: {
        type: 'VACCINE',
        nextDueDate: { gte: today, lte: in30days },
      },
      include: { pet: true },
    });

    const overdue = await this.prisma.healthRecord.findMany({
      where: {
        type: 'VACCINE',
        nextDueDate: { lt: today },
      },
      include: { pet: true },
    });

    // Cria notificações para vencimentos próximos
    for (const record of dueSoon) {
      const userId = record.pet?.ownerId; // Pet.ownerId === User.id direto
      if (!userId) continue;

      const daysLeft = Math.ceil((new Date(record.nextDueDate).getTime() - today.getTime()) / 86400000);

      // Evita duplicar notif se já existe uma não lida para esta vacina
      const existing = await this.prisma.notification.findFirst({
        where: { userId, type: 'VACCINE_DUE', petId: record.petId, read: false },
      });
      if (existing) continue;

      await this.create({
        userId,
        type: 'VACCINE_DUE',
        petId: record.petId,
        catName: record.pet.name,
        catBreed: record.pet.breed,
        catPhotoUrl: record.pet.photoUrl,
        message: `Vacina "${record.title}" de ${record.pet.name} vence em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`,
        cta: 'Ver calendário',
        metadata: { recordId: record.id, daysLeft },
      });
    }

    // Cria notificações para vencidos
    for (const record of overdue) {
      const userId = record.pet?.ownerId; // Pet.ownerId === User.id direto
      if (!userId) continue;

      const existing = await this.prisma.notification.findFirst({
        where: { userId, type: 'VACCINE_OVERDUE', petId: record.petId, read: false },
      });
      if (existing) continue;

      await this.create({
        userId,
        type: 'VACCINE_OVERDUE',
        petId: record.petId,
        catName: record.pet.name,
        catBreed: record.pet.breed,
        catPhotoUrl: record.pet.photoUrl,
        message: `⚠️ Vacina "${record.title}" de ${record.pet.name} está VENCIDA`,
        cta: 'Agendar agora',
        metadata: { recordId: record.id },
      });
    }

    return { dueSoon: dueSoon.length, overdue: overdue.length };
  }

  // ─── GAMIFICAÇÃO — adiciona pontos + gera notif de conquista ──────────────
  async addPoints(userId: string, action: keyof typeof POINTS, context?: { petName?: string; catPhotoUrl?: string }) {
    const points = POINTS[action];
    if (!points) return;

    // Busca ou cria registro de pontos
    let gamif = await this.prisma.tutorPoints.findUnique({ where: { userId } });

    if (!gamif) {
      gamif = await this.prisma.tutorPoints.create({
        data: { userId, points: 0, totalEarned: 0 },
      });
    }

    const oldPoints = gamif.points;
    const newPoints = oldPoints + points;

    await this.prisma.tutorPoints.update({
      where: { userId },
      data: {
        points:       newPoints,
        totalEarned:  gamif.totalEarned + points,
        lastActionAt: new Date(),
      },
    });

    // Verifica se subiu de nível
    const oldLevel = LEVELS.find(l => oldPoints >= l.min && oldPoints <= l.max);
    const newLevel = LEVELS.find(l => newPoints >= l.min && newPoints <= l.max);

    if (oldLevel && newLevel && oldLevel.label !== newLevel.label) {
      // Level up! — cria notificação de conquista
      await this.create({
        userId,
        type: 'GAMIFICATION',
        message: `${newLevel.emoji} Você subiu para ${newLevel.label}! Continue cuidando bem dos seus gatos.`,
        catName: context?.petName,
        catPhotoUrl: context?.catPhotoUrl,
        cta: 'Ver conquistas',
        metadata: { newLevel: newLevel.label, points: newPoints },
      });
    }

    return { points: newPoints, level: newLevel };
  }

  // ─── GAMIFICAÇÃO — busca pontos e nível ───────────────────────────────────
  async getPoints(userId: string) {
    const gamif = await this.prisma.tutorPoints.findUnique({ where: { userId } });
    const pts   = gamif?.points || 0;
    const level = LEVELS.find(l => pts >= l.min && pts <= l.max) || LEVELS[0];

    // Próximo nível
    const levelIdx = LEVELS.findIndex(l => l.label === level.label);
    const nextLevel = levelIdx < LEVELS.length - 1 ? LEVELS[levelIdx + 1] : null;
    const progressPct = nextLevel
      ? Math.round(((pts - level.min) / (nextLevel.min - level.min)) * 100)
      : 100;

    return {
      points: pts,
      totalEarned: gamif?.totalEarned || 0,
      level,
      nextLevel,
      progressPct,
    };
  }

  // ─── IA PREDITIVA — notificação de alerta cross-cat ──────────────────────
  async sendPredictiveAlert(data: {
    userId: string;
    livePetId: string;
    livePetName: string;
    livePetBreed: string;
    riskCondition: string;  // ex: 'IRC'
    deceasedPetNames: string[];
  }) {
    return this.create({
      userId: data.userId,
      type: 'IGENT_PREDICTIVE',
      petId: data.livePetId,
      catName: data.livePetName,
      catBreed: data.livePetBreed,
      message: `🧠 IA Preditiva: ${data.deceasedPetNames.length} ${data.livePetBreed}(s) em seu histórico tiveram ${data.riskCondition}. Monitore ${data.livePetName} de perto.`,
      cta: 'Consultar iGentVet',
      metadata: {
        riskCondition:   data.riskCondition,
        deceasedPets:    data.deceasedPetNames,
        breed:           data.livePetBreed,
      },
    });
  }
  // ─── GAMIFICAÇÃO — stats completo para conquistas ────────────────────────
  async getStats(userId: string) {
    // Busca todos os pets do owner
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        pets: {
          include: {
            healthRecords: true,
            igentSessions: true,
          },
        },
        posts:           { select: { id: true } },
        studioCreations: { select: { id: true } },
      },
    });

    if (!user) return null;

    const allRecords   = user.pets.flatMap((p) => p.healthRecords);
    const allSessions  = user.pets.flatMap((p) => p.igentSessions);
    const now          = new Date();

    // Vacinas
    const vaccines      = allRecords.filter((r) => r.type === 'VACCINE');
    const overdueVaccines = vaccines.filter(
      (r) => r.nextDueDate && new Date(r.nextDueDate) < now
    ).length;

    // Medicações controladas
    const controlledMeds = allRecords.filter(
      (r) => ['MEDICATION','MEDICINE'].includes(r.type) && (r as any).isControlled
    ).length;

    // Consulta noturna (meia-noite às 4h)
    const nightConsult = allSessions.some((s) => {
      const h = new Date(s.date).getHours();
      return h >= 0 && h < 4;
    });

    // Perfil completo (primeiro pet com foto + raça + peso + bio)
    const profileComplete = user.pets.some(
      (p) => p.photoUrl && p.breed && p.weight && p.bio
    );

    // Gatos com memorial registrado
    const memorialRegistered = user.pets.some((p) => p.deathCause);

    // Posts com igentSession compartilhada (tipo IGENT_TIP)
    const igentTipsShared = (user.posts as any[]).filter(
      (p) => p.type === 'IGENT_TIP'
    ).length;

    return {
      igentConsults:      allSessions.length,
      vaccinesRegistered: vaccines.length,
      overdueVaccines,
      controlledMeds,
      nightConsult,
      profileComplete,
      memorialRegistered,
      totalCats:          user.pets.length,
      posts:              user.posts.length,
      igentTipsShared,
      studioCreations:    user.studioCreations.length,
      healthStreak:       0, // TODO: calcular streak real
      isFounder:          user.plan === 'FOUNDER' || user.badges?.includes('FOUNDER'),
    };
  }

}